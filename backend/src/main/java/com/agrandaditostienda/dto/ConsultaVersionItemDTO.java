package com.agrandaditostienda.dto;

import java.math.BigDecimal;

public record ConsultaVersionItemDTO(
        Long productoId,
        String productoNombre,
        String productoImagen,
        String talle,
        String color,
        int cantidad,
        BigDecimal precioUnitario,
        String observaciones
) {
}
