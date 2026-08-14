package com.agrandaditostienda.service;

import com.agrandaditostienda.dto.ClimaDTO;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;

@Service
public class ClimaService {

    private static final String API_URL = "https://api.open-meteo.com/v1/forecast"
            + "?latitude=-27.4698&longitude=-58.8306"
            + "&current=temperature_2m,is_day,weather_code"
            + "&daily=sunrise,sunset&timezone=auto&forecast_days=1";
    private static final ZoneId ZONA_CORRIENTES = ZoneId.of("America/Argentina/Cordoba");
    private static final Duration CACHE = Duration.ofMinutes(10);
    private static final LocalTime AMANECER_DEFECTO = LocalTime.of(7, 0);
    private static final LocalTime ANOCHECER_DEFECTO = LocalTime.of(19, 30);

    private final RestClient restClient;

    private volatile ClimaDTO cache;
    private volatile Instant cacheExpira;

    public ClimaService(RestClient.Builder builder) {
        this.restClient = builder.build();
    }

    public ClimaDTO obtener() {
        if (cache != null && Instant.now().isBefore(cacheExpira)) {
            return cache;
        }
        ClimaDTO nuevo = consultar();
        cache = nuevo;
        cacheExpira = Instant.now().plus(CACHE);
        return nuevo;
    }

    private ClimaDTO consultar() {
        try {
            JsonNode datos = restClient.get().uri(API_URL).retrieve().body(JsonNode.class);
            if (datos == null) {
                return porDefecto();
            }
            LocalTime hora = LocalTime.parse(horaDe(datos.path("current").path("time").asText()));
            LocalTime amanecer = LocalTime.parse(horaDe(datos.path("daily").path("sunrise").get(0).asText()));
            LocalTime anochecer = LocalTime.parse(horaDe(datos.path("daily").path("sunset").get(0).asText()));
            double temperatura = datos.path("current").path("temperature_2m").asDouble();
            int codigo = datos.path("current").path("weather_code").asInt();
            return new ClimaDTO(fase(hora, amanecer, anochecer), hora, amanecer, anochecer,
                    temperatura, descripcion(codigo), esLluvia(codigo));
        } catch (RuntimeException e) {
            return porDefecto();
        }
    }

    private ClimaDTO porDefecto() {
        LocalTime hora = LocalTime.now(ZONA_CORRIENTES);
        return new ClimaDTO(fase(hora, AMANECER_DEFECTO, ANOCHECER_DEFECTO), hora,
                AMANECER_DEFECTO, ANOCHECER_DEFECTO, null, null, false);
    }

    private String fase(LocalTime ahora, LocalTime amanecer, LocalTime anochecer) {
        if (ahora.isBefore(amanecer) || !ahora.isBefore(anochecer)) {
            return "noche";
        }
        return ahora.isBefore(LocalTime.of(13, 0)) ? "manana" : "tarde";
    }

    private boolean esLluvia(int codigo) {
        return (codigo >= 51 && codigo <= 67) || (codigo >= 80 && codigo <= 82);
    }

    private String descripcion(int codigo) {
        return switch (codigo) {
            case 0 -> "Despejado";
            case 1 -> "Mayormente despejado";
            case 2 -> "Parcialmente nublado";
            case 3 -> "Nublado";
            case 45, 48 -> "Niebla";
            case 51, 53, 55, 56, 57 -> "Llovizna";
            case 61, 63, 65 -> "Lluvia";
            case 66, 67 -> "Lluvia helada";
            case 71, 73, 75, 77 -> "Nieve";
            case 80, 81, 82 -> "Chaparrones";
            case 85, 86 -> "Chaparrones de nieve";
            case 95 -> "Tormenta";
            case 96, 99 -> "Tormenta con granizo";
            default -> "Condición variable";
        };
    }

    private String horaDe(String fechaHora) {
        return fechaHora.length() > 11 ? fechaHora.substring(11) : fechaHora;
    }
}
