package com.agrandaditostienda.security;

import com.agrandaditostienda.entity.RolUsuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public record UsuarioPrincipal(
        Long id,
        String nombre,
        String username,
        String password,
        RolUsuario rol,
        Long tiendaId,
        String tiendaSlug,
        String tiendaNombre,
        boolean activo
) implements UserDetails {

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + rol.name()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isEnabled() {
        return activo;
    }

    public boolean esEncargada() {
        return rol == RolUsuario.ENCARGADA;
    }
}
