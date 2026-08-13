package com.agrandaditostienda.dto;

import com.agrandaditostienda.entity.RolUsuario;

public record EncargadaDTO(
        Long id,
        String nombre,
        String username,
        RolUsuario rol,
        String tiendaSlug,
        String tiendaNombre,
        boolean activo
) {
}
