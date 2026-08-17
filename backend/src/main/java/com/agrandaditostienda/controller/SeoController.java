package com.agrandaditostienda.controller;

import com.agrandaditostienda.dto.TiendaDTO;
import com.agrandaditostienda.service.TiendaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
public class SeoController {

    private static final String DOMINIO = "https://agrandaditostiendas.onrender.com";

    private static final String INDEXNOW_KEY = "dbd025be09994c2d4ee1e52d7a613c33";

    private final TiendaService tiendaService;

    public SeoController(TiendaService tiendaService) {
        this.tiendaService = tiendaService;
    }

    @GetMapping(value = "/indexnow/{clave}.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public String indexNowKey(@PathVariable String clave) {
        if (!INDEXNOW_KEY.equals(clave)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return INDEXNOW_KEY;
    }

    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public String robots() {
        return "User-agent: *\n"
                + "Allow: /\n"
                + "Disallow: /home\n"
                + "Disallow: /api/\n"
                + "Sitemap: " + DOMINIO + "/sitemap.xml\n";
    }

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap() {
        List<TiendaDTO> tiendas = tiendaService.listarTiendasActivas();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneOffset.UTC);

        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        sb.append("  <url><loc>").append(DOMINIO).append("/</loc>")
                .append("<changefreq>daily</changefreq><priority>1.0</priority></url>\n");
        for (TiendaDTO tienda : tiendas) {
            sb.append("  <url><loc>").append(DOMINIO).append("/tienda/").append(tienda.slug()).append("</loc>")
                    .append("<changefreq>weekly</changefreq><priority>0.8</priority></url>\n");
        }
        sb.append("</urlset>\n");
        return sb.toString();
    }
}
