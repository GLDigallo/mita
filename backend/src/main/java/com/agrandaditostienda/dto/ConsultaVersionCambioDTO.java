package com.agrandaditostienda.dto;

import com.agrandaditostienda.entity.TipoCambio;

public record ConsultaVersionCambioDTO(
        TipoCambio tipo,
        String descripcion
) {
}
