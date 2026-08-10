package com.mita.config;

import com.mita.entity.Categoria;
import com.mita.entity.Genero;
import com.mita.entity.Producto;
import com.mita.entity.RangoEdad;
import com.mita.entity.Tienda;
import com.mita.entity.VarianteProducto;
import com.mita.repository.CategoriaRepository;
import com.mita.repository.ProductoRepository;
import com.mita.repository.TiendaRepository;
import com.mita.repository.VarianteProductoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private static final List<String> COLORES_BEBE = List.of("Rosa", "Celeste");
    private static final List<String> COLORES_NINOS = List.of("Azul", "Gris");
    private static final List<String> COLORES_PREADO = List.of("Rosa", "Violeta");
    private static final List<String> COLORES_TEENS = List.of("Negro", "Blanco");

    private final TiendaRepository tiendaRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final VarianteProductoRepository varianteProductoRepository;
    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(TiendaRepository tiendaRepository,
                           CategoriaRepository categoriaRepository,
                           ProductoRepository productoRepository,
                           VarianteProductoRepository varianteProductoRepository,
                           JdbcTemplate jdbcTemplate) {
        this.tiendaRepository = tiendaRepository;
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
        this.varianteProductoRepository = varianteProductoRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        asegurarEsquemaBase();
        if (tiendaRepository.count() > 0) {
            log.info("Base de datos ya contiene datos, se omite el seed.");
            return;
        }
        log.info("Sembrando datos iniciales...");

        Tienda nunu = crearTienda("Mokositos", "mokositos-bebes", RangoEdad.BEBES, "Bebés 0-2 años",
                "Ropa y accesorios pensados para los más chiquitos de la casa. Algodón suave, colores tiernos y diseños que acompañan cada etapa del bebé.",
                "#F59E6B", "#B85C38",
                "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1200&h=800&fit=crop&q=70",
                "5491112345601", 1);

        Tienda guri = crearTienda("Mokositos", "mokositos-ninos", RangoEdad.INFANTIL, "Niños 2-8 años",
                "Moda infantil para pibes y pibas que juegan, corren y crecen. Prendas resistentes, cómodas y con onda, hechas para la aventura de cada día.",
                "#2A9D8F", "#1C6B61",
                "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=1200&h=800&fit=crop&q=70",
                "5491112345602", 2);

        Tienda chinita = crearTienda("Agrandaditos", "agrandaditos", RangoEdad.PREADOLESCENTES, "Preadolescentes 8-12 años",
                "Ropa con actitud para los que ya no son tan chicos: estilos urbanos y divertidos para pibes y pibas de 8 a 12.",
                "#E0568C", "#A1285A",
                "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1200&h=800&fit=crop&q=70",
                "5491112345603", 3);

        Tienda pibe = crearTienda("Mood Teens", "mood-teens", RangoEdad.ADOLESCENTES, "Adolescentes 12-16 años",
                "La onda urbana para pibes y pibas que marcan tendencia. Oversize, streetwear y básicos con actitud para la etapa más canchera.",
                "#4F46E5", "#1E1B4B",
                "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&h=800&fit=crop&q=70",
                "5491112345604", 4);

        tiendaRepository.saveAll(List.of(nunu, guri, chinita, pibe));

        seedNunu(nunu);
        seedGuri(guri);
        seedChinita(chinita);
        seedPibe(pibe);

        log.info("Seed finalizado.");
    }

    private void asegurarEsquemaBase() {
        jdbcTemplate.execute("create sequence if not exists consulta_numero_seq start with 1 increment by 1");
        jdbcTemplate.execute("create sequence if not exists venta_numero_seq start with 1 increment by 1");
        jdbcTemplate.execute("create unique index if not exists uk_cliente_telefono on cliente (telefono)");
        jdbcTemplate.execute("create unique index if not exists uk_venta_consulta on venta (consulta_id)");
        jdbcTemplate.execute("create unique index if not exists uk_cv_consulta_version on consulta_version (consulta_id, version)");
        jdbcTemplate.execute("alter table consulta add column if not exists version integer not null default 0");
    }

    private Tienda crearTienda(String nombre, String slug, RangoEdad rango, String etiqueta,
                               String descripcion, String primario, String secundario,
                               String hero, String whatsapp, int orden) {
        return new Tienda(nombre, slug, rango, etiqueta, descripcion, primario, secundario, hero, whatsapp, orden);
    }

    private void seedNunu(Tienda tienda) {
        Map<String, Categoria> categorias = crearCategorias(tienda, "Conjuntos", "Enteritos", "Baberos", "Vestidos", "Pies y accesorios");
        Categoria conjuntos = categorias.get("Conjuntos");
        Categoria enteritos = categorias.get("Enteritos");
        Categoria baberos = categorias.get("Baberos");
        Categoria vestidos = categorias.get("Vestidos");
        Categoria pies = categorias.get("Pies y accesorios");

        crearProducto(tienda, conjuntos, "Conjunto bebé algodón percal", 18900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1615873968403-89e068629265?w=700&h=900&fit=crop&q=70",
                "0-3 / 3-6 / 6-12", true);
        crearProducto(tienda, conjuntos, "Conjunto polar con capucha", 22400, Genero.UNISEX,
                "https://images.unsplash.com/photo-1604004555489-723a93d6ce74?w=700&h=900&fit=crop&q=70",
                "3-6 / 6-12 / 12-18", false);
        crearProducto(tienda, enteritos, "Enterito de algodón estampado", 15900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=700&h=900&fit=crop&q=70",
                "0-3 / 3-6 / 6-12 / 12-18", true);
        crearProducto(tienda, enteritos, "Enterito manga corta animalito", 13900, Genero.NINO,
                "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=700&h=900&fit=crop&q=70",
                "0-3 / 3-6 / 6-12", false);
        crearProducto(tienda, baberos, "Set de 3 baberos de silicona", 6800, Genero.UNISEX,
                "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=700&h=900&fit=crop&q=70",
                "Único", false);
        crearProducto(tienda, baberos, "Babero con bolsillo reversible", 5200, Genero.UNISEX,
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&h=900&fit=crop&q=70",
                "Único", false);
        crearProducto(tienda, vestidos, "Vestido de algodón con moño", 16900, Genero.NINA,
                "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=700&h=900&fit=crop&q=70",
                "6-12 / 12-18 / 18-24", true);
        crearProducto(tienda, vestidos, "Vestido marinero verano", 15900, Genero.NINA,
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop&q=70",
                "6-12 / 12-18", false);
        crearProducto(tienda, pies, "Escarpines de suela antideslizante", 8900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&h=900&fit=crop&q=70",
                "0-6 / 6-12 / 12-24", false);
        crearProducto(tienda, pies, "Gorrito de lana tejida", 6900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=700&h=900&fit=crop&q=70",
                "Único", false);
        crearProducto(tienda, conjuntos, "Conjunto de salida recién nacido", 24900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=700&h=900&fit=crop&q=70",
                "0-3 / 3-6", false);
        crearProducto(tienda, vestidos, "Vestido bautismo tul", 27900, Genero.NINA,
                "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&h=900&fit=crop&q=70",
                "3-6 / 6-12 / 12-18", false);
    }

    private void seedGuri(Tienda tienda) {
        Map<String, Categoria> categorias = crearCategorias(tienda, "Remeras", "Pantalones", "Buzos", "Shorts", "Vestidos y polleras", "Conjuntos");
        Categoria remeras = categorias.get("Remeras");
        Categoria pantalones = categorias.get("Pantalones");
        Categoria buzos = categorias.get("Buzos");
        Categoria shorts = categorias.get("Shorts");
        Categoria vestidosYPolleras = categorias.get("Vestidos y polleras");
        Categoria conjuntos = categorias.get("Conjuntos");

        crearProducto(tienda, remeras, "Remera básica algodón peinado", 10900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&h=900&fit=crop&q=70",
                "2 / 4 / 6 / 8", true);
        crearProducto(tienda, remeras, "Remera estampada dinosaurio", 12900, Genero.NINO,
                "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=700&h=900&fit=crop&q=70",
                "2 / 4 / 6 / 8", false);
        crearProducto(tienda, remeras, "Remera volados con lazo", 11900, Genero.NINA,
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop&q=70",
                "2 / 4 / 6 / 8", false);
        crearProducto(tienda, remeras, "Remera unicornio", 11900, Genero.NINA,
                "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=700&h=900&fit=crop&q=70",
                "2 / 4 / 6 / 8", false);
        crearProducto(tienda, pantalones, "Jogging corderito con cierre", 15900, Genero.NINO,
                "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=700&h=900&fit=crop&q=70",
                "2 / 4 / 6 / 8 / 10", true);
        crearProducto(tienda, pantalones, "Jean elástico azul", 18900, Genero.NINO,
                "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=700&h=900&fit=crop&q=70",
                "2 / 4 / 6 / 8 / 10", false);
        crearProducto(tienda, pantalones, "Calza jeans elasticada", 13900, Genero.NINA,
                "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=700&h=900&fit=crop&q=70",
                "2 / 4 / 6 / 8 / 10", false);
        crearProducto(tienda, pantalones, "Legging color liso", 11900, Genero.NINA,
                "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&h=900&fit=crop&q=70",
                "2 / 4 / 6 / 8", false);
        crearProducto(tienda, buzos, "Buzo canguro con bolsillo", 19900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&h=900&fit=crop&q=70",
                "4 / 6 / 8 / 10 / 12", false);
        crearProducto(tienda, buzos, "Buzo capucha orejitas", 17900, Genero.NINO,
                "https://images.unsplash.com/photo-1604004555489-723a93d6ce74?w=700&h=900&fit=crop&q=70",
                "4 / 6 / 8 / 10", true);
        crearProducto(tienda, buzos, "Buzo algodón con perrito", 17900, Genero.NINA,
                "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700&h=900&fit=crop&q=70",
                "4 / 6 / 8 / 10", false);
        crearProducto(tienda, shorts, "Short jean bermuda", 12900, Genero.NINO,
                "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=700&h=900&fit=crop&q=70",
                "2 / 4 / 6 / 8 / 10", false);
        crearProducto(tienda, shorts, "Pollera short vaquera", 12900, Genero.NINA,
                "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=700&h=900&fit=crop&q=70",
                "2 / 4 / 6 / 8", false);
        crearProducto(tienda, vestidosYPolleras, "Vestido flores veraniego", 16900, Genero.NINA,
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop&q=70",
                "2 / 4 / 6 / 8", true);
        crearProducto(tienda, vestidosYPolleras, "Pollera tull con glitter", 11900, Genero.NINA,
                "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&h=900&fit=crop&q=70",
                "2 / 4 / 6 / 8 / 10", false);
        crearProducto(tienda, conjuntos, "Conjunto deportivo 2 piezas", 22900, Genero.NINO,
                "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=700&h=900&fit=crop&q=70",
                "4 / 6 / 8 / 10", true);
        crearProducto(tienda, conjuntos, "Conjunto camisa y bermuda", 21900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=700&h=900&fit=crop&q=70",
                "2 / 4 / 6 / 8", false);
        crearProducto(tienda, conjuntos, "Conjunto pollera y remera", 20900, Genero.NINA,
                "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=700&h=900&fit=crop&q=70",
                "2 / 4 / 6 / 8", false);
    }

    private void seedChinita(Tienda tienda) {
        Map<String, Categoria> categorias = crearCategorias(tienda, "Remeras", "Vestidos", "Pantalones", "Polleras", "Buzos", "Shorts");
        Categoria remeras = categorias.get("Remeras");
        Categoria vestidos = categorias.get("Vestidos");
        Categoria pantalones = categorias.get("Pantalones");
        Categoria polleras = categorias.get("Polleras");
        Categoria buzos = categorias.get("Buzos");
        Categoria shorts = categorias.get("Shorts");

        crearProducto(tienda, remeras, "Remera lisa cuello redondo", 13900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14", true);
        crearProducto(tienda, remeras, "Remera estampado graffiti", 16900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14", false);
        crearProducto(tienda, remeras, "Remera con volados básica", 13900, Genero.NINA,
                "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14", false);
        crearProducto(tienda, vestidos, "Vestido floral midi", 21900, Genero.NINA,
                "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14", true);
        crearProducto(tienda, vestidos, "Vestido denim con cinturón", 19900, Genero.NINA,
                "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14", false);
        crearProducto(tienda, pantalones, "Jogger corderito", 18900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14", false);
        crearProducto(tienda, pantalones, "Jean baggy", 19900, Genero.NINO,
                "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14 / 16", false);
        crearProducto(tienda, pantalones, "Calza jeans", 15900, Genero.NINA,
                "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14", false);
        crearProducto(tienda, pantalones, "Pantalón cargo", 20900, Genero.NINO,
                "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14", true);
        crearProducto(tienda, polleras, "Pollera jean", 14900, Genero.NINA,
                "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14", false);
        crearProducto(tienda, polleras, "Pollera tull", 13900, Genero.NINA,
                "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14", false);
        crearProducto(tienda, buzos, "Buzo canguro urbano", 21900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14 / 16", true);
        crearProducto(tienda, buzos, "Buzo polar con bolsillo", 19900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1604004555489-723a93d6ce74?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14", false);
        crearProducto(tienda, shorts, "Short cargo", 15900, Genero.NINO,
                "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14", false);
        crearProducto(tienda, shorts, "Short con cinturón fruncido", 14900, Genero.NINA,
                "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=700&h=900&fit=crop&q=70",
                "8 / 10 / 12 / 14", false);
    }

    private void seedPibe(Tienda tienda) {
        Map<String, Categoria> categorias = crearCategorias(tienda, "Remeras", "Hoodies", "Joggers", "Cargo", "Gorras");
        Categoria remeras = categorias.get("Remeras");
        Categoria hoodies = categorias.get("Hoodies");
        Categoria joggers = categorias.get("Joggers");
        Categoria cargo = categorias.get("Cargo");
        Categoria gorras = categorias.get("Gorras");

        crearProducto(tienda, remeras, "Remera oversize básica", 14900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&h=900&fit=crop&q=70",
                "S / M / L / XL", true);
        crearProducto(tienda, remeras, "Remera estampado graffiti", 16900, Genero.NINO,
                "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=700&h=900&fit=crop&q=70",
                "S / M / L / XL", false);
        crearProducto(tienda, hoodies, "Hoodie unisex con capucha", 24900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=700&h=900&fit=crop&q=70",
                "S / M / L / XL", true);
        crearProducto(tienda, hoodies, "Buzo polar acanalado", 22900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1604004555489-723a93d6ce74?w=700&h=900&fit=crop&q=70",
                "S / M / L", false);
        crearProducto(tienda, joggers, "Jogger corderito cintura alta", 18900, Genero.NINA,
                "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=700&h=900&fit=crop&q=70",
                "S / M / L / XL", true);
        crearProducto(tienda, joggers, "Jogger cargo con bolsillos", 19900, Genero.NINO,
                "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=700&h=900&fit=crop&q=70",
                "S / M / L / XL", false);
        crearProducto(tienda, cargo, "Pantalón cargo urbano", 21900, Genero.NINO,
                "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=700&h=900&fit=crop&q=70",
                "S / M / L / XL", false);
        crearProducto(tienda, cargo, "Jean baggy tiro bajo", 22900, Genero.NINA,
                "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=700&h=900&fit=crop&q=70",
                "S / M / L / XL", true);
        crearProducto(tienda, gorras, "Gorra trucker bordada", 9900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1571875257727-256c39da42af?w=700&h=900&fit=crop&q=70",
                "Único", false);
        crearProducto(tienda, gorras, "Gorra dad cap ajustable", 8900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=700&h=900&fit=crop&q=70",
                "Único", false);
        crearProducto(tienda, remeras, "Remera manga larga street", 16900, Genero.NINO,
                "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=700&h=900&fit=crop&q=70",
                "S / M / L / XL", false);
        crearProducto(tienda, hoodies, "Campera bomber reversible", 26900, Genero.UNISEX,
                "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=700&h=900&fit=crop&q=70",
                "S / M / L / XL", true);
    }

    private Map<String, Categoria> crearCategorias(Tienda tienda, String... nombres) {
        Map<String, Categoria> mapa = new LinkedHashMap<>();
        int orden = 1;
        for (String nombre : nombres) {
            String slug = normalizar(nombre);
            Categoria categoria = categoriaRepository.save(new Categoria(nombre, slug, orden++, tienda));
            mapa.put(nombre, categoria);
        }
        return mapa;
    }

    private void crearProducto(Tienda tienda, Categoria categoria, String nombre, int precio, Genero genero,
                               String imagen, String talles, boolean destacado) {
        Producto producto = productoRepository.save(new Producto(
                nombre,
                "Precio publicado en el local. Consultá por talle, color y stock disponible.",
                BigDecimal.valueOf(precio),
                imagen,
                talles,
                genero,
                destacado,
                tienda,
                categoria
        ));
        List<String> colores = coloresPara(tienda);
        for (String talle : dividirTalles(talles)) {
            int stockBase = destacado ? 4 : 2;
            for (int i = 0; i < colores.size(); i++) {
                varianteProductoRepository.save(new VarianteProducto(
                        producto, colores.get(i), talle, stockBase + (i * 3)));
            }
        }
    }

    private List<String> coloresPara(Tienda tienda) {
        return switch (tienda.getSlug()) {
            case "mokositos-bebes" -> COLORES_BEBE;
            case "mokositos-ninos" -> COLORES_NINOS;
            case "agrandaditos" -> COLORES_PREADO;
            default -> COLORES_TEENS;
        };
    }

    private List<String> dividirTalles(String talles) {
        return List.of(talles.split("\\s*\\/\\s*"));
    }

    private String normalizar(String texto) {
        return texto.toLowerCase()
                .replaceAll("[áàäâ]", "a")
                .replaceAll("[éèëê]", "e")
                .replaceAll("[íìïî]", "i")
                .replaceAll("[óòöô]", "o")
                .replaceAll("[úùüû]", "u")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }
}
