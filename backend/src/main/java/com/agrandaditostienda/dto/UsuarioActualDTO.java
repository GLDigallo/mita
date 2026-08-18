package com.agrandaditostienda.dto;

import com.agrandaditostienda.entity.RolUsuario;

public record UsuarioActualDTO(
        Long id,
        String usuario,
        String nombre,
        RolUsuario rol,
        Long tiendaId,
        String tiendaSlug,
        String tiendaNombre
) {
}
