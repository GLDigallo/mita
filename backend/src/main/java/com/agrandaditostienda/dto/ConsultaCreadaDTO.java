package com.agrandaditostienda.dto;

public record ConsultaCreadaDTO(
        ConsultaDTO consulta,
        String mensajeWhatsApp,
        String enlaceWhatsApp
) {
}
