package com.agrandaditostienda.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class SeoController {

    private static final String DOMINIO = "https://agrandaditostiendas.onrender.com";

    private static final String INDEXNOW_KEY = "dbd025be09994c2d4ee1e52d7a613c33";

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
                + "Sitemap: " + DOMINIO + "/sitemap.xml\n";
    }

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap() {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                + "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
                + "  <url><loc>" + DOMINIO + "/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n"
                + "  <url><loc>" + DOMINIO + "/tienda/mokositos-bebes</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n"
                + "  <url><loc>" + DOMINIO + "/tienda/mokositos-ninos</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n"
                + "  <url><loc>" + DOMINIO + "/tienda/agrandaditos</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n"
                + "  <url><loc>" + DOMINIO + "/tienda/mood-teens</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n"
                + "</urlset>\n";
    }
}
