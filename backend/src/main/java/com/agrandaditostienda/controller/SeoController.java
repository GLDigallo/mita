package com.agrandaditostienda.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SeoController {

    private static final String DOMINIO = "https://agrandaditostiendas.onrender.com";

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
                + "  <url><loc>" + DOMINIO + "/</loc></url>\n"
                + "  <url><loc>" + DOMINIO + "/tienda/mokositos-bebes</loc></url>\n"
                + "  <url><loc>" + DOMINIO + "/tienda/mokositos-ninos</loc></url>\n"
                + "  <url><loc>" + DOMINIO + "/tienda/agrandaditos</loc></url>\n"
                + "  <url><loc>" + DOMINIO + "/tienda/mood-teens</loc></url>\n"
                + "</urlset>\n";
    }
}
