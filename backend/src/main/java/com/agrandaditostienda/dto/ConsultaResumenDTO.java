package com.agrandaditostienda.dto;

import com.agrandaditostienda.entity.EstadoConsulta;
import com.agrandaditostienda.entity.FormaPago;

import java.time.Instant;

public record ConsultaResumenDTO(
        Long id,
        String numero,
        EstadoConsulta estado,
        FormaPago formaPago,
        Instant fechaConsulta,
        String tiendaSlug,
        String tiendaNombre,
        String clienteNombre,
        String clienteTelefono,
        int totalItems
) {
}
