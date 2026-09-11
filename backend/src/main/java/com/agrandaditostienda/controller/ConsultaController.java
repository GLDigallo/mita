package com.agrandaditostienda.controller;

import com.agrandaditostienda.dto.CambiarFormaPagoRequest;
import com.agrandaditostienda.dto.ConsultaCreadaDTO;
import com.agrandaditostienda.dto.ConsultaDTO;
import com.agrandaditostienda.dto.ConsultaResumenDTO;
import com.agrandaditostienda.dto.ConsultaVersionDTO;
import com.agrandaditostienda.dto.CrearConsultaRequest;
import com.agrandaditostienda.dto.ModificarConsultaRequest;
import com.agrandaditostienda.dto.NotaInternaRequest;
import com.agrandaditostienda.entity.EstadoConsulta;
import com.agrandaditostienda.service.ConsultaService;
import com.agrandaditostienda.service.LimiteConsultasService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consultas")
public class ConsultaController {

    private final ConsultaService consultaService;
    private final LimiteConsultasService limiteConsultasService;

    public ConsultaController(ConsultaService consultaService, LimiteConsultasService limiteConsultasService) {
        this.consultaService = consultaService;
        this.limiteConsultasService = limiteConsultasService;
    }

    @PostMapping
    public ResponseEntity<ConsultaCreadaDTO> crear(@Valid @RequestBody CrearConsultaRequest request,
                                                    HttpServletRequest http) {
        limiteConsultasService.verificar(request.telefono(), ip(http));
        return ResponseEntity.status(HttpStatus.CREATED).body(consultaService.crear(request));
    }

    private String ip(HttpServletRequest http) {
        String xForwarded = http.getHeader("X-Forwarded-For");
        if (xForwarded != null && !xForwarded.isBlank()) {
            return xForwarded.split(",")[0].trim();
        }
        String ip = http.getRemoteAddr();
        return ip == null ? "desconocida" : ip;
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

    @PatchMapping("/{id}/forma-pago")
    public ConsultaDTO cambiarFormaPago(@PathVariable Long id,
                                        @Valid @RequestBody CambiarFormaPagoRequest request) {
        return consultaService.cambiarFormaPago(id, request.formaPago());
    }

    @PutMapping("/{id}")
    public ConsultaDTO modificar(@PathVariable Long id,
                                 @Valid @RequestBody ModificarConsultaRequest request) {
        return consultaService.modificar(id, request);
    }

    @PatchMapping("/{id}/cancelar")
    public ConsultaDTO cancelar(@PathVariable Long id) {
        return consultaService.cancelar(id);
    }

    @PatchMapping("/{id}/nota-interna")
    public ConsultaDTO actualizarNotaInterna(@PathVariable Long id,
                                             @RequestBody NotaInternaRequest request) {
        return consultaService.actualizarNotaInterna(id, request.notaInterna());
    }

    @GetMapping("/{id}/versiones")
    public List<ConsultaVersionDTO> historial(@PathVariable Long id) {
        return consultaService.historial(id);
    }
}
