package com.mita.security;

import com.mita.exception.NoAutenticadoException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class Seguridad {

    private Seguridad() {
    }

    public static Optional<UsuarioPrincipal> principal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = authentication.getPrincipal();
        return principal instanceof UsuarioPrincipal usuarioPrincipal
                ? Optional.of(usuarioPrincipal)
                : Optional.empty();
    }

    public static UsuarioPrincipal principalRequerido() {
        return principal().orElseThrow(NoAutenticadoException::new);
    }
}
