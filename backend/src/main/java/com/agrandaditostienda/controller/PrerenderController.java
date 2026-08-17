package com.agrandaditostienda.controller;

import com.agrandaditostienda.dto.ProductoDTO;
import com.agrandaditostienda.dto.TiendaDTO;
import com.agrandaditostienda.exception.RecursoNoEncontradoException;
import com.agrandaditostienda.service.CatalogoService;
import com.agrandaditostienda.service.TiendaService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.HtmlUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pre-renderiza las páginas públicas (home y tiendas) con su contenido real (nombre,
 * descripción, catálogo) para que los buscadores lean el contenido sin ejecutar JavaScript.
 */
@RestController
public class PrerenderController {

    public static final String DOMINIO = "https://agrandaditostiendas.onrender.com";
    private static final String IMAGEN_HOME = "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1200&h=800&fit=crop";
    private static final int MAX_PRODUCTOS = 60;

    private final TiendaService tiendaService;
    private final CatalogoService catalogoService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final NumberFormat formatoPrecio = NumberFormat.getNumberInstance(new Locale("es", "AR"));

    private volatile String baseHtml;

    public PrerenderController(TiendaService tiendaService, CatalogoService catalogoService) {
        this.tiendaService = tiendaService;
        this.catalogoService = catalogoService;
    }

