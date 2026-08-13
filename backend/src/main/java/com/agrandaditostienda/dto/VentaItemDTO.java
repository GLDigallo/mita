package com.agrandaditostienda.dto;

import java.math.BigDecimal;

public record VentaItemDTO(
        Long id,
        Long productoId,
        String productoNombre,
        String productoImagen,
        Long varianteId,
        String talle,
        String color,
        int cantidad,
        BigDecimal precioUnitario,
        BigDecimal subtotal,
        int stockDisponible
) {
}
