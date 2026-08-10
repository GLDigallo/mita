package com.mita.dto;

import com.mita.entity.EstadoConsulta;
import com.mita.entity.FormaPago;

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
