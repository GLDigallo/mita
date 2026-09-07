package com.agrandaditostienda.config;

import com.agrandaditostienda.entity.Producto;
import com.agrandaditostienda.entity.Tienda;
import com.agrandaditostienda.repository.ProductoRepository;
import com.agrandaditostienda.repository.TiendaRepository;
import com.agrandaditostienda.service.CloudinaryStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@Order(2)
public class ImagenMigrator implements CommandLineRunner {

    private final ProductoRepository productoRepository;
    private final TiendaRepository tiendaRepository;
    private final CloudinaryStorageService storage;

    public ImagenMigrator(ProductoRepository productoRepository,
                          TiendaRepository tiendaRepository,
                          CloudinaryStorageService storage) {
        this.productoRepository = productoRepository;
        this.tiendaRepository = tiendaRepository;
        this.storage = storage;
    }

    @Override
    public void run(String... args) {
        if (!storage.estaConfigurado()) {
            log.info("Cloudinary no configurado: se omite la migración de imágenes.");
            return;
        }

        int productosMigrados = migrarProductos();
        int heroesMigrados = migrarHeroes();
        log.info("Migración de imágenes a Cloudinary: {} productos, {} héroes.", productosMigrados, heroesMigrados);
    }

    private int migrarProductos() {
        int migrados = 0;
        List<Producto> productos = productoRepository.findAll();
        for (Producto producto : productos) {
            String nuevaUrl = migrar(producto.getImagen());
            if (nuevaUrl == null) {
                continue;
            }
            producto.setImagen(nuevaUrl);
            productoRepository.save(producto);
            migrados++;
        }
        return migrados;
    }

    private int migrarHeroes() {
        int migrados = 0;
        List<Tienda> tiendas = tiendaRepository.findAll();
        for (Tienda tienda : tiendas) {
            String nuevaUrl = migrar(tienda.getImagenHero());
            if (nuevaUrl == null) {
                continue;
            }
            tienda.setImagenHero(nuevaUrl);
            tiendaRepository.save(tienda);
            migrados++;
        }
        return migrados;
    }

    /**
     * Re-sube a Cloudinary la imagen que apunta a una URL remota o a un fetch anterior,
     * devolviendo la nueva URL de entrega, o null si no hay nada que migrar.
     */
    private String migrar(String actual) {
        String origen = resolverOrigen(actual);
        if (origen == null) {
            return null;
        }
        return storage.migrarImagenDesdeUrl(origen);
    }

    /**
     * Devuelve la URL remota a re-subir, o null si la imagen ya está migrada o es inválida.
     */
    private String resolverOrigen(String actual) {
        if (actual == null || actual.isBlank()) {
            return null;
        }
        if (storage.esUrlCloudinaryMigrada(actual)) {
            return null;
        }
        String origen = storage.extraerOrigenDeFetch(actual);
        if (origen != null) {
            return origen;
        }
        if (actual.startsWith("http")) {
            return actual;
        }
        return null;
    }
}