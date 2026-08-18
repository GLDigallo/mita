package com.agrandaditostienda.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .securityContext(context -> context
                        .securityContextRepository(new HttpSessionSecurityContextRepository())
                        .requireExplicitSave(false))
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/assets/**",
                                "/favicon.ico",
                                "/manifest.json"
                        ).permitAll()
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tiendas", "/api/tiendas/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/productos/destacados").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/productos").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/tiendas/*/productos").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/productos/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/productos/*").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/tiendas/*/categorias").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/categorias/*").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/categorias/*").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/upload/imagen/*").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/upload/imagen").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/consultas").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/consultas/**").authenticated()
                        .requestMatchers("/api/auth/login", "/api/auth/me").permitAll()
                        .requestMatchers("/api/dueño/**").hasRole("DUENO")
                        .requestMatchers(HttpMethod.GET, "/api/consultas/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/consultas/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/consultas/**").authenticated()
                        .requestMatchers("/api/ventas/**").authenticated()
                        .requestMatchers("/api/auth/logout").authenticated()
                        .requestMatchers("/api/**").denyAll()
                        .anyRequest().permitAll()
                )
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable());
        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
