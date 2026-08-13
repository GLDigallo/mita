package com.agrandaditostienda.service;

import com.agrandaditostienda.dto.CategoriaDTO;
import com.agrandaditostienda.dto.ProductoDTO;
import com.agrandaditostienda.entity.Categoria;
import com.agrandaditostienda.entity.Genero;
import com.agrandaditostienda.entity.Producto;
import com.agrandaditostienda.entity.Tienda;
import com.agrandaditostienda.entity.VarianteProducto;
import com.agrandaditostienda.exception.RecursoNoEncontradoException;
import com.agrandaditostienda.mapper.CategoriaMapper;
import com.agrandaditostienda.mapper.ProductoMapper;
import com.agrandaditostienda.repository.CategoriaRepository;
import com.agrandaditostienda.repository.ProductoRepository;
import com.agrandaditostienda.repository.VarianteProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CatalogoService {

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final VarianteProductoRepository varianteProductoRepository;
    private final CategoriaMapper categoriaMapper;
    private final ProductoMapper productoMapper;
    private final TiendaService tiendaService;

    public CatalogoService(CategoriaRepository categoriaRepository,
                           ProductoRepository productoRepository,
                           VarianteProductoRepository varianteProductoRepository,
                           CategoriaMapper categoriaMapper,
                           ProductoMapper productoMapper,
                           TiendaService tiendaService) {
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
        this.varianteProductoRepository = varianteProductoRepository;
        this.categoriaMapper = categoriaMapper;
        this.productoMapper = productoMapper;
        this.tiendaService = tiendaService;
    }

    @Transactional(readOnly = true)
    public List<CategoriaDTO> listarCategoriasDeTienda(String tiendaSlug) {
        Tienda tienda = tiendaService.obtenerEntidadPorSlug(tiendaSlug);
        return categoriaRepository.findByTiendaIdOrderByOrdenAsc(tienda.getId()).stream()
                .map(categoriaMapper::toDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Genero> listarGenerosDeTienda(String tiendaSlug) {
        Tienda tienda = tiendaService.obtenerEntidadPorSlug(tiendaSlug);
        return productoRepository.findGenerosByTiendaId(tienda.getId());
    }

    @Transactional(readOnly = true)
    public List<ProductoDTO> listarProductosDeTienda(String tiendaSlug, String categoriaSlug, String genero) {
        Tienda tienda = tiendaService.obtenerEntidadPorSlug(tiendaSlug);
        List<Genero> generos = resolverGeneros(genero);
        boolean sinCategoria = categoriaSlug == null || categoriaSlug.isBlank();

        if (sinCategoria && generos == null) {
            return toDTOs(productoRepository.findByTiendaIdAndActivoTrueOrderByCreadoEnDesc(tienda.getId()));
        }
        if (sinCategoria) {
            return toDTOs(productoRepository.findByTiendaIdAndGeneroInAndActivoTrueOrderByCreadoEnDesc(tienda.getId(), generos));
        }

        Categoria categoria = categoriaRepository.findByTiendaIdAndSlug(tienda.getId(), categoriaSlug)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Categoría no encontrada en la tienda " + tiendaSlug + ": " + categoriaSlug));
        if (generos == null) {
            return toDTOs(productoRepository
                    .findByTiendaIdAndCategoriaIdAndActivoTrueOrderByCreadoEnDesc(tienda.getId(), categoria.getId()));
        }
        return toDTOs(productoRepository
                .findByTiendaIdAndCategoriaIdAndGeneroInAndActivoTrueOrderByCreadoEnDesc(tienda.getId(), categoria.getId(), generos));
    }

    @Transactional(readOnly = true)
    public List<ProductoDTO> listarDestacados() {
        return toDTOs(productoRepository.findByDestacadoTrueAndActivoTrueOrderByCreadoEnDesc());
    }

    private List<Genero> resolverGeneros(String genero) {
        if (genero == null || genero.isBlank()) {
            return null;
        }
        return switch (genero.trim().toUpperCase()) {
            case "NINO" -> List.of(Genero.NINO, Genero.UNISEX);
            case "NINA" -> List.of(Genero.NINA, Genero.UNISEX);
            case "UNISEX" -> List.of(Genero.UNISEX);
            default -> throw new RecursoNoEncontradoException("Género inválido: " + genero);
        };
    }

    private List<ProductoDTO> toDTOs(List<Producto> productos) {
        Map<Long, List<VarianteProducto>> variantesPorProducto = variantesDe(productos);
        return productos.stream()
                .map(producto -> productoMapper.toDTO(producto, variantesPorProducto.getOrDefault(producto.getId(), List.of())))
                .toList();
    }

    private Map<Long, List<VarianteProducto>> variantesDe(List<Producto> productos) {
        List<Long> ids = productos.stream().map(Producto::getId).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Long, List<VarianteProducto>> mapa = new LinkedHashMap<>();
        for (VarianteProducto variante : varianteProductoRepository
                .findByProductoIdInAndActivoTrueOrderByColorAscTalleAsc(ids)) {
            mapa.computeIfAbsent(variante.getProducto().getId(), k -> new java.util.ArrayList<>()).add(variante);
        }
        return mapa;
    }
}
