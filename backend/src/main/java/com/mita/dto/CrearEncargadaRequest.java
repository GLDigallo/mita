package com.mita.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CrearEncargadaRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 80)
        String nombre,

        @NotBlank(message = "El usuario es obligatorio")
        @Size(min = 3, max = 60)
        String username,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, max = 72)
        String password,

        @NotBlank(message = "La tienda es obligatoria")
        String tiendaSlug
) {
}
