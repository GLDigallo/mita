package com.agrandaditostienda.dto;

import com.agrandaditostienda.entity.RangoEdad;

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
