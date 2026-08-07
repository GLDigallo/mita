package com.mita.controller;

import com.mita.dto.TiendaDTO;
import com.mita.service.TiendaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tiendas")
public class TiendaController {

    private final TiendaService tiendaService;

    public TiendaController(TiendaService tiendaService) {
        this.tiendaService = tiendaService;
    }

    @GetMapping
    public List<TiendaDTO> listarTiendas() {
        return tiendaService.listarTiendasActivas();
    }

    @GetMapping("/{slug}")
    public TiendaDTO obtenerTienda(@PathVariable String slug) {
        return tiendaService.obtenerTiendaPorSlug(slug);
    }
}
