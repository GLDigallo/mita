package com.mita.dto;

public record CategoriaDTO(
        Long id,
        String nombre,
        String slug,
        int orden
) {
}
