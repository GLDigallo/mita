package com.agrandaditostienda.dto;

import com.agrandaditostienda.entity.EstadoConsulta;
import jakarta.validation.constraints.NotNull;

public record CambiarEstadoConsultaRequest(
        @NotNull EstadoConsulta estado
) {
}
