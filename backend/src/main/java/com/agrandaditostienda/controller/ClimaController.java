package com.agrandaditostienda.controller;

import com.agrandaditostienda.dto.ClimaDTO;
import com.agrandaditostienda.service.ClimaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ClimaController {

    private final ClimaService climaService;

    public ClimaController(ClimaService climaService) {
        this.climaService = climaService;
    }

    @GetMapping("/clima")
    public ClimaDTO clima() {
        return climaService.obtener();
    }
}
