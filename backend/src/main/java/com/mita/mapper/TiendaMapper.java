package com.mita.mapper;

import com.mita.dto.TiendaDTO;
import com.mita.entity.Tienda;
import org.springframework.stereotype.Component;

@Component
public class TiendaMapper {

    public TiendaDTO toDTO(Tienda tienda) {
        return new TiendaDTO(
                tienda.getId(),
                tienda.getNombre(),
                tienda.getSlug(),
                tienda.getRangoEdad(),
                tienda.getEtiquetaEdad(),
                tienda.getDescripcion(),
                tienda.getColorPrimario(),
                tienda.getColorSecundario(),
                tienda.getImagenHero(),
                tienda.getWhatsapp(),
                tienda.getOrden()
        );
    }
}
