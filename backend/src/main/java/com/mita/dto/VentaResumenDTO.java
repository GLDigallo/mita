package com.mita.dto;

import com.mita.entity.EstadoVenta;

import java.math.BigDecimal;
import java.time.Instant;

public record VentaResumenDTO(
        Long id,
        String numero,
        EstadoVenta estado,
        Instant fechaVenta,
        String empleado,
        String tiendaNombre,
        String clienteNombre,
        String clienteTelefono,
        String consultaNumero,
        BigDecimal importeTotal,
        int totalItems
) {
}
