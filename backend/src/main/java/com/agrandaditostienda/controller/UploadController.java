package com.agrandaditostienda.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @PostMapping("/imagen")
    public ResponseEntity<Map<String, String>> subirImagen(@RequestParam("archivo") MultipartFile archivo) throws IOException {
        if (archivo.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El archivo está vacío"));
        }

        String original = archivo.getOriginalFilename();
        String extension = "";
        if (original != null && original.contains(".")) {
            extension = original.substring(original.lastIndexOf(".")).toLowerCase();
        }

        String[] permitidos = {".jpg", ".jpeg", ".png", ".webp", ".gif"};
        boolean permitido = false;
        for (String ext : permitidos) {
            if (ext.equals(extension)) { permitido = true; break; }
        }
        if (!permitido) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tipo de archivo no permitido. Usá JPG, PNG o WebP."));
        }

        if (archivo.getSize() > 10 * 1024 * 1024) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body(Map.of("message", "La imagen no puede superar 10MB"));
        }

        String contentType = archivo.getContentType();
        if (contentType == null) {
            contentType = "image/jpeg";
        }

        byte[] bytes = archivo.getBytes();
        String base64 = java.util.Base64.getEncoder().encodeToString(bytes);
        String dataUrl = "data:" + contentType + ";base64," + base64;

        return ResponseEntity.ok(Map.of("url", dataUrl));
    }
}
