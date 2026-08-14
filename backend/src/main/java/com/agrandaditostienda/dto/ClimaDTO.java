package com.agrandaditostienda.dto;

import java.time.LocalTime;

public record ClimaDTO(
        String fase,
        LocalTime hora,
        LocalTime amanecer,
        LocalTime anochecer,
        Double temperatura,
        String condicion,
        boolean esLluvia
) {
}
