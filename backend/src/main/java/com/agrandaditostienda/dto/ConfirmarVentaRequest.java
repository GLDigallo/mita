package com.agrandaditostienda.dto;

import com.agrandaditostienda.entity.MetodoPago;
import jakarta.validation.constraints.NotNull;

public record ConfirmarVentaRequest(
        @NotNull MetodoPago metodoPago
) {
}
