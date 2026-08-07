package com.mita.controller;

import com.mita.dto.ActualizarItemsVentaRequest;
import com.mita.dto.ConfirmarVentaRequest;
import com.mita.dto.VentaDTO;
import com.mita.dto.VentaResumenDTO;
import com.mita.entity.EstadoVenta;
import com.mita.service.VentaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
    public ResponseEntity<VentaDTO> crearDesdeConsulta(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ventaService.crearDesdeConsulta(id, authentication.getName()));
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
                                    @Valid @RequestBody ActualizarItemsVentaRequest request,
                                    Authentication authentication) {
        return ventaService.actualizarItems(id, request, authentication.getName());
    }

    @PostMapping("/ventas/{id}/confirmar")
    public VentaDTO confirmar(@PathVariable Long id,
                              @Valid @RequestBody ConfirmarVentaRequest request,
                              Authentication authentication) {
        return ventaService.confirmar(id, request, authentication.getName());
    }

    @PostMapping("/ventas/{id}/entregar")
    public VentaDTO entregar(@PathVariable Long id, Authentication authentication) {
        return ventaService.entregar(id, authentication.getName());
    }

    @PostMapping("/ventas/{id}/cancelar")
    public VentaDTO cancelar(@PathVariable Long id, Authentication authentication) {
        return ventaService.cancelar(id, authentication.getName());
    }
}
