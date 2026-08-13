package com.agrandaditostienda.mapper;

import com.agrandaditostienda.dto.VentaDTO;
import com.agrandaditostienda.dto.VentaItemDTO;
import com.agrandaditostienda.entity.Venta;
import com.agrandaditostienda.entity.VentaItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class VentaMapper {

    private final ConsultaMapper consultaMapper;

    public VentaMapper(ConsultaMapper consultaMapper) {
        this.consultaMapper = consultaMapper;
    }

    public VentaDTO toDTO(Venta venta) {
        List<VentaItemDTO> items = venta.getItems().stream()
                .map(this::toItemDTO)
                .toList();
        int totalItems = venta.getItems().stream()
                .mapToInt(VentaItem::getCantidad)
                .sum();
        return new VentaDTO(
                venta.getId(),
                formatearNumero(venta.getNumero()),
                venta.getEstado(),
                venta.getFechaVenta(),
                venta.getEmpleado(),
                venta.getTienda().getSlug(),
                venta.getTienda().getNombre(),
                venta.getCliente().getNombre(),
                venta.getCliente().getTelefono(),
                venta.getConsulta().getId(),
                consultaMapper.formatearNumeroConVersion(venta.getConsulta().getNumero(), venta.getConsulta().getVersion()),
                venta.getMetodoPago(),
                venta.getImporteTotal(),
                totalItems,
                items
        );
    }

    private VentaItemDTO toItemDTO(VentaItem item) {
        return new VentaItemDTO(
                item.getId(),
                item.getProducto().getId(),
                item.getProducto().getNombre(),
                item.getProducto().getImagen(),
                item.getVariante().getId(),
                item.getTalle(),
                item.getColor(),
                item.getCantidad(),
                item.getPrecioUnitario(),
                subtotal(item),
                item.getVariante().getStock()
        );
    }

    private BigDecimal subtotal(VentaItem item) {
        return item.getPrecioUnitario().multiply(BigDecimal.valueOf(item.getCantidad()));
    }

    public String formatearNumero(Long numero) {
        return "V-" + numero;
    }
}
