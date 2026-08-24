package com.agrandaditostienda.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;

@Configuration
public class DataSourceConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    public HikariDataSource dataSource() {
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return new HikariDataSource();
        }

        URI uri = URI.create(databaseUrl);
        String host = uri.getHost();
        int port = uri.getPort() != -1 ? uri.getPort() : 5432;
        String dbName = uri.getPath().substring(1);

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://" + host + ":" + port + "/" + dbName);
        config.setUsername(uri.getUserInfo().split(":")[0]);
        config.setPassword(uri.getUserInfo().split(":")[1]);

        String query = uri.getQuery();
        if (query != null && query.contains("sslmode=require")) {
            config.addDataSourceProperty("ssl", "true");
            config.addDataSourceProperty("sslmode", "require");
        }
        if (query != null && query.contains("channel_binding=require")) {
            config.addDataSourceProperty("channel_binding", "require");
        }

        return new HikariDataSource(config);
    }
}
