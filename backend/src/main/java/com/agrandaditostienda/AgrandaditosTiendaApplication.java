package com.agrandaditostienda;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.net.URI;

@SpringBootApplication
@EnableScheduling
public class AgrandaditosTiendaApplication {

    public static void main(String[] args) {
        applyDatabaseUrlFallback();
        SpringApplication.run(AgrandaditosTiendaApplication.class, args);
    }

    private static void applyDatabaseUrlFallback() {
        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return;
        }
        try {
            String trimmed = databaseUrl.trim();
            URI uri = URI.create(trimmed);
            String username = uri.getUserInfo() != null
                    ? uri.getUserInfo().split(":", 2)[0]
                    : "";
            String password = uri.getUserInfo() != null && uri.getUserInfo().contains(":")
                    ? uri.getUserInfo().split(":", 2)[1]
                    : "";
            String host = uri.getHost();
            int port = uri.getPort() == -1 ? 5432 : uri.getPort();
            String database = uri.getPath() != null ? uri.getPath().replaceFirst("^/", "") : "";

            String query = "?sslmode=require";
            if (host != null && host.contains("-pooler")) {
                query += "&prepareThreshold=0";
            }

            System.setProperty("spring.datasource.username", username);
            System.setProperty("spring.datasource.password", password);
            System.setProperty("spring.datasource.url",
                    "jdbc:postgresql://" + host + ":" + port + "/" + database + query);
        } catch (Exception ex) {
            System.err.println("No se pudo parsear DATABASE_URL: " + ex.getMessage());
        }
    }
}
