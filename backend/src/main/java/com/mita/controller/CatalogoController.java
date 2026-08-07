package com.mita.controller;

import com.mita.dto.CategoriaDTO;
import com.mita.dto.ProductoDTO;
import com.mita.entity.Genero;
import com.mita.service.CatalogoService;
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
}
