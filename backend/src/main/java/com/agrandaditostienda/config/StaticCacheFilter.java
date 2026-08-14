package com.agrandaditostienda.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Cabeceras de caché para los recursos estáticos:
 * los bundles de Vite llevan hash en el nombre (pueden cachearse 1 año), el HTML se
 * revalida siempre (cambia de nombre de bundle en cada build) y las imágenes no se cachean.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class StaticCacheFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (path.startsWith("/assets/")) {
            response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (path.equals("/") || path.equals("/index.html")) {
            response.setHeader("Cache-Control", "no-cache");
        } else if (path.startsWith("/uploads/")) {
            response.setHeader("Cache-Control", "public, max-age=86400");
        }
        filterChain.doFilter(request, response);
    }
}
