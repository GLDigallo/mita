package com.agrandaditostienda.controller;

import com.agrandaditostienda.dto.CambiarEstadoConsultaRequest;
import com.agrandaditostienda.dto.CambiarFormaPagoRequest;
import com.agrandaditostienda.dto.ConsultaCreadaDTO;
import com.agrandaditostienda.dto.ConsultaDTO;
import com.agrandaditostienda.dto.ConsultaResumenDTO;
import com.agrandaditostienda.dto.ConsultaVersionDTO;
import com.agrandaditostienda.dto.CrearConsultaRequest;
import com.agrandaditostienda.dto.ModificarConsultaRequest;
import com.agrandaditostienda.entity.EstadoConsulta;
import com.agrandaditostienda.service.ConsultaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consultas")
public class ConsultaController {

    private final ConsultaService consultaService;

    public ConsultaController(ConsultaService consultaService) {
        this.consultaService = consultaService;
    }

    @PostMapping
    public ResponseEntity<ConsultaCreadaDTO> crear(@Valid @RequestBody CrearConsultaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(consultaService.crear(request));
    }

    @GetMapping
    public List<ConsultaResumenDTO> listar(@RequestParam(required = false) EstadoConsulta estado,
                                           @RequestParam(required = false) Long tiendaId,
                                           @RequestParam(required = false) String busqueda) {
        return consultaService.listar(estado, tiendaId, busqueda);
    }

    @GetMapping("/{id}")
    public ConsultaDTO obtener(@PathVariable Long id) {
        return consultaService.obtener(id);
    }

    @PatchMapping("/{id}/estado")
    public ConsultaDTO cambiarEstado(@PathVariable Long id,
                                     @Valid @RequestBody CambiarEstadoConsultaRequest request) {
        return consultaService.cambiarEstado(id, request.estado());
    }

    @PatchMapping("/{id}/forma-pago")
    public ConsultaDTO cambiarFormaPago(@PathVariable Long id,
                                        @RequestBody CambiarFormaPagoRequest request) {
        return consultaService.cambiarFormaPago(id, request.formaPago());
    }

    @PutMapping("/{id}")
    public ConsultaDTO modificar(@PathVariable Long id,
                                 @Valid @RequestBody ModificarConsultaRequest request) {
        return consultaService.modificar(id, request);
    }

    @GetMapping("/{id}/versiones")
    public List<ConsultaVersionDTO> historial(@PathVariable Long id) {
        return consultaService.historial(id);
    }
}
