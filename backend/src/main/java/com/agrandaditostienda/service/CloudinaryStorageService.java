package com.agrandaditostienda.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Slf4j
@Service
public class CloudinaryStorageService {

    private static final String CARPETA_PRODUCTOS = "agrandaditostienda/productos";
    private static final String TRANSFORMACION_ENTREGA = "f_auto,q_auto,w_1600,c_limit";
    private static final String TRANSFORMACION_ORIGEN = "w_1600,c_limit,q_auto";
    private static final String PREFIJO_CLOUDINARY = "https://res.cloudinary.com/";

    private final Cloudinary cloudinary;
    private final boolean configurado;

    public CloudinaryStorageService(@Value("${cloudinary.cloud-name:}") String cloudName,
                                    @Value("${cloudinary.api-key:}") String apiKey,
                                    @Value("${cloudinary.api-secret:}") String apiSecret) {
        boolean hayCredenciales = cloudName != null && !cloudName.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank();
        if (!hayCredenciales) {
            this.cloudinary = null;
            this.configurado = false;
            log.info("Cloudinary no configurado: las subidas usan el fallback base64 y no se migran imágenes.");
            return;
        }
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret));
        this.configurado = true;
    }

    public boolean estaConfigurado() {
        return configurado;
    }

    /**
     * Sube una imagen nueva desde bytes. El original se descarta: se almacena la
     * versión WebP optimizada (máx. 1600px) y se devuelve la URL de entrega con
     * formato y calidad automáticos.
     */
    public String subirImagen(byte[] bytes) throws IOException {
        try {
            Map<?, ?> res = subir(bytes, null);
            return urlDeEntrega(res);
        } catch (IOException e) {
            throw e;
        } catch (Exception e) {
            throw new IOException("Error al subir la imagen a Cloudinary", e);
        }
    }

    /**
     * Migra una imagen remota existente: Cloudinary la descarga, la convierte a
     * WebP optimizado y la guarda como única copia (sin original). Devuelve la URL
     * de entrega, o null si no se pudo migrar.
     */
    public String migrarImagenDesdeUrl(String urlRemota) {
        if (!configurado) {
            return null;
        }
        try {
            Map<?, ?> res = subir(null, urlRemota);
            return urlDeEntrega(res);
        } catch (Exception e) {
            log.warn("No se pudo migrar la imagen {} a Cloudinary: {}", urlRemota, e.getMessage());
            return null;
        }
    }

    private Map<?, ?> subir(byte[] bytes, String urlRemota) throws Exception {
        Map<Object, Object> params = ObjectUtils.asMap(
                "folder", CARPETA_PRODUCTOS,
                "format", "webp",
                "transformation", TRANSFORMACION_ORIGEN);
        if (urlRemota != null) {
            return cloudinary.uploader().upload(urlRemota, params);
        }
        return cloudinary.uploader().upload(bytes, params);
    }

    private String urlDeEntrega(Map<?, ?> res) {
        String publicId = String.valueOf(res.get("public_id"));
        String version = String.valueOf(res.get("version"));
        return PREFIJO_CLOUDINARY
                + cloudinary.config.cloudName
                + "/image/upload/"
                + TRANSFORMACION_ENTREGA
                + "/v" + version
                + "/" + publicId + ".webp";
    }

    /**
     * Devuelve true si la URL ya es una entrega Cloudinary migrada (upload).
     */
    public boolean esUrlCloudinaryMigrada(String url) {
        return url != null && url.startsWith(PREFIJO_CLOUDINARY) && url.contains("/image/upload/");
    }

    /**
     * Extrae la URL remota original de una URL de fetch generada por una corrida anterior.
     */
    public String extraerOrigenDeFetch(String url) {
        if (url == null || !url.contains("/image/fetch/")) {
            return null;
        }
        int inicio = url.indexOf("https%3A");
        if (inicio < 0) {
            return null;
        }
        return URLDecoder.decode(url.substring(inicio), StandardCharsets.UTF_8);
    }
}