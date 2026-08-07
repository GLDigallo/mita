package com.mita.mapper;

import com.mita.dto.ConsultaDTO;
import com.mita.dto.ProductoConsultadoDTO;
import com.mita.dto.VarianteDTO;
import com.mita.entity.Consulta;
import com.mita.entity.ProductoConsultado;
import com.mita.entity.VarianteProducto;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ConsultaMapper {

    private final VarianteMapper varianteMapper;

    public ConsultaMapper(VarianteMapper varianteMapper) {
        this.varianteMapper = varianteMapper;
    }

    public ConsultaDTO toDTO(Consulta consulta, Map<Long, List<VarianteProducto>> variantesPorProducto) {
        List<ProductoConsultadoDTO> productos = consulta.getProductosConsultados().stream()
                .map(pc -> toProductoDTO(pc, variantesPorProducto))
                .toList();
        int totalItems = consulta.getProductosConsultados().stream()
                .mapToInt(ProductoConsultado::getCantidad)
                .sum();
        return new ConsultaDTO(
                consulta.getId(),
                formatearNumero(consulta.getNumero()),
                consulta.getEstado(),
                consulta.getFechaConsulta(),
                consulta.getTienda().getSlug(),
                consulta.getTienda().getNombre(),
                consulta.getTienda().getWhatsapp(),
                consulta.getCliente().getNombre(),
                consulta.getCliente().getTelefono(),
                consulta.getObservaciones(),
                totalItems,
                productos
        );
    }

    private ProductoConsultadoDTO toProductoDTO(ProductoConsultado pc,
                                                Map<Long, List<VarianteProducto>> variantesPorProducto) {
        List<VarianteDTO> variantes = variantesPorProducto
                .getOrDefault(pc.getProducto().getId(), List.of())
                .stream()
                .map(varianteMapper::toDTO)
                .toList();
        return new ProductoConsultadoDTO(
                pc.getId(),
                pc.getProducto().getId(),
                pc.getProducto().getNombre(),
                pc.getProducto().getImagen(),
                pc.getTalle(),
                pc.getColor(),
                pc.getCantidad(),
                pc.getObservaciones(),
                pc.getPrecioUnitario(),
                variantes
        );
    }

    public String formatearNumero(Long numero) {
        return String.format("C-%06d", numero);
    }
}
