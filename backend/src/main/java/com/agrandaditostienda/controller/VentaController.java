package com.agrandaditostienda.controller;

import com.agrandaditostienda.dto.ActualizarItemsVentaRequest;
import com.agrandaditostienda.dto.ConfirmarVentaRequest;
import com.agrandaditostienda.dto.VentaDTO;
import com.agrandaditostienda.dto.VentaResumenDTO;
import com.agrandaditostienda.entity.EstadoVenta;
import com.agrandaditostienda.security.Seguridad;
import com.agrandaditostienda.service.VentaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class VentaController {

    private final VentaService ventaService;

    public VentaController(VentaService ventaService) {
        this.ventaService = ventaService;
    }

    @PostMapping("/consultas/{id}/ventas")
    public ResponseEntity<VentaDTO> crearDesdeConsulta(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ventaService.crearDesdeConsulta(id, Seguridad.principalRequerido().nombre()));
    }

    @GetMapping("/ventas")
    public List<VentaResumenDTO> listar(@RequestParam(required = false) EstadoVenta estado,
                                        @RequestParam(required = false) Long tiendaId,
                                        @RequestParam(required = false) String busqueda) {
        return ventaService.listar(estado, tiendaId, busqueda);
    }

    @GetMapping("/ventas/{id}")
    public VentaDTO obtener(@PathVariable Long id) {
        return ventaService.obtener(id);
    }

    @GetMapping("/consultas/{id}/venta")
    public VentaDTO obtenerPorConsulta(@PathVariable Long id) {
        return ventaService.obtenerPorConsulta(id);
    }

    @PutMapping("/ventas/{id}/items")
    public VentaDTO actualizarItems(@PathVariable Long id,
                                    @Valid @RequestBody ActualizarItemsVentaRequest request) {
        return ventaService.actualizarItems(id, request, Seguridad.principalRequerido().nombre());
    }

    @PostMapping("/ventas/{id}/confirmar")
    public VentaDTO confirmar(@PathVariable Long id,
                              @Valid @RequestBody ConfirmarVentaRequest request) {
        return ventaService.confirmar(id, request, Seguridad.principalRequerido().nombre());
    }

    @PostMapping("/ventas/{id}/entregar")
    public VentaDTO entregar(@PathVariable Long id) {
        return ventaService.entregar(id, Seguridad.principalRequerido().nombre());
    }

    @PostMapping("/ventas/{id}/cancelar")
    public VentaDTO cancelar(@PathVariable Long id) {
        return ventaService.cancelar(id, Seguridad.principalRequerido().nombre());
    }
}
