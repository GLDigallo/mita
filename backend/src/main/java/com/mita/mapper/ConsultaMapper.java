package com.mita.mapper;

import com.mita.dto.ConsultaDTO;
import com.mita.dto.ConsultaVersionCambioDTO;
import com.mita.dto.ConsultaVersionDTO;
import com.mita.dto.ConsultaVersionItemDTO;
import com.mita.dto.ProductoConsultadoDTO;
import com.mita.dto.VarianteDTO;
import com.mita.entity.Consulta;
import com.mita.entity.ConsultaVersion;
import com.mita.entity.ConsultaVersionCambio;
import com.mita.entity.ConsultaVersionItem;
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
                formatearNumeroConVersion(consulta.getNumero(), version.getVersion()),
                sufijoVersion(version.getVersion()),
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
        return formatearNumeroConVersion(numero, 0);
    }

    public String formatearNumeroConVersion(Long numero, int version) {
        return String.format("C-%06d%s", numero, sufijoVersion(version));
    }

    private String sufijoVersion(int version) {
        if (version <= 0) {
            return "";
        }
        return String.valueOf((char) ('a' + (version - 1) % 26));
    }
}
