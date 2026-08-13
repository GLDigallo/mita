package com.agrandaditostienda.dto;

import com.agrandaditostienda.entity.EstadoConsulta;
import com.agrandaditostienda.entity.FormaPago;

import java.time.Instant;
import java.util.List;

public record ConsultaDTO(
        Long id,
        String numero,
        int version,
        boolean editable,
        EstadoConsulta estado,
        FormaPago formaPago,
        Instant fechaConsulta,
        String tiendaSlug,
        String tiendaNombre,
        String tiendaWhatsapp,
        String clienteNombre,
        String clienteTelefono,
        String observaciones,
        int totalItems,
        List<ProductoConsultadoDTO> productos
) {
}
