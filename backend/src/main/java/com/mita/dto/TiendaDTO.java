package com.mita.dto;

import com.mita.entity.RangoEdad;

public record TiendaDTO(
        Long id,
        String nombre,
        String slug,
        RangoEdad rangoEdad,
        String etiquetaEdad,
        String descripcion,
        String colorPrimario,
        String colorSecundario,
        String imagenHero,
        String whatsapp,
        int orden
) {
}
