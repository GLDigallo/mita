package com.agrandaditostienda.mapper;

import com.agrandaditostienda.dto.VarianteDTO;
import com.agrandaditostienda.entity.VarianteProducto;
import org.springframework.stereotype.Component;

@Component
public class VarianteMapper {

    public VarianteDTO toDTO(VarianteProducto variante) {
        return new VarianteDTO(
                variante.getId(),
                variante.getColor(),
                variante.getTalle(),
                variante.getStock()
        );
    }
}
