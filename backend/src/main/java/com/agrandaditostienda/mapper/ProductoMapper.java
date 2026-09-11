package com.agrandaditostienda.mapper;

import com.agrandaditostienda.dto.PromoAplicadaDTO;
import com.agrandaditostienda.dto.ProductoDTO;
import com.agrandaditostienda.dto.VarianteDTO;
import com.agrandaditostienda.entity.Producto;
import com.agrandaditostienda.entity.VarianteProducto;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProductoMapper {

    private final VarianteMapper varianteMapper;

    public ProductoMapper(VarianteMapper varianteMapper) {
        this.varianteMapper = varianteMapper;
    }

    public ProductoDTO toDTO(Producto producto, List<VarianteProducto> variantes) {
        return toDTO(producto, variantes, null);
    }

    public ProductoDTO toDTO(Producto producto, List<VarianteProducto> variantes, PromoAplicadaDTO promo) {
        List<VarianteDTO> variantesDTO = variantes == null
                ? List.of()
                : variantes.stream().map(varianteMapper::toDTO).toList();
        return new ProductoDTO(
                producto.getId(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getPrecio(),
                producto.getImagen(),
                producto.getTalles(),
                producto.getGenero(),
                producto.isDestacado(),
                producto.getTienda().getSlug(),
                producto.getTienda().getNombre(),
                producto.getCategoria().getSlug(),
                producto.getCategoria().getNombre(),
                variantesDTO,
                promo != null ? promo.precio() : null,
                promo != null && promo.cambiaPrecio() ? producto.getPrecio() : null,
                promo != null ? promo.titulo() : null,
                promo != null ? promo.tipo() : null,
                promo != null ? promo.badge() : null
        );
    }
}