package com.agrandaditostienda.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
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

    public CloudinaryStorageService(@Value("${cloudinary.url:}") String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.isBlank()) {
            this.cloudinary = null;
            this.configurado = false;
            log.info("Cloudinary no configurado: las subidas usan el fallback base64.");
            return;
        }
        Cloudinary instancia;
        try {
            instancia = new Cloudinary(cloudinaryUrl);
        } catch (IllegalArgumentException e) {
            instancia = null;
            log.warn("CLOUDINARY_URL mal formada (se ignora, sin exponer credenciales): "
                    + "las subidas usan el fallback base64.");
        }
        this.cloudinary = instancia;
        this.configurado = instancia != null;
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
            Map<?, ?> res = subir(bytes);
            return urlDeEntrega(res);
        } catch (IOException e) {
            throw e;
        } catch (Exception e) {
            throw new IOException("Error al subir la imagen a Cloudinary", e);
        }
    }

    private Map<?, ?> subir(byte[] bytes) throws Exception {
        Map<Object, Object> params = ObjectUtils.asMap(
                "folder", CARPETA_PRODUCTOS,
                "format", "webp",
                "transformation", TRANSFORMACION_ORIGEN);
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
}