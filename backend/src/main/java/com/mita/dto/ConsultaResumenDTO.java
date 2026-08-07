package com.mita.dto;

import com.mita.entity.EstadoConsulta;

import java.time.Instant;

public record ConsultaResumenDTO(
        Long id,
        String numero,
        EstadoConsulta estado,
        Instant fechaConsulta,
        String tiendaSlug,
        String tiendaNombre,
        String clienteNombre,
        String clienteTelefono,
        int totalItems
) {
}
