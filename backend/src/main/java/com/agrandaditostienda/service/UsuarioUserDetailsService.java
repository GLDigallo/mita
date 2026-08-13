package com.agrandaditostienda.service;

import com.agrandaditostienda.entity.Tienda;
import com.agrandaditostienda.entity.Usuario;
import com.agrandaditostienda.repository.UsuarioRepository;
import com.agrandaditostienda.security.UsuarioPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UsuarioUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByUsernameConTienda(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));
        Tienda tienda = usuario.getTienda();
        return new UsuarioPrincipal(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getUsername(),
                usuario.getPassword(),
                usuario.getRol(),
                tienda != null ? tienda.getId() : null,
                tienda != null ? tienda.getSlug() : null,
                tienda != null ? tienda.getNombre() : null,
                usuario.isActivo());
    }
}
