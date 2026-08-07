package com.mita.dto;

import com.mita.entity.MetodoPago;
import jakarta.validation.constraints.NotNull;

public record ConfirmarVentaRequest(
        @NotNull MetodoPago metodoPago
) {
}
