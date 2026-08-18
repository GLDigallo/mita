package com.agrandaditostienda.service;

import com.agrandaditostienda.dto.LoginRequest;
import com.agrandaditostienda.dto.UsuarioActualDTO;
import com.agrandaditostienda.entity.RolUsuario;
import com.agrandaditostienda.exception.NoAutenticadoException;
import com.agrandaditostienda.security.UsuarioPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;
    @InjectMocks
    private AuthService authService;

    @AfterEach
    void limpiarContexto() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void loginExitosoRetornaUsuarioDTO() {
        LoginRequest request = new LoginRequest("admin", "admin123");
        HttpServletRequest httpRequest = mock(HttpServletRequest.class);
        when(httpRequest.getSession(true)).thenReturn(mock(HttpSession.class));

        UsuarioPrincipal principal = new UsuarioPrincipal(
                1L, "Admin", "admin", "pass", RolUsuario.DUENO, null, null, null, true);
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(auth);

        UsuarioActualDTO resultado = authService.login(request, httpRequest);

        assertThat(resultado.id()).isEqualTo(1L);
        assertThat(resultado.usuario()).isEqualTo("admin");
        assertThat(resultado.rol()).isEqualTo(RolUsuario.DUENO);
        verify(httpRequest).getSession(true);
    }

    @Test
    void loginCredencialesInvalidasLanzaExcepcion() {
        LoginRequest request = new LoginRequest("admin", "mala");
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Credenciales inválidas"));

        HttpServletRequest httpRequest = mock(HttpServletRequest.class);

        assertThatThrownBy(() -> authService.login(request, httpRequest))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void usuarioActualSinAutenticacionLanzaExcepcion() {
        assertThatThrownBy(() -> authService.usuarioActual())
                .isInstanceOf(NoAutenticadoException.class);
    }

    @Test
    void usuarioActualRetornaDTO() {
        UsuarioPrincipal principal = new UsuarioPrincipal(
                1L, "Encargada", "mokositos1", "pass", RolUsuario.ENCARGADA, 1L, "mokositos-bebes", "Mokositos", true);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        UsuarioActualDTO resultado = authService.usuarioActual();

        assertThat(resultado.id()).isEqualTo(1L);
        assertThat(resultado.usuario()).isEqualTo("mokositos1");
        assertThat(resultado.rol()).isEqualTo(RolUsuario.ENCARGADA);
        assertThat(resultado.tiendaId()).isEqualTo(1L);
    }
}
