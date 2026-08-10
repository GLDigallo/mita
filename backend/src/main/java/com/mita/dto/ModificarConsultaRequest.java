package com.mita.dto;

import com.mita.entity.MotivoModificacion;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ModificarConsultaRequest(
        @NotNull(message = "El motivo de la modificación es obligatorio")
        MotivoModificacion motivo,

        @Size(max = 1000)
        String observaciones,

        @NotEmpty(message = "La consulta debe tener al menos un producto")
        @Valid
        List<CrearConsultaRequest.ItemConsultaRequest> items
) {
}
