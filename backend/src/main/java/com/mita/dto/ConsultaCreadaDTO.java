package com.mita.dto;

public record ConsultaCreadaDTO(
        ConsultaDTO consulta,
        String mensajeWhatsApp,
        String enlaceWhatsApp
) {
}
