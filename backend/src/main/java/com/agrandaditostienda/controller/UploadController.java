package com.agrandaditostienda.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @Value("${agrandaditostienda.upload-dir:uploads}")
    private String uploadDir;

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

        if (archivo.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body(Map.of("message", "La imagen no puede superar 5MB"));
        }

        String nombreArchivo = UUID.randomUUID() + extension;
        Path directorio = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(directorio);
        Path destino = directorio.resolve(nombreArchivo);
        archivo.transferTo(destino.toFile());

        String url = "/api/upload/imagen/" + nombreArchivo;
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/imagen/{nombre}")
    public ResponseEntity<byte[]> verImagen(@PathVariable String nombre) throws IOException {
        Path archivo = Paths.get(uploadDir).toAbsolutePath().normalize().resolve(nombre);
        if (!Files.exists(archivo)) {
            return ResponseEntity.notFound().build();
        }
        byte[] bytes = Files.readAllBytes(archivo);
        String contentType = "image/jpeg";
        if (nombre.endsWith(".png")) contentType = "image/png";
        else if (nombre.endsWith(".webp")) contentType = "image/webp";
        else if (nombre.endsWith(".gif")) contentType = "image/gif";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(bytes);
    }
}
