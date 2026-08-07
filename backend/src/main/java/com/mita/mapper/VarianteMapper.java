package com.mita.mapper;

import com.mita.dto.VarianteDTO;
import com.mita.entity.VarianteProducto;
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
