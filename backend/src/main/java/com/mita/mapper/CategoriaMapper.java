package com.mita.mapper;

import com.mita.dto.CategoriaDTO;
import com.mita.entity.Categoria;
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
