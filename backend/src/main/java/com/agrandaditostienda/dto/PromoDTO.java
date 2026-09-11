package com.agrandaditostienda.dto;

import com.agrandaditostienda.entity.TipoPromo;

import java.math.BigDecimal;
import java.time.Instant;

public record PromoDTO(
        Long id,
        String titulo,
        TipoPromo tipo,
        BigDecimal valor,
        String tiendaSlug,
        Long productoId,
        String productoNombre,
        String productoImagen,
        boolean esDeProducto,
        Instant fechaInicio,
        Instant fechaFin,
        boolean activa
) {
}