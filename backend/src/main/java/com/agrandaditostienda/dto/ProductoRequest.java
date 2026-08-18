package com.agrandaditostienda.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record ProductoRequest(
        @NotBlank @Size(max = 120) String nombre,
        @Size(max = 500) String descripcion,
        @NotNull @Positive BigDecimal precio,
        @Size(max = 500) String imagen,
        @Size(max = 60) String talles,
        @NotNull String genero,
        boolean destacado,
        @NotNull @Size(min = 1) String categoriaSlug,
        @NotEmpty @Valid List<VarianteRequest> variantes
) {
    public record VarianteRequest(
            @NotBlank @Size(max = 40) String color,
            @NotBlank @Size(max = 20) String talle,
            @NotNull @Min(0) @Max(999) Integer stock
    ) {
    }
}
