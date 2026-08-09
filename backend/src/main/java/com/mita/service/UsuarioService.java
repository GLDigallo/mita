package com.mita.service;

import com.mita.dto.CambiarEstadoUsuarioRequest;
import com.mita.dto.CrearEncargadaRequest;
import com.mita.dto.EncargadaDTO;
import com.mita.entity.RolUsuario;
import com.mita.entity.Tienda;
import com.mita.entity.Usuario;
import com.mita.exception.RecursoNoEncontradoException;
import com.mita.exception.ReglaNegocioException;
import com.mita.repository.TiendaRepository;
import com.mita.repository.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final TiendaRepository tiendaRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          TiendaRepository tiendaRepository,
                          PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.tiendaRepository = tiendaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<EncargadaDTO> listarEncargadas() {
        return usuarioRepository.findAllConTienda().stream()
                .filter(u -> u.getRol() == RolUsuario.ENCARGADA)
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public EncargadaDTO crearEncargada(CrearEncargadaRequest request) {
        Tienda tienda = tiendaActivaValida(request.tiendaSlug());
        validarUsernameDisponible(request.username());
        validarSinEncargadaEn(tienda);

        Usuario encargada = new Usuario(
                request.nombre().trim(),
                request.username().trim(),
                passwordEncoder.encode(request.password()),
                RolUsuario.ENCARGADA,
                tienda);
        return toDTO(usuarioRepository.save(encargada));
    }

    @Transactional
    public EncargadaDTO cambiarEstado(Long id, CambiarEstadoUsuarioRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado: " + id));
        validarQueSeaEncargada(usuario);

        usuario.setActivo(request.activo());
        return toDTO(usuarioRepository.save(usuario));
    }

    private Tienda tiendaActivaValida(String slug) {
        if (slug == null || slug.isBlank()) {
            throw new ReglaNegocioException("La tienda es obligatoria");
        }
        return tiendaRepository.findBySlugAndActivaTrue(slug)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tienda no encontrada: " + slug));
    }

    private void validarUsernameDisponible(String username) {
        if (usuarioRepository.existsByUsername(username.trim())) {
            throw new DataIntegrityViolationException("El usuario '" + username + "' ya existe");
        }
    }

    private void validarSinEncargadaEn(Tienda tienda) {
        if (usuarioRepository.existsByRolAndTiendaId(RolUsuario.ENCARGADA, tienda.getId())) {
            throw new DataIntegrityViolationException(
                    "La tienda " + tienda.getNombre() + " ya tiene una encargada asignada");
        }
    }

    private void validarQueSeaEncargada(Usuario usuario) {
        if (usuario.getRol() != RolUsuario.ENCARGADA) {
            throw new RecursoNoEncontradoException("El usuario no es una encargada");
        }
    }

    private EncargadaDTO toDTO(Usuario usuario) {
        Tienda tienda = usuario.getTienda();
        return new EncargadaDTO(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getUsername(),
                usuario.getRol(),
                tienda != null ? tienda.getSlug() : null,
                tienda != null ? tienda.getNombre() : null,
                usuario.isActivo());
    }
}
