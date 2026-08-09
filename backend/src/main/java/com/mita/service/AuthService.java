package com.mita.service;

import com.mita.dto.LoginRequest;
import com.mita.dto.UsuarioActualDTO;
import com.mita.exception.NoAutenticadoException;
import com.mita.security.UsuarioPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextHolderStrategy strategy = SecurityContextHolder.getContextHolderStrategy();

    public AuthService(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    public UsuarioActualDTO login(LoginRequest request, HttpServletRequest httpRequest) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(request.usuario(), request.clave()));
        SecurityContext context = strategy.createEmptyContext();
        context.setAuthentication(authentication);
        strategy.setContext(context);
        httpRequest.getSession(true);
        return toDTO(authentication);
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null) {
            new SecurityContextLogoutHandler().logout(request, response, authentication);
        }
    }

    public UsuarioActualDTO usuarioActual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getAuthorities().stream().anyMatch(a -> "ROLE_ANONYMOUS".equals(a.getAuthority()))) {
            throw new NoAutenticadoException();
        }
        return toDTO(authentication);
    }

    private UsuarioActualDTO toDTO(Authentication authentication) {
        if (authentication.getPrincipal() instanceof UsuarioPrincipal principal) {
            return new UsuarioActualDTO(
                    principal.id(),
                    principal.getUsername(),
                    principal.nombre(),
                    principal.rol(),
                    principal.tiendaSlug(),
                    principal.tiendaNombre());
        }
        return new UsuarioActualDTO(
                null,
                authentication.getName(),
                null,
                null,
                null,
                null);
    }
}
