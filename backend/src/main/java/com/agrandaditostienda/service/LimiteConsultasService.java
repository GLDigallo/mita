package com.agrandaditostienda.service;

import com.agrandaditostienda.exception.DemasiadasConsultasException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LimiteConsultasService {

    private static final long VENTANA_MS = 30 * 60 * 1000L;
    private static final int MAX_POR_TELEFONO = 4;
    private static final int MAX_POR_IP = 10;
    private static final int MAX_CLAVES_GUARDADAS = 10_000;

    private final Map<String, ArrayDeque<Long>> porTelefono = new ConcurrentHashMap<>();
    private final Map<String, ArrayDeque<Long>> porIp = new ConcurrentHashMap<>();

    public void verificar(String telefono, String ip) {
        long ahora = Instant.now().toEpochMilli();
        if (!permitido(porTelefono, normalizarTelefono(telefono), MAX_POR_TELEFONO, ahora)) {
            throw new DemasiadasConsultasException(
                    "Se superó el límite de consultas para este número. Esperá unos minutos y volvé a intentar.");
        }
        if (!permitido(porIp, ip, MAX_POR_IP, ahora)) {
            throw new DemasiadasConsultasException(
                    "Se superó el límite de consultas. Esperá unos minutos y volvé a intentar.");
        }
    }

    private boolean permitido(Map<String, ArrayDeque<Long>> registros, String clave, int maximo, long ahora) {
        if (registros.size() > MAX_CLAVES_GUARDADAS) {
            purgarViejos(registros, ahora);
        }
        ArrayDeque<Long> marca = registros.computeIfAbsent(clave, k -> new ArrayDeque<>());
        synchronized (marca) {
            while (!marca.isEmpty() && marca.peekFirst() <= ahora - VENTANA_MS) {
                marca.pollFirst();
            }
            if (marca.size() >= maximo) {
                return false;
            }
            marca.addLast(ahora);
            return true;
        }
    }

    private void purgarViejos(Map<String, ArrayDeque<Long>> registros, long ahora) {
        registros.entrySet().removeIf(entrada -> {
            ArrayDeque<Long> marca = entrada.getValue();
            synchronized (marca) {
                if (marca.isEmpty() || marca.peekLast() <= ahora - VENTANA_MS) {
                    return true;
                }
                while (!marca.isEmpty() && marca.peekFirst() <= ahora - VENTANA_MS) {
                    marca.pollFirst();
                }
                return marca.isEmpty();
            }
        });
    }

    private String normalizarTelefono(String telefono) {
        return telefono == null ? "" : telefono.replaceAll("[^0-9]", "");
    }
}