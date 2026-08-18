package com.agrandaditostienda.dto;

import com.agrandaditostienda.entity.FormaPago;
import jakarta.validation.constraints.NotNull;

public record CambiarFormaPagoRequest(
        @NotNull FormaPago formaPago
) {
}
