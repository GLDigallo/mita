package com.mita.dto;

import com.mita.entity.TipoCambio;

public record ConsultaVersionCambioDTO(
        TipoCambio tipo,
        String descripcion
) {
}
