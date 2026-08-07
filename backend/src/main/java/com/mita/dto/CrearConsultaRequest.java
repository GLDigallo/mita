package com.mita.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CrearConsultaRequest(
        @NotBlank @Size(max = 80) String tiendaSlug,
        @Size(max = 120) String nombre,
        @NotBlank @Pattern(regexp = "^[0-9+ ]{7,20}$") String telefono,
        @Size(max = 1000) String observaciones,
        @NotEmpty @Valid List<ItemConsultaRequest> items
) {

    public record ItemConsultaRequest(
            @NotNull Long productoId,
            @Size(max = 40) String color,
            @NotBlank @Size(max = 20) String talle,
            @NotNull @Min(1) @Max(99) Integer cantidad,
            @Size(max = 500) String observaciones
    ) {
    }
}
