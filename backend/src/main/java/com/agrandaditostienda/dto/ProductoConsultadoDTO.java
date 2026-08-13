package com.agrandaditostienda.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProductoConsultadoDTO(
        Long id,
        Long productoId,
        String productoNombre,
        String productoImagen,
        String talle,
        String color,
        int cantidad,
        String observaciones,
        BigDecimal precioUnitario,
        List<VarianteDTO> variantes
) {
}
