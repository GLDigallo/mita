package com.agrandaditostienda.service;

import com.agrandaditostienda.dto.ConfirmarVentaRequest;
import com.agrandaditostienda.entity.Categoria;
import com.agrandaditostienda.entity.Cliente;
import com.agrandaditostienda.entity.Consulta;
import com.agrandaditostienda.entity.EstadoConsulta;
import com.agrandaditostienda.entity.EstadoVenta;
import com.agrandaditostienda.entity.Genero;
import com.agrandaditostienda.entity.MetodoPago;
import com.agrandaditostienda.entity.Producto;
import com.agrandaditostienda.entity.ProductoConsultado;
import com.agrandaditostienda.entity.RangoEdad;
import com.agrandaditostienda.entity.RolUsuario;
import com.agrandaditostienda.entity.Tienda;
import com.agrandaditostienda.entity.VarianteProducto;
import com.agrandaditostienda.entity.Venta;
import com.agrandaditostienda.entity.VentaItem;
import com.agrandaditostienda.exception.VentaInvalidaException;
import com.agrandaditostienda.mapper.ConsultaMapper;
import com.agrandaditostienda.mapper.VentaMapper;
import com.agrandaditostienda.repository.ConsultaRepository;
import com.agrandaditostienda.repository.ProductoRepository;
import com.agrandaditostienda.repository.VarianteProductoRepository;
import com.agrandaditostienda.repository.VentaRepository;
import com.agrandaditostienda.security.UsuarioPrincipal;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VentaServiceTest {

    @Mock
    private VentaRepository ventaRepository;
    @Mock
    private ConsultaRepository consultaRepository;
    @Mock
    private ProductoRepository productoRepository;
    @Mock
    private VarianteProductoRepository varianteProductoRepository;
    @Mock
    private VentaMapper ventaMapper;
    @Mock
    private ConsultaMapper consultaMapper;
    @Mock
    private EntityManager entityManager;
    @InjectMocks
    private VentaService ventaService;

    @AfterEach
    void limpiarContexto() {
        SecurityContextHolder.clearContext();
    }

    private void autenticar(RolUsuario rol, Long tiendaId) {
        UsuarioPrincipal principal = new UsuarioPrincipal(
                1L, "Empleado", "empleado", "pass", rol, tiendaId, "mokositos-bebes", "Mokositos", true);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    private Tienda tienda(Long id) {
        Tienda tienda = new Tienda("Mokositos", "mokositos-bebes", RangoEdad.BEBES, "Bebés",
                "Ropa", "#FFF", "#000", "hero.png", "5491122334455", 1);
        tienda.setId(id);
        return tienda;
    }

    private Producto producto(Tienda tienda) {
        return new Producto("Remera", "Remera lisa", new BigDecimal("100"), "remera.png",
                "T1,T2", Genero.NINO, false, tienda, new Categoria("Ropa", "ropa", 1, tienda));
    }

    private Consulta consultaConItem(Tienda tienda, Producto producto, EstadoConsulta estado) {
        Consulta consulta = new Consulta();
        consulta.setId(1L);
        consulta.setNumero(7L);
        consulta.setEstado(estado);
        consulta.setTienda(tienda);
        consulta.setCliente(new Cliente("Juan", "1122334455"));
        consulta.agregarProductoConsultado(
                new ProductoConsultado(producto, "T1", "Azul", 2, null, producto.getPrecio()));
        return consulta;
    }

    private Venta ventaConItem(Tienda tienda, Consulta consulta, EstadoVenta estado) {
        Producto producto = producto(tienda);
        VarianteProducto variante = new VarianteProducto(producto, "Azul", "T1", 10);
        Venta venta = new Venta();
        venta.setId(5L);
        venta.setNumero(6L);
        venta.setEstado(estado);
        venta.setTienda(tienda);
        venta.setCliente(consulta.getCliente());
        venta.setConsulta(consulta);
        venta.setEmpleado("Encargada");
        venta.agregarItem(new VentaItem(producto, variante, "T1", "Azul", 2, producto.getPrecio()));
        return venta;
    }

    @Test
    void creaVentaDesdeConsultaCopiandoLosProductos() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Producto producto = producto(tienda);
        producto.setId(10L);
        Consulta consulta = consultaConItem(tienda, producto, EstadoConsulta.PENDIENTE);
        VarianteProducto variante = new VarianteProducto(producto, "Azul", "T1", 10);

        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));
        when(ventaRepository.findByConsultaId(1L)).thenReturn(Optional.empty());
        when(ventaRepository.siguienteNumero()).thenReturn(42L);
        when(varianteProductoRepository.findByProductoIdIn(any()))
                .thenReturn(List.of(variante));
        when(ventaRepository.saveAndFlush(any(Venta.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ventaRepository.findDetalle(any())).thenReturn(Optional.of(new Venta()));
        when(ventaMapper.toDTO(any())).thenReturn(null);

        ventaService.crearDesdeConsulta(1L, "Encargada");

        ArgumentCaptor<Venta> captor = ArgumentCaptor.forClass(Venta.class);
        verify(ventaRepository).saveAndFlush(captor.capture());
        Venta guardada = captor.getValue();
        assertThat(guardada.getNumero()).isEqualTo(42L);
        assertThat(guardada.getEmpleado()).isEqualTo("Encargada");
        assertThat(guardada.getCliente().getTelefono()).isEqualTo("1122334455");
        assertThat(guardada.getItems()).hasSize(1);
    }

    @Test
    void noCreaVentaDeConsultaCancelada() {
        autenticar(RolUsuario.DUENO, null);
        Consulta consulta = consultaConItem(tienda(1L), producto(tienda(1L)), EstadoConsulta.CANCELADA);
        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));

        assertThatThrownBy(() -> ventaService.crearDesdeConsulta(1L, "Encargada"))
                .isInstanceOf(VentaInvalidaException.class)
                .hasMessageContaining("cancelada");
        verify(ventaRepository, never()).save(any());
        verify(ventaRepository, never()).saveAndFlush(any());
    }

    @Test
    void noCreaVentaDeConsultaFinalizada() {
        autenticar(RolUsuario.DUENO, null);
        Consulta consulta = consultaConItem(tienda(1L), producto(tienda(1L)), EstadoConsulta.FINALIZADA);
        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));

        assertThatThrownBy(() -> ventaService.crearDesdeConsulta(1L, "Encargada"))
                .isInstanceOf(VentaInvalidaException.class);
        verify(ventaRepository, never()).save(any());
    }

    @Test
    void reutilizaVentaEnPreparacionExistente() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Producto producto = producto(tienda);
        Consulta consulta = consultaConItem(tienda, producto, EstadoConsulta.PENDIENTE);
        Venta existente = ventaConItem(tienda, consulta, EstadoVenta.EN_PREPARACION);

        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));
        when(ventaRepository.findByConsultaId(1L)).thenReturn(Optional.of(existente));
        when(ventaMapper.toDTO(any())).thenReturn(null);

        ventaService.crearDesdeConsulta(1L, "Encargada");

        verify(ventaRepository).findByConsultaId(1L);
        verify(ventaRepository, never()).saveAndFlush(any());
        verify(ventaRepository, never()).siguienteNumero();
    }

    @Test
    void noCreaVentaSiYaExisteUnaConfirmada() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = consultaConItem(tienda, producto(tienda), EstadoConsulta.PENDIENTE);
        Venta existente = ventaConItem(tienda, consulta, EstadoVenta.CONFIRMADA);

        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));
        when(ventaRepository.findByConsultaId(1L)).thenReturn(Optional.of(existente));

        assertThatThrownBy(() -> ventaService.crearDesdeConsulta(1L, "Encargada"))
                .isInstanceOf(VentaInvalidaException.class)
                .hasMessageContaining("ya tiene una venta");
        verify(ventaRepository, never()).saveAndFlush(any());
    }

    @Test
    void noPermiteCrearVentaDeOtraTienda() {
        autenticar(RolUsuario.ENCARGADA, 1L);
        Consulta consulta = consultaConItem(tienda(2L), producto(tienda(2L)), EstadoConsulta.PENDIENTE);
        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));

        assertThatThrownBy(() -> ventaService.crearDesdeConsulta(1L, "Encargada"))
                .isInstanceOf(VentaInvalidaException.class)
                .hasMessageContaining("acceso");
    }

    @Test
    void noConfirmaVentaSinProductos() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = consultaConItem(tienda, producto(tienda), EstadoConsulta.PENDIENTE);
        Venta venta = new Venta();
        venta.setId(5L);
        venta.setEstado(EstadoVenta.EN_PREPARACION);
        venta.setTienda(tienda);
        venta.setCliente(consulta.getCliente());
        venta.setConsulta(consulta);

        when(ventaRepository.findDetalle(5L)).thenReturn(Optional.of(venta));

        assertThatThrownBy(() -> ventaService.confirmar(5L, new ConfirmarVentaRequest(MetodoPago.EFECTIVO), "Encargada"))
                .isInstanceOf(VentaInvalidaException.class)
                .hasMessageContaining("no tiene productos");
    }

    @Test
    void noConfirmaVentaQueNoEstaEnPreparacion() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = consultaConItem(tienda, producto(tienda), EstadoConsulta.PENDIENTE);
        Venta venta = ventaConItem(tienda, consulta, EstadoVenta.CONFIRMADA);

        when(ventaRepository.findDetalle(5L)).thenReturn(Optional.of(venta));

        assertThatThrownBy(() -> ventaService.confirmar(5L, new ConfirmarVentaRequest(MetodoPago.EFECTIVO), "Encargada"))
                .isInstanceOf(VentaInvalidaException.class)
                .hasMessageContaining("en preparación");
    }

    @Test
    void confirmaVentaDescontandoStockYConfirmandoLaConsulta() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = consultaConItem(tienda, producto(tienda), EstadoConsulta.PENDIENTE);
        Venta venta = ventaConItem(tienda, consulta, EstadoVenta.EN_PREPARACION);
        VarianteProducto variante = venta.getItems().get(0).getVariante();

        when(ventaRepository.findDetalle(5L)).thenReturn(Optional.of(venta));
        when(varianteProductoRepository.descontarStock(any(), anyInt(), any(Instant.class))).thenReturn(1);
        when(ventaRepository.saveAndFlush(any(Venta.class))).thenAnswer(inv -> inv.getArgument(0));
        when(consultaRepository.save(any(Consulta.class))).thenAnswer(inv -> inv.getArgument(0));

        ventaService.confirmar(5L, new ConfirmarVentaRequest(MetodoPago.EFECTIVO), "Encargada");

        verify(varianteProductoRepository).descontarStock(any(), eq(2), any(Instant.class));
        assertThat(venta.getEstado()).isEqualTo(EstadoVenta.CONFIRMADA);
        assertThat(venta.getMetodoPago()).isEqualTo(MetodoPago.EFECTIVO);
        assertThat(venta.getImporteTotal()).isEqualByComparingTo(new BigDecimal("200"));
        assertThat(consulta.getEstado()).isEqualTo(EstadoConsulta.CONFIRMADA);
    }

    @Test
    void noConfirmaVentaSiElStockNoAlcanza() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = consultaConItem(tienda, producto(tienda), EstadoConsulta.PENDIENTE);
        Venta venta = ventaConItem(tienda, consulta, EstadoVenta.EN_PREPARACION);
        VarianteProducto variante = venta.getItems().get(0).getVariante();

        when(ventaRepository.findDetalle(5L)).thenReturn(Optional.of(venta));
        when(varianteProductoRepository.descontarStock(any(), anyInt(), any(Instant.class))).thenReturn(0);

        assertThatThrownBy(() -> ventaService.confirmar(5L, new ConfirmarVentaRequest(MetodoPago.EFECTIVO), "Encargada"))
                .isInstanceOf(VentaInvalidaException.class)
                .hasMessageContaining("Stock insuficiente");
        assertThat(consulta.getEstado()).isEqualTo(EstadoConsulta.PENDIENTE);
    }

    @Test
    void noCancelaVentaEntregada() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = consultaConItem(tienda, producto(tienda), EstadoConsulta.FINALIZADA);
        Venta venta = ventaConItem(tienda, consulta, EstadoVenta.ENTREGADA);

        when(ventaRepository.findDetalle(5L)).thenReturn(Optional.of(venta));

        assertThatThrownBy(() -> ventaService.cancelar(5L, "Encargada"))
                .isInstanceOf(VentaInvalidaException.class)
                .hasMessageContaining("entregada");
        verify(ventaRepository, never()).save(any());
    }

    @Test
    void noCancelaVentaYaCancelada() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = consultaConItem(tienda, producto(tienda), EstadoConsulta.CANCELADA);
        Venta venta = ventaConItem(tienda, consulta, EstadoVenta.CANCELADA);

        when(ventaRepository.findDetalle(5L)).thenReturn(Optional.of(venta));

        assertThatThrownBy(() -> ventaService.cancelar(5L, "Encargada"))
                .isInstanceOf(VentaInvalidaException.class);
    }

    @Test
    void cancelaVentaConfirmadaReponiendoStock() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = consultaConItem(tienda, producto(tienda), EstadoConsulta.CONFIRMADA);
        Venta venta = ventaConItem(tienda, consulta, EstadoVenta.CONFIRMADA);
        VarianteProducto variante = venta.getItems().get(0).getVariante();

        when(ventaRepository.findDetalle(5L)).thenReturn(Optional.of(venta));
        when(ventaRepository.save(any(Venta.class))).thenAnswer(inv -> inv.getArgument(0));
        when(consultaRepository.save(any(Consulta.class))).thenAnswer(inv -> inv.getArgument(0));

        ventaService.cancelar(5L, "Encargada");

        verify(varianteProductoRepository).reponerStock(any(), eq(2), any(Instant.class));
        assertThat(venta.getEstado()).isEqualTo(EstadoVenta.CANCELADA);
        assertThat(consulta.getEstado()).isEqualTo(EstadoConsulta.CANCELADA);
    }

    @Test
    void entregaVentaConfirmada() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = consultaConItem(tienda, producto(tienda), EstadoConsulta.CONFIRMADA);
        Venta venta = ventaConItem(tienda, consulta, EstadoVenta.CONFIRMADA);

        when(ventaRepository.findDetalle(5L)).thenReturn(Optional.of(venta));
        when(ventaRepository.save(any(Venta.class))).thenAnswer(inv -> inv.getArgument(0));
        when(consultaRepository.save(any(Consulta.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ventaMapper.toDTO(any())).thenReturn(null);

        ventaService.entregar(5L, "Encargada");

        assertThat(venta.getEstado()).isEqualTo(EstadoVenta.ENTREGADA);
        assertThat(consulta.getEstado()).isEqualTo(EstadoConsulta.FINALIZADA);
    }

    @Test
    void noEntregaVentaEnPreparacion() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = consultaConItem(tienda, producto(tienda), EstadoConsulta.EN_REVISION);
        Venta venta = ventaConItem(tienda, consulta, EstadoVenta.EN_PREPARACION);

        when(ventaRepository.findDetalle(5L)).thenReturn(Optional.of(venta));

        assertThatThrownBy(() -> ventaService.entregar(5L, "Encargada"))
                .isInstanceOf(VentaInvalidaException.class)
                .hasMessageContaining("confirmada");
    }
}