    @PostConstruct
    void cargarBase() throws IOException {
        try (InputStream entrada = getClass().getClassLoader().getResourceAsStream("static/index.html")) {
            if (entrada == null) {
                throw new IllegalStateException("No se encontró static/index.html: primero hay que compilar el frontend.");
            }
            this.baseHtml = new String(entrada.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    @GetMapping(value = {"/", "/tienda/{slug}", "/tienda/{slug}/"}, produces = MediaType.TEXT_HTML_VALUE)
    public String prerender(@PathVariable(required = false) String slug, HttpServletResponse response) {
        if (slug == null) {
            return prerenderHome();
        }
        TiendaDTO tienda;
        List<ProductoDTO> productos;
        try {
            tienda = tiendaService.obtenerTiendaPorSlug(slug);
            productos = catalogoService.listarProductosDeTienda(slug, null, null);
        } catch (RecursoNoEncontradoException e) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            String html = reemplazar(baseHtml,
                    "(?s)<title>.*?</title>",
                    "<title>Página no encontrada · AgrandaditosTienda</title>");
            html = reemplazar(html, "(?s)<meta name=\"robots\" content=\"[^\"]*\" />",
                    "<meta name=\"robots\" content=\"noindex, nofollow\" />");
            return html;
        }
        return prerenderTienda(tienda, productos);
    }

    private String prerenderHome() {
        List<TiendaDTO> tiendas = tiendaService.listarTiendasActivas();
        List<ProductoDTO> destacados = catalogoService.listarDestacados().stream()
                .limit(8)
                .toList();
        return baseHtml.replace("<div id=\"root\"></div>",
                "<div id=\"root\">" + contenidoHome(tiendas, destacados) + "</div>");
    }

    private String contenidoHome(List<TiendaDTO> tiendas, List<ProductoDTO> destacados) {
        StringBuilder sb = new StringBuilder();
        sb.append("<h1>AgrandaditosTienda · Tiendas de ropa para chicos en Corrientes</h1>");
        sb.append("<p>Grupo de tiendas de ropa para bebés, niños, niñas y adolescentes en "
                + "<strong>Corrientes Capital, Argentina</strong>. Cuatro tiendas, cada una con su nombre "
                + "y su propio catálogo según la edad.</p>");
        sb.append("<h2>Las cuatro tiendas</h2>");
        sb.append("<ul>");
        for (TiendaDTO tienda : tiendas) {
            sb.append("<li><a href=\"/tienda/").append(esc(tienda.slug())).append("\"><strong>")
                    .append(esc(tienda.nombre())).append("</strong> — ").append(esc(tienda.etiquetaEdad()))
                    .append("</a>");
            if (tienda.descripcion() != null && !tienda.descripcion().isBlank()) {
                sb.append("<p>").append(esc(tienda.descripcion())).append("</p>");
            }
            sb.append("</li>");
        }
        sb.append("</ul>");
        sb.append("<h2>Sobre nosotros</h2>");
        sb.append("<p>AgrandaditosTienda es un grupo de tiendas de ropa para chicos en "
                + "<strong>Corrientes Capital</strong>. Cuatro tiendas, cada una con su nombre y su catálogo "
                + "según la edad: bebés de 0 a 2 años, niños de 2 a 8, preadolescentes de 8 a 12 y "
                + "adolescentes de 12 a 16.</p>");
        sb.append("<p>En cada tienda vas a encontrar remeras, pantalones, buzos, vestidos y todo lo que tu pibe "
                + "necesita, en talles para cada edad. Elegí la tienda, mirá el catálogo y consultá la prenda "
                + "que te guste por WhatsApp.</p>");
        sb.append("<p>Todas las prendas se pueden consultar por WhatsApp. "
                + "Hacé tu consulta desde la tienda y te respondemos en el horario del local.</p>");
        if (!destacados.isEmpty()) {
            sb.append("<h2>Prendas destacadas del grupo</h2>");
            sb.append("<ul>");
            for (ProductoDTO producto : destacados) {
                sb.append("<li><article>");
                sb.append("<strong>").append(esc(producto.nombre())).append("</strong> — $")
                        .append(formatoPrecio.format(producto.precio()));
                sb.append("</article></li>");
            }
            sb.append("</ul>");
        }
        return sb.toString();
    }

    private String prerenderTienda(TiendaDTO tienda, List<ProductoDTO> productos) {
        String titulo = tienda.nombre() + " · Tienda para " + tienda.etiquetaEdad() + " · AgrandaditosTienda";
        String descripcion = construirDescripcion(tienda);
        String canonical = DOMINIO + "/tienda/" + tienda.slug();
        String imagen = tienda.imagenHero() != null && !tienda.imagenHero().isBlank()
                ? tienda.imagenHero()
                : IMAGEN_HOME;

        String html = baseHtml;
        html = reemplazar(html, "(?s)<title>.*?</title>", "<title>" + esc(titulo) + "</title>");
        html = reemplazar(html, "(?s)<meta name=\"description\" content=\"[^\"]*\" />",
                "<meta name=\"description\" content=\"" + esc(descripcion) + "\" />");
        html = reemplazar(html, "(?s)<link rel=\"canonical\" href=\"[^\"]*\" />",
                "<link rel=\"canonical\" href=\"" + esc(canonical) + "\" />");
        html = reemplazar(html, "(?s)<meta property=\"og:url\" content=\"[^\"]*\" />",
                "<meta property=\"og:url\" content=\"" + esc(canonical) + "\" />");
        html = reemplazar(html, "(?s)<meta property=\"og:title\" content=\"[^\"]*\" />",
                "<meta property=\"og:title\" content=\"" + esc(titulo) + "\" />");
        html = reemplazar(html, "(?s)<meta property=\"og:description\" content=\"[^\"]*\" />",
                "<meta property=\"og:description\" content=\"" + esc(descripcion) + "\" />");
        html = reemplazar(html, "(?s)<meta property=\"og:image\" content=\"[^\"]*\" />",
                "<meta property=\"og:image\" content=\"" + esc(imagen) + "\" />");
        html = reemplazar(html, "(?s)<meta name=\"twitter:title\" content=\"[^\"]*\" />",
                "<meta name=\"twitter:title\" content=\"" + esc(titulo) + "\" />");
        html = reemplazar(html, "(?s)<meta name=\"twitter:description\" content=\"[^\"]*\" />",
                "<meta name=\"twitter:description\" content=\"" + esc(descripcion) + "\" />");
        html = reemplazar(html, "(?s)<meta name=\"twitter:image\" content=\"[^\"]*\" />",
                "<meta name=\"twitter:image\" content=\"" + esc(imagen) + "\" />");
        html = reemplazar(html, "(?s)<script type=\"application/ld\\+json\">.*?</script>", jsonLd(tienda, productos));

        return html.replace("<div id=\"root\"></div>",
                "<div id=\"root\">" + contenidoEstatico(tienda, productos) + "</div>");
    }

    private String construirDescripcion(TiendaDTO tienda) {
        String base = tienda.descripcion() != null && !tienda.descripcion().isBlank()
                ? tienda.descripcion()
                : "Tienda de ropa para " + tienda.etiquetaEdad().toLowerCase() + " en Corrientes Capital.";
        if (!base.contains("Corrientes")) {
            base = base + " · Corrientes Capital";
        }
        if (!base.contains("tienda") && !base.contains("Tienda")) {
            base = "Tienda de ropa · " + base;
        }
        return base.length() > 160 ? base.substring(0, 157) + "…" : base;
    }

    private String contenidoEstatico(TiendaDTO tienda, List<ProductoDTO> productos) {
        StringBuilder sb = new StringBuilder();
        sb.append("<h1>").append(esc(tienda.nombre())).append("</h1>");
        sb.append("<p>Ropa para ").append(esc(tienda.etiquetaEdad().toLowerCase()))
                .append(" en Corrientes Capital.</p>");
        if (tienda.descripcion() != null && !tienda.descripcion().isBlank()) {
            sb.append("<p>").append(esc(tienda.descripcion())).append("</p>");
        }
        if (tienda.imagenHero() != null && !tienda.imagenHero().isBlank()) {
            sb.append("<img src=\"").append(esc(tienda.imagenHero())).append("\" alt=\"")
                    .append(esc(tienda.nombre() + " — tienda de ropa para " + tienda.etiquetaEdad().toLowerCase()))
                    .append("\" loading=\"lazy\" />");
        }
        if (!productos.isEmpty()) {
            sb.append("<h2>Catálogo de ").append(esc(tienda.nombre())).append("</h2>");
            for (ProductoDTO producto : productos) {
                sb.append("<article>");
                sb.append("<h3>").append(esc(producto.nombre())).append("</h3>");
                if (producto.imagen() != null && !producto.imagen().isBlank()) {
                    sb.append("<img src=\"").append(esc(producto.imagen())).append("\" alt=\"")
                            .append(esc(producto.nombre() + " — " + tienda.nombre())).append("\" loading=\"lazy\" />");
                }
                if (producto.descripcion() != null && !producto.descripcion().isBlank()) {
                    sb.append("<p>").append(esc(producto.descripcion())).append("</p>");
                }
                sb.append("<p>Talles: ").append(esc(producto.talles())).append("</p>");
                sb.append("<p>Precio: $").append(formatoPrecio.format(producto.precio())).append("</p>");
                sb.append("</article>");
            }
        }
        return sb.toString();
    }

    private String jsonLd(TiendaDTO tienda, List<ProductoDTO> productos) {
        try {
            Map<String, Object> tiendaLd = new LinkedHashMap<>();
            tiendaLd.put("@context", "https://schema.org");
            tiendaLd.put("@type", "ClothingStore");
            tiendaLd.put("name", tienda.nombre());
            tiendaLd.put("description", construirDescripcion(tienda));
            tiendaLd.put("url", DOMINIO + "/tienda/" + tienda.slug());
            tiendaLd.put("image", tienda.imagenHero());
            tiendaLd.put("priceRange", "$$");
            tiendaLd.put("openingHours", "Mo-Sa 09:00-20:00");
            if (tienda.whatsapp() != null && !tienda.whatsapp().isBlank()) {
                tiendaLd.put("telephone", "+" + tienda.whatsapp().replaceAll("\\s+", ""));
            }
            tiendaLd.put("areaServed", "Corrientes Capital, Argentina");
            Map<String, Object> direccion = new LinkedHashMap<>();
            direccion.put("@type", "PostalAddress");
            direccion.put("addressLocality", "Corrientes");
            direccion.put("addressRegion", "Corrientes");
            direccion.put("addressCountry", "AR");
            tiendaLd.put("address", direccion);
            Map<String, Object> geo = new LinkedHashMap<>();
            geo.put("@type", "GeoCoordinates");
            geo.put("latitude", -27.4678);
            geo.put("longitude", -58.8167);
            tiendaLd.put("geo", geo);

            StringBuilder jsonLd = new StringBuilder();
            List<ProductoDTO> destacados = productos.stream()
                    .filter(p -> p.destacado())
                    .limit(20)
                    .toList();
            if (!destacados.isEmpty()) {
                Map<String, Object> itemList = new LinkedHashMap<>();
                itemList.put("@context", "https://schema.org");
                itemList.put("@type", "ItemList");
                itemList.put("name", tienda.nombre() + " — prendas destacadas");
                List<Map<String, Object>> elementos = new ArrayList<>();
                int posicion = 1;
                for (ProductoDTO producto : destacados) {
                    Map<String, Object> elemento = new LinkedHashMap<>();
                    elemento.put("@type", "ListItem");
                    elemento.put("position", posicion++);
                    elemento.put("name", producto.nombre());
                    elemento.put("url", DOMINIO + "/tienda/" + tienda.slug());
                    elemento.put("image", producto.imagen());
                    Map<String, Object> oferta = new LinkedHashMap<>();
                    oferta.put("@type", "Offer");
                    oferta.put("price", producto.precio());
                    oferta.put("priceCurrency", "ARS");
                    oferta.put("availability", "https://schema.org/InStock");
                    oferta.put("itemCondition", "https://schema.org/NewCondition");
                    elemento.put("offers", oferta);
                    elementos.add(elemento);
                }
                itemList.put("itemListElement", elementos);
                jsonLd.append(scriptJsonLd(itemList));
            }
            jsonLd.append(scriptJsonLd(tiendaLd));
            return jsonLd.toString();
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("No se pudo generar el JSON-LD de la tienda " + tienda.slug(), e);
        }
    }

    private String scriptJsonLd(Map<String, Object> datos) throws JsonProcessingException {
        return "<script type=\"application/ld+json\">" + objectMapper.writeValueAsString(datos) + "</script>";
    }

    private String reemplazar(String html, String regex, String reemplazo) {
        return Pattern.compile(regex, Pattern.DOTALL).matcher(html).replaceFirst(Matcher.quoteReplacement(reemplazo));
    }

    private String esc(String texto) {
        return HtmlUtils.htmlEscape(texto == null ? "" : texto);
    }
}
