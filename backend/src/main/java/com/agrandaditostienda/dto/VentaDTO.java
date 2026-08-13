package com.agrandaditostienda.dto;

import com.agrandaditostienda.entity.EstadoVenta;
import com.agrandaditostienda.entity.MetodoPago;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record VentaDTO(
        Long id,
        String numero,
        EstadoVenta estado,
        Instant fechaVenta,
        String empleado,
        String tiendaSlug,
        String tiendaNombre,
        String clienteNombre,
        String clienteTelefono,
        Long consultaId,
        String consultaNumero,
        MetodoPago metodoPago,
        BigDecimal importeTotal,
        int totalItems,
        List<VentaItemDTO> items
) {
}
