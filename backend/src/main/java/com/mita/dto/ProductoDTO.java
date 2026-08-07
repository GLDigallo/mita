package com.mita.dto;

import com.mita.entity.Genero;

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
        String categoriaSlug,
        String categoriaNombre,
        List<VarianteDTO> variantes
) {
}
