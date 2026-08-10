package com.mita.service;

import com.mita.dto.CambiarEstadoUsuarioRequest;
import com.mita.dto.CrearEncargadaRequest;
import com.mita.entity.RangoEdad;
import com.mita.entity.RolUsuario;
import com.mita.entity.Tienda;
import com.mita.entity.Usuario;
import com.mita.exception.ConflictoException;
import com.mita.exception.RecursoNoEncontradoException;
import com.mita.exception.ReglaNegocioException;
import com.mita.repository.TiendaRepository;
import com.mita.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private TiendaRepository tiendaRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @InjectMocks
    private UsuarioService usuarioService;

    private Tienda tienda() {
        Tienda tienda = new Tienda("Mokositos", "mokositos-bebes", RangoEdad.BEBES, "Bebés",
                "Ropa de bebés", "#FF69B4", "#333", "hero.png", "5491122334455", 1);
        tienda.setId(1L);
        return tienda;
    }

    private CrearEncargadaRequest request() {
        return new CrearEncargadaRequest("Juana", "juana", "clave123", "mokositos-bebes");
    }

    @Test
    void creaEncargadaCuandoNoHayConflicto() {
        Tienda tienda = tienda();
        when(tiendaRepository.findBySlugAndActivaTrue("mokositos-bebes")).thenReturn(Optional.of(tienda));
        when(usuarioRepository.existsByUsername("juana")).thenReturn(false);
        when(usuarioRepository.existsByRolAndTiendaId(RolUsuario.ENCARGADA, tienda.getId())).thenReturn(false);
        when(passwordEncoder.encode("clave123")).thenReturn("hash");

        Usuario guardado = new Usuario("Juana", "juana", "hash", RolUsuario.ENCARGADA, tienda);
        guardado.setId(10L);
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(guardado);

        var dto = usuarioService.crearEncargada(request());

        assertThat(dto.id()).isEqualTo(10L);
        assertThat(dto.username()).isEqualTo("juana");
        assertThat(dto.tiendaSlug()).isEqualTo("mokositos-bebes");
        verify(passwordEncoder).encode("clave123");
    }

    @Test
    void noCreaEncargadaConUsernameDuplicado() {
        Tienda tienda = tienda();
        when(tiendaRepository.findBySlugAndActivaTrue("mokositos-bebes")).thenReturn(Optional.of(tienda));
        when(usuarioRepository.existsByUsername("juana")).thenReturn(true);

        assertThatThrownBy(() -> usuarioService.crearEncargada(request()))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("ya existe");
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void noCreaEncargadaSiLaTiendaYaTieneUna() {
        Tienda tienda = tienda();
        when(tiendaRepository.findBySlugAndActivaTrue("mokositos-bebes")).thenReturn(Optional.of(tienda));
        when(usuarioRepository.existsByUsername("juana")).thenReturn(false);
        when(usuarioRepository.existsByRolAndTiendaId(RolUsuario.ENCARGADA, tienda.getId())).thenReturn(true);

        assertThatThrownBy(() -> usuarioService.crearEncargada(request()))
                .isInstanceOf(ConflictoException.class)
                .hasMessageContaining("ya tiene una encargada");
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void noCreaEncargadaDeTiendaInexistente() {
        when(tiendaRepository.findBySlugAndActivaTrue("mokositos-bebes")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> usuarioService.crearEncargada(request()))
                .isInstanceOf(RecursoNoEncontradoException.class);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void exigeTiendaEnLaSolicitud() {
        CrearEncargadaRequest sinTienda = new CrearEncargadaRequest("Juana", "juana", "clave123", "  ");

        assertThatThrownBy(() -> usuarioService.crearEncargada(sinTienda))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("tienda es obligatoria");
    }

    @Test
    void noCambiaEstadoDeUsuarioQueNoEsEncargada() {
        Usuario dueno = new Usuario("Dueño", "admin", "hash", RolUsuario.DUENO, null);
        dueno.setId(1L);
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(dueno));

        assertThatThrownBy(() -> usuarioService.cambiarEstado(1L, new CambiarEstadoUsuarioRequest(false)))
                .isInstanceOf(RecursoNoEncontradoException.class);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void cambiaEstadoDeEncargada() {
        Tienda tienda = tienda();
        Usuario encargada = new Usuario("Juana", "juana", "hash", RolUsuario.ENCARGADA, tienda);
        encargada.setId(10L);
        encargada.setActivo(true);
        when(usuarioRepository.findById(10L)).thenReturn(Optional.of(encargada));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        var dto = usuarioService.cambiarEstado(10L, new CambiarEstadoUsuarioRequest(false));

        assertThat(dto.activo()).isFalse();
        verify(usuarioRepository).save(encargada);
    }
}
