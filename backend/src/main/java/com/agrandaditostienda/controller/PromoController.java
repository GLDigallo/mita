package com.agrandaditostienda.controller;

import com.agrandaditostienda.dto.PromoDTO;
import com.agrandaditostienda.dto.PromoRequest;
import com.agrandaditostienda.service.PromoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promos")
public class PromoController {

    private final PromoService promoService;

    public PromoController(PromoService promoService) {
        this.promoService = promoService;
    }

    @GetMapping
    public List<PromoDTO> listar() {
        return promoService.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PromoDTO crear(@Valid @RequestBody PromoRequest request) {
        return promoService.crear(request);
    }

    @PatchMapping("/{id}")
    public PromoDTO alternarActiva(@PathVariable Long id, @Valid @RequestBody PromoRequest.ActivarRequest request) {
        return promoService.alternarActiva(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long id) {
        promoService.eliminar(id);
    }
}