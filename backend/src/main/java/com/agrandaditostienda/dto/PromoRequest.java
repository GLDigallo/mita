package com.agrandaditostienda.dto;

import com.agrandaditostienda.entity.TipoPromo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PromoRequest(
        @NotBlank @Size(max = 120) String titulo,
        @NotNull TipoPromo tipo,
        BigDecimal valor,
        String tiendaSlug,
        Long productoId,
        @NotBlank String fechaInicio,
        @NotBlank String fechaFin
) {
    public record ActivarRequest(boolean activa) {
    }
}