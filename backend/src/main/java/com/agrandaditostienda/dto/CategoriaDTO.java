package com.agrandaditostienda.dto;

public record CategoriaDTO(
        Long id,
        String nombre,
        String slug,
        int orden
) {
}
