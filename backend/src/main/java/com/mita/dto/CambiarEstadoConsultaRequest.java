package com.mita.dto;

import com.mita.entity.EstadoConsulta;
import jakarta.validation.constraints.NotNull;

public record CambiarEstadoConsultaRequest(
        @NotNull EstadoConsulta estado
) {
}
