package com.agrandaditostienda.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
public class DataSourceConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    public HikariDataSource dataSource(DataSourceProperties properties) {
        if (databaseUrl == null || databaseUrl.isBlank()) {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(properties.getUrl());
            config.setUsername(properties.getUsername());
            config.setPassword(properties.getPassword());
            return new HikariDataSource(config);
        }

        Pattern pattern = Pattern.compile(
                "^postgresql://([^:]*):([^@]*)@([^:]+)(?::(\\d+))?/([^?]+)(?:\\?(.*))?$"
        );
        Matcher matcher = pattern.matcher(databaseUrl);
        if (!matcher.matches()) {
            throw new IllegalArgumentException("DATABASE_URL format invalid: " + databaseUrl.replaceAll("://[^:]*:[^@]*@", "://***:***@"));
        }

        String user = URLDecoder.decode(matcher.group(1), StandardCharsets.UTF_8);
        String password = URLDecoder.decode(matcher.group(2), StandardCharsets.UTF_8);
        String host = matcher.group(3);
        int port = matcher.group(4) != null ? Integer.parseInt(matcher.group(4)) : 5432;
        String dbName = matcher.group(5);
        String query = matcher.group(6);

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:postgresql://" + host + ":" + port + "/" + dbName);
        config.setUsername(user);
        config.setPassword(password);

        // Pool adaptado a Neon scale-to-zero: sin conexiones idle, así el compute
        // se suspende a los 5 min sin tráfico real y despierta solo (~300ms).
        // connectionTimeout amplio para tolerar el arranque del compute dormido.
        config.setMinimumIdle(0);
        config.setMaximumPoolSize(10);
        config.setIdleTimeout(300_000);
        config.setConnectionTimeout(30_000);
        config.setMaxLifetime(1_800_000);

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
