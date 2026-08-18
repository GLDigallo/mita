package com.agrandaditostienda.security;

import com.agrandaditostienda.exception.NoAutenticadoException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class Seguridad {

    private Seguridad() {
    }

    public static UsuarioPrincipal principalRequerido() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new NoAutenticadoException();
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UsuarioPrincipal usuarioPrincipal) {
            return usuarioPrincipal;
        }
        throw new NoAutenticadoException();
    }
}
