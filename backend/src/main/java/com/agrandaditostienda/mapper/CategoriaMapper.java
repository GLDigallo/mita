package com.agrandaditostienda.mapper;

import com.agrandaditostienda.dto.CategoriaDTO;
import com.agrandaditostienda.entity.Categoria;
import org.springframework.stereotype.Component;

@Component
public class CategoriaMapper {

    public CategoriaDTO toDTO(Categoria categoria) {
        return new CategoriaDTO(
                categoria.getId(),
                categoria.getNombre(),
                categoria.getSlug(),
                categoria.getOrden()
        );
    }
}
