package com.agrandaditostienda.controller;

import com.agrandaditostienda.dto.CategoriaDTO;
import com.agrandaditostienda.dto.CategoriaRequest;
import com.agrandaditostienda.dto.ProductoDTO;
import com.agrandaditostienda.dto.ProductoRequest;
import com.agrandaditostienda.entity.Genero;
import com.agrandaditostienda.service.CatalogoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CatalogoController {

    private final CatalogoService catalogoService;

    public CatalogoController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }

    @GetMapping("/tiendas/{slug}/categorias")
    public List<CategoriaDTO> listarCategorias(@PathVariable String slug) {
        return catalogoService.listarCategoriasDeTienda(slug);
    }

    @PostMapping("/tiendas/{slug}/categorias")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoriaDTO crearCategoria(@PathVariable String slug, @Valid @RequestBody CategoriaRequest request) {
        return catalogoService.crearCategoria(slug, request);
    }

    @PutMapping("/categorias/{id}")
    public CategoriaDTO actualizarCategoria(@PathVariable Long id, @Valid @RequestBody CategoriaRequest request) {
        return catalogoService.actualizarCategoria(id, request);
    }

    @DeleteMapping("/categorias/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarCategoria(@PathVariable Long id) {
        catalogoService.eliminarCategoria(id);
    }

    @GetMapping("/tiendas/{slug}/generos")
    public List<Genero> listarGeneros(@PathVariable String slug) {
        return catalogoService.listarGenerosDeTienda(slug);
    }

    @GetMapping("/tiendas/{slug}/productos")
    public List<ProductoDTO> listarProductos(@PathVariable String slug,
                                             @RequestParam(required = false) String categoria,
                                             @RequestParam(required = false) String genero) {
        return catalogoService.listarProductosDeTienda(slug, categoria, genero);
    }

    @GetMapping("/productos/destacados")
    public List<ProductoDTO> listarDestacados() {
        return catalogoService.listarDestacados();
    }

    @GetMapping("/productos")
    public List<ProductoDTO> listarProductosGlobales() {
        return catalogoService.listarProductosGlobales();
    }

    @PostMapping("/tiendas/{slug}/productos")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductoDTO crearProducto(@PathVariable String slug, @Valid @RequestBody ProductoRequest request) {
        return catalogoService.crearProducto(slug, request);
    }

    @PutMapping("/productos/{id}")
    public ProductoDTO actualizarProducto(@PathVariable Long id, @Valid @RequestBody ProductoRequest request) {
        return catalogoService.actualizarProducto(id, request);
    }

    @DeleteMapping("/productos/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminarProducto(@PathVariable Long id) {
        catalogoService.eliminarProducto(id);
    }
}
