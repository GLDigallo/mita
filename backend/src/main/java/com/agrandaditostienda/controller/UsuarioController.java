package com.agrandaditostienda.controller;

import com.agrandaditostienda.dto.CambiarEstadoUsuarioRequest;
import com.agrandaditostienda.dto.CrearEncargadaRequest;
import com.agrandaditostienda.dto.EncargadaDTO;
import com.agrandaditostienda.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dueño/encargadas")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public List<EncargadaDTO> listar() {
        return usuarioService.listarEncargadas();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EncargadaDTO crear(@Valid @RequestBody CrearEncargadaRequest request) {
        return usuarioService.crearEncargada(request);
    }

    @PatchMapping("/{id}/estado")
    public EncargadaDTO cambiarEstado(@PathVariable Long id,
                                      @Valid @RequestBody CambiarEstadoUsuarioRequest request) {
        return usuarioService.cambiarEstado(id, request);
    }
}
