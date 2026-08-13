package com.agrandaditostienda.controller;

import com.agrandaditostienda.dto.ProductoDTO;
import com.agrandaditostienda.dto.TiendaDTO;
import com.agrandaditostienda.exception.RecursoNoEncontradoException;
import com.agrandaditostienda.service.CatalogoService;
import com.agrandaditostienda.service.TiendaService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
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
 * Pre-renderiza la página de cada tienda con su contenido real (nombre, descripción,
 * catálogo) para que los buscadores lean el contenido sin ejecutar JavaScript.
 */
@RestController
public class TiendaSeoController {

    public static final String DOMINIO = "https://agrandaditostiendas.onrender.com";
    private static final String IMAGEN_HOME = "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=1200&h=800&fit=crop";
    private static final int MAX_PRODUCTOS = 60;

    private final TiendaService tiendaService;
    private final CatalogoService catalogoService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final NumberFormat formatoPrecio = NumberFormat.getNumberInstance(new Locale("es", "AR"));

    private volatile String baseHtml;

    public TiendaSeoController(TiendaService tiendaService, CatalogoService catalogoService) {
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

    @GetMapping(value = {"/tienda/{slug}", "/tienda/{slug}/"}, produces = MediaType.TEXT_HTML_VALUE)
    public String prenderTienda(@PathVariable String slug) {
        TiendaDTO tienda;
        List<ProductoDTO> productos;
        try {
            tienda = tiendaService.obtenerTiendaPorSlug(slug);
            productos = catalogoService.listarProductosDeTienda(slug, null, null);
        } catch (RecursoNoEncontradoException e) {
            return baseHtml;
        }

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
        String descripcion = tienda.descripcion() != null && !tienda.descripcion().isBlank()
                ? tienda.descripcion()
                : "Ropa para " + tienda.etiquetaEdad().toLowerCase() + ".";
        if (!descripcion.contains("Corrientes")) {
            descripcion = descripcion + " · Corrientes Capital";
        }
        return descripcion;
    }

    private String contenidoEstatico(TiendaDTO tienda, List<ProductoDTO> productos) {
        StringBuilder sb = new StringBuilder();
        sb.append("<h1>").append(esc(tienda.nombre())).append("</h1>");
        sb.append("<p>Ropa para ").append(esc(tienda.etiquetaEdad())).append(".</p>");
        if (tienda.descripcion() != null && !tienda.descripcion().isBlank()) {
            sb.append("<p>").append(esc(tienda.descripcion())).append("</p>");
        }
        if (tienda.imagenHero() != null && !tienda.imagenHero().isBlank()) {
            sb.append("<img src=\"").append(esc(tienda.imagenHero())).append("\" alt=\"")
                    .append(esc(tienda.nombre())).append("\" />");
        }
        if (!productos.isEmpty()) {
            sb.append("<h2>Catálogo de ").append(esc(tienda.nombre())).append("</h2>");
            sb.append("<ul>");
            for (ProductoDTO producto : productos) {
                sb.append("<li><h3>").append(esc(producto.nombre())).append("</h3>");
                if (producto.imagen() != null && !producto.imagen().isBlank()) {
                    sb.append("<img src=\"").append(esc(producto.imagen())).append("\" alt=\"")
                            .append(esc(producto.nombre())).append("\" />");
                }
                sb.append("<p>Talles: ").append(esc(producto.talles())).append("</p>");
                sb.append("<p>Precio: $").append(formatoPrecio.format(producto.precio())).append("</p>");
                sb.append("</li>");
            }
            sb.append("</ul>");
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
            Map<String, Object> direccion = new LinkedHashMap<>();
            direccion.put("@type", "PostalAddress");
            direccion.put("addressLocality", "Corrientes");
            direccion.put("addressCountry", "AR");
            tiendaLd.put("address", direccion);

            StringBuilder jsonLd = new StringBuilder();
            if (!productos.isEmpty()) {
                Map<String, Object> itemList = new LinkedHashMap<>();
                itemList.put("@context", "https://schema.org");
                itemList.put("@type", "ItemList");
                itemList.put("name", tienda.nombre() + " — catálogo");
                List<Map<String, Object>> elementos = new ArrayList<>();
                int posicion = 1;
                for (ProductoDTO producto : productos) {
                    Map<String, Object> elemento = new LinkedHashMap<>();
                    elemento.put("@type", "ListItem");
                    elemento.put("position", posicion++);
                    elemento.put("name", producto.nombre());
                    elemento.put("image", producto.imagen());
                    Map<String, Object> oferta = new LinkedHashMap<>();
                    oferta.put("@type", "Offer");
                    oferta.put("price", producto.precio());
                    oferta.put("priceCurrency", "ARS");
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
