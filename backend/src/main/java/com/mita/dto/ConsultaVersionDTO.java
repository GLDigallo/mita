package com.mita.dto;

import com.mita.entity.EstadoConsulta;
import com.mita.entity.MotivoModificacion;

import java.time.Instant;
import java.util.List;

public record ConsultaVersionDTO(
        Long id,
        int version,
        String numero,
        String etiqueta,
        EstadoConsulta estado,
        Instant fecha,
        String empleado,
        MotivoModificacion motivo,
        String motivoEtiqueta,
        String observaciones,
        List<ConsultaVersionItemDTO> items,
        List<ConsultaVersionCambioDTO> cambios
) {
}
