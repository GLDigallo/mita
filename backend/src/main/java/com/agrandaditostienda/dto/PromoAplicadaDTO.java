package com.agrandaditostienda.dto;

import com.agrandaditostienda.entity.TipoPromo;

import java.math.BigDecimal;

public record PromoAplicadaDTO(
        BigDecimal precio,
        String titulo,
        TipoPromo tipo,
        String badge,
        BigDecimal valor
) {
    public boolean cambiaPrecio() {
        return precio != null;
    }
}