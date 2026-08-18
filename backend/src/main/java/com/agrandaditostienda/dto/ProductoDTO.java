package com.agrandaditostienda.dto;

import com.agrandaditostienda.entity.Genero;

import java.math.BigDecimal;
import java.util.List;

public record ProductoDTO(
        Long id,
        String nombre,
        String descripcion,
        BigDecimal precio,
        String imagen,
        String talles,
        Genero genero,
        boolean destacado,
        String tiendaSlug,
        String tiendaNombre,
        String categoriaSlug,
        String categoriaNombre,
        List<VarianteDTO> variantes
) {
}
