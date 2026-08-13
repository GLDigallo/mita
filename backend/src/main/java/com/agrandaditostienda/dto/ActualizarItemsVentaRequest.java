package com.agrandaditostienda.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ActualizarItemsVentaRequest(
        @NotEmpty @Valid List<ItemVentaRequest> items
) {

    public record ItemVentaRequest(
            @NotNull Long productoId,
            @NotNull Long varianteId,
            @NotNull @Min(1) @Max(99) Integer cantidad
    ) {
    }
}
