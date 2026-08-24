package com.agrandaditostienda.service;

import com.agrandaditostienda.dto.CategoriaDTO;
import com.agrandaditostienda.dto.CategoriaRequest;
import com.agrandaditostienda.dto.ProductoDTO;
import com.agrandaditostienda.dto.ProductoRequest;
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
import com.agrandaditostienda.security.Seguridad;
import com.agrandaditostienda.security.UsuarioPrincipal;
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

    @Transactional(readOnly = true)
    public List<ProductoDTO> listarProductosGlobales() {
        return toDTOs(productoRepository.findTop12ByActivoTrueOrderByCreadoEnDesc());
    }

    @Transactional
    public ProductoDTO crearProducto(String tiendaSlug, ProductoRequest request) {
        UsuarioPrincipal usuario = Seguridad.principalRequerido();
        Tienda tienda = tiendaService.obtenerEntidadPorSlug(tiendaSlug);
        verificarAcceso(usuario, tienda);

        Categoria categoria = categoriaRepository.findByTiendaIdAndSlug(tienda.getId(), request.categoriaSlug())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Categoría no encontrada: " + request.categoriaSlug()));

        Genero genero = parseGenero(request.genero());

        String imagen = request.imagen() != null ? request.imagen() : "";
        String talles = request.talles() != null ? request.talles() : "";

        Producto producto = new Producto(
                request.nombre(),
                request.descripcion(),
                request.precio(),
                imagen,
                talles,
                genero,
                request.destacado(),
                tienda,
                categoria
        );
        producto = productoRepository.save(producto);

        for (ProductoRequest.VarianteRequest v : request.variantes()) {
            varianteProductoRepository.save(new VarianteProducto(producto, v.color(), v.talle(), v.stock()));
        }

        List<VarianteProducto> variantes = varianteProductoRepository
                .findByProductoIdOrderByColorAscTalleAsc(producto.getId());
        return productoMapper.toDTO(producto, variantes);
    }

    @Transactional
    public ProductoDTO actualizarProducto(Long productoId, ProductoRequest request) {
        UsuarioPrincipal usuario = Seguridad.principalRequerido();
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado: " + productoId));
        verificarAcceso(usuario, producto.getTienda());

        Categoria categoria = categoriaRepository.findByTiendaIdAndSlug(producto.getTienda().getId(), request.categoriaSlug())
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "Categoría no encontrada: " + request.categoriaSlug()));

        producto.setNombre(request.nombre());
        producto.setDescripcion(request.descripcion());
        producto.setPrecio(request.precio());
        producto.setImagen(request.imagen() != null ? request.imagen() : "");
        producto.setTalles(request.talles() != null ? request.talles() : "");
        producto.setGenero(parseGenero(request.genero()));
        producto.setDestacado(request.destacado());
        producto.setCategoria(categoria);
        productoRepository.save(producto);

        List<VarianteProducto> todas = varianteProductoRepository
                .findByProductoIdOrderByColorAscTalleAsc(productoId);

        for (VarianteProducto existente : todas) {
            boolean estaEnRequest = request.variantes().stream()
                    .anyMatch(v -> v.color().equals(existente.getColor()) && v.talle().equals(existente.getTalle()));
            if (estaEnRequest && !existente.isActivo()) {
                existente.setActivo(true);
            } else if (!estaEnRequest) {
                existente.setActivo(false);
            }
            if (estaEnRequest) {
                request.variantes().stream()
                        .filter(v -> v.color().equals(existente.getColor()) && v.talle().equals(existente.getTalle()))
                        .findFirst()
                        .ifPresent(v -> existente.setStock(v.stock()));
            }
            varianteProductoRepository.save(existente);
        }

        for (ProductoRequest.VarianteRequest v : request.variantes()) {
            boolean existe = todas.stream()
                    .anyMatch(e -> e.getColor().equals(v.color()) && e.getTalle().equals(v.talle()));
            if (!existe) {
                varianteProductoRepository.save(new VarianteProducto(producto, v.color(), v.talle(), v.stock()));
            }
        }

        List<VarianteProducto> finales = varianteProductoRepository
                .findByProductoIdOrderByColorAscTalleAsc(productoId);
        return productoMapper.toDTO(producto, finales);
    }

    @Transactional
    public void eliminarProducto(Long productoId) {
        UsuarioPrincipal usuario = Seguridad.principalRequerido();
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado: " + productoId));
        verificarAcceso(usuario, producto.getTienda());

        producto.setActivo(false);
        productoRepository.save(producto);

        List<VarianteProducto> variantes = varianteProductoRepository
                .findByProductoIdOrderByColorAscTalleAsc(productoId);
        for (VarianteProducto v : variantes) {
            v.setActivo(false);
            varianteProductoRepository.save(v);
        }
    }

    @Transactional
    public CategoriaDTO crearCategoria(String tiendaSlug, CategoriaRequest request) {
        UsuarioPrincipal usuario = Seguridad.principalRequerido();
        Tienda tienda = tiendaService.obtenerEntidadPorSlug(tiendaSlug);
        verificarAcceso(usuario, tienda);

        String nombre = request.nombre().trim();
        String slug = normalizarSlug(nombre);

        if (categoriaRepository.findByTiendaIdAndSlug(tienda.getId(), slug).isPresent()) {
            throw new com.agrandaditostienda.exception.ConsultaInvalidaException(
                    "Ya existe una categoría con ese nombre en la tienda");
        }

        int maxOrden = categoriaRepository.findByTiendaIdOrderByOrdenAsc(tienda.getId()).stream()
                .mapToInt(Categoria::getOrden).max().orElse(0);

        Categoria categoria = new Categoria(nombre, slug, maxOrden + 1, tienda);
        categoriaRepository.save(categoria);
        return categoriaMapper.toDTO(categoria);
    }

    @Transactional
    public CategoriaDTO actualizarCategoria(Long categoriaId, CategoriaRequest request) {
        UsuarioPrincipal usuario = Seguridad.principalRequerido();
        Categoria categoria = categoriaRepository.findById(categoriaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada: " + categoriaId));
        verificarAcceso(usuario, categoria.getTienda());

        String nombre = request.nombre().trim();
        String slug = normalizarSlug(nombre);

        categoriaRepository.findByTiendaIdAndSlug(categoria.getTienda().getId(), slug)
                .filter(c -> !c.getId().equals(categoriaId))
                .ifPresent(c -> {
                    throw new com.agrandaditostienda.exception.ConsultaInvalidaException(
                            "Ya existe una categoría con ese nombre en la tienda");
                });

        categoria.setNombre(nombre);
        categoria.setSlug(slug);
        categoriaRepository.save(categoria);
        return categoriaMapper.toDTO(categoria);
    }

    @Transactional
    public void eliminarCategoria(Long categoriaId) {
        UsuarioPrincipal usuario = Seguridad.principalRequerido();
        Categoria categoria = categoriaRepository.findById(categoriaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Categoría no encontrada: " + categoriaId));
        verificarAcceso(usuario, categoria.getTienda());

        long productosActivos = productoRepository.countByCategoriaIdAndActivoTrue(categoriaId);
        if (productosActivos > 0) {
            throw new com.agrandaditostienda.exception.ConsultaInvalidaException(
                    "No se puede eliminar: hay " + productosActivos + " producto(s) activo(s) usando esta categoría.");
        }

        productoRepository.desasociarInactivosDeCategoria(categoriaId);
        categoriaRepository.delete(categoria);
    }

    private String normalizarSlug(String nombre) {
        return nombre.toLowerCase()
                .replaceAll("[áà]", "a")
                .replaceAll("[éè]", "e")
                .replaceAll("[íì]", "i")
                .replaceAll("[óò]", "o")
                .replaceAll("[úù]", "u")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    private void verificarAcceso(UsuarioPrincipal usuario, Tienda tienda) {
        if (usuario.esEncargada() && !tienda.getId().equals(usuario.tiendaId())) {
            throw new RecursoNoEncontradoException("No tenés acceso a esta tienda");
        }
    }

    private Genero parseGenero(String genero) {
        try {
            return Genero.valueOf(genero.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RecursoNoEncontradoException("Género inválido: " + genero);
        }
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
