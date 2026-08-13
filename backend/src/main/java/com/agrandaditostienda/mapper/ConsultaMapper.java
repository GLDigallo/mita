package com.agrandaditostienda.mapper;

import com.agrandaditostienda.dto.ConsultaDTO;
import com.agrandaditostienda.dto.ConsultaVersionCambioDTO;
import com.agrandaditostienda.dto.ConsultaVersionDTO;
import com.agrandaditostienda.dto.ConsultaVersionItemDTO;
import com.agrandaditostienda.dto.ProductoConsultadoDTO;
import com.agrandaditostienda.dto.VarianteDTO;
import com.agrandaditostienda.entity.Consulta;
import com.agrandaditostienda.entity.ConsultaVersion;
import com.agrandaditostienda.entity.ConsultaVersionCambio;
import com.agrandaditostienda.entity.ConsultaVersionItem;
import com.agrandaditostienda.entity.ProductoConsultado;
import com.agrandaditostienda.entity.VarianteProducto;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class ConsultaMapper {

    private final VarianteMapper varianteMapper;

    public ConsultaMapper(VarianteMapper varianteMapper) {
        this.varianteMapper = varianteMapper;
    }

    public ConsultaDTO toDTO(Consulta consulta,
                             Map<Long, List<VarianteProducto>> variantesPorProducto,
                             boolean editable) {
        List<ProductoConsultadoDTO> productos = consulta.getProductosConsultados().stream()
                .map(pc -> toProductoDTO(pc, variantesPorProducto))
                .toList();
        int totalItems = consulta.getProductosConsultados().stream()
                .mapToInt(ProductoConsultado::getCantidad)
                .sum();
        return new ConsultaDTO(
                consulta.getId(),
                formatearNumeroConVersion(consulta.getNumero(), consulta.getVersion()),
                consulta.getVersion(),
                editable,
                consulta.getEstado(),
                consulta.getFormaPago(),
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

    public ConsultaVersionDTO toVersionDTO(Consulta consulta, ConsultaVersion version) {
        return new ConsultaVersionDTO(
                version.getId(),
                version.getVersion(),
                formatearNumero(consulta.getNumero()),
                String.format("v%d", version.getVersion() + 1),
                version.getEstado(),
                version.getFecha(),
                version.getEmpleado(),
                version.getMotivo(),
                version.getMotivo() == null ? null : version.getMotivo().getEtiqueta(),
                version.getObservaciones(),
                version.getItems().stream().map(this::toVersionItemDTO).toList(),
                version.getCambios().stream().map(this::toVersionCambioDTO).toList()
        );
    }

    private ConsultaVersionItemDTO toVersionItemDTO(ConsultaVersionItem item) {
        return new ConsultaVersionItemDTO(
                item.getProductoId(),
                item.getProductoNombre(),
                item.getProductoImagen(),
                item.getTalle(),
                item.getColor(),
                item.getCantidad(),
                item.getPrecioUnitario(),
                item.getObservaciones()
        );
    }

    private ConsultaVersionCambioDTO toVersionCambioDTO(ConsultaVersionCambio cambio) {
        return new ConsultaVersionCambioDTO(cambio.getTipo(), cambio.getDescripcion());
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
        return "O-" + numero;
    }

    public String formatearNumeroConVersion(Long numero, int version) {
        return formatearNumero(numero);
    }
}
