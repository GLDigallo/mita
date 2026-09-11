package com.agrandaditostienda.service;

import com.agrandaditostienda.entity.Categoria;
import com.agrandaditostienda.entity.Cliente;
import com.agrandaditostienda.entity.Consulta;
import com.agrandaditostienda.entity.EstadoConsulta;
import com.agrandaditostienda.entity.EstadoVenta;
import com.agrandaditostienda.entity.FormaPago;
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
        Producto producto = new Producto("Remera", "Remera lisa", new BigDecimal("100"), "remera.png",
                "T1,T2", Genero.NINO, false, tienda, new Categoria("Ropa", "ropa", 1, tienda));
        producto.setId(10L);
        return producto;
    }

    private Consulta consultaConItem(Tienda tienda, Producto producto, EstadoConsulta estado) {
        Consulta consulta = new Consulta();
        consulta.setId(1L);
        consulta.setNumero(7L);
        consulta.setEstado(estado);
        consulta.setTienda(tienda);
        consulta.setCliente(new Cliente("Juan", "1122334455"));
        consulta.setFormaPago(FormaPago.EFECTIVO);
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
    void confirmaConsultaCreandoVentaConfirmadaYDescontandoStock() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Producto producto = producto(tienda);
        Consulta consulta = consultaConItem(tienda, producto, EstadoConsulta.EN_PREPARACION);
        VarianteProducto variante = new VarianteProducto(producto, "Azul", "T1", 10);

        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));
        when(ventaRepository.siguienteNumero()).thenReturn(42L);
        when(varianteProductoRepository.findByProductoIdIn(any())).thenReturn(List.of(variante));
        when(ventaRepository.saveAndFlush(any(Venta.class))).thenAnswer(inv -> inv.getArgument(0));
        when(varianteProductoRepository.descontarStock(any(), anyInt(), any(Instant.class))).thenReturn(1);
        when(consultaRepository.save(any(Consulta.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ventaRepository.findDetalle(any())).thenReturn(Optional.of(new Venta()));
        when(ventaMapper.toDTO(any())).thenReturn(null);

        ventaService.confirmar(1L, "Encargada");

        ArgumentCaptor<Venta> captor = ArgumentCaptor.forClass(Venta.class);
        verify(ventaRepository).saveAndFlush(captor.capture());
        Venta venta = captor.getValue();
        assertThat(venta.getNumero()).isEqualTo(42L);
        assertThat(venta.getEmpleado()).isEqualTo("Encargada");
        assertThat(venta.getEstado()).isEqualTo(EstadoVenta.CONFIRMADA);
        assertThat(venta.getMetodoPago()).isEqualTo(MetodoPago.EFECTIVO);
        assertThat(venta.getImporteTotal()).isEqualByComparingTo(new BigDecimal("200"));
        assertThat(venta.getItems()).hasSize(1);
        assertThat(venta.getCliente().getTelefono()).isEqualTo("1122334455");

        verify(varianteProductoRepository).descontarStock(eq(variante.getId()), eq(2), any(Instant.class));
        ArgumentCaptor<Consulta> captorConsulta = ArgumentCaptor.forClass(Consulta.class);
        verify(consultaRepository).save(captorConsulta.capture());
        assertThat(captorConsulta.getValue().getEstado()).isEqualTo(EstadoConsulta.CONFIRMADA);
    }

    @Test
    void mapeaFormaDePagoTarjeta() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Producto producto = producto(tienda);
        Consulta consulta = consultaConItem(tienda, producto, EstadoConsulta.EN_PREPARACION);
        consulta.setFormaPago(FormaPago.TARJETA);

        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));
        when(ventaRepository.siguienteNumero()).thenReturn(42L);
        when(varianteProductoRepository.findByProductoIdIn(any()))
                .thenReturn(List.of(new VarianteProducto(producto, "Azul", "T1", 10)));
        when(ventaRepository.saveAndFlush(any(Venta.class))).thenAnswer(inv -> inv.getArgument(0));
        when(varianteProductoRepository.descontarStock(any(), anyInt(), any(Instant.class))).thenReturn(1);
        when(ventaRepository.findDetalle(any())).thenReturn(Optional.of(new Venta()));
        when(ventaMapper.toDTO(any())).thenReturn(null);

        ventaService.confirmar(1L, "Encargada");

        ArgumentCaptor<Venta> captor = ArgumentCaptor.forClass(Venta.class);
        verify(ventaRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getMetodoPago()).isEqualTo(MetodoPago.TARJETA_CREDITO);
    }

    @Test
    void mapeaFormaDePagoDigitalAMercadoPago() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Producto producto = producto(tienda);
        Consulta consulta = consultaConItem(tienda, producto, EstadoConsulta.EN_PREPARACION);
        consulta.setFormaPago(FormaPago.DIGITAL);

        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));
        when(ventaRepository.siguienteNumero()).thenReturn(42L);
        when(varianteProductoRepository.findByProductoIdIn(any()))
                .thenReturn(List.of(new VarianteProducto(producto, "Azul", "T1", 10)));
        when(ventaRepository.saveAndFlush(any(Venta.class))).thenAnswer(inv -> inv.getArgument(0));
        when(varianteProductoRepository.descontarStock(any(), anyInt(), any(Instant.class))).thenReturn(1);
        when(ventaRepository.findDetalle(any())).thenReturn(Optional.of(new Venta()));
        when(ventaMapper.toDTO(any())).thenReturn(null);

        ventaService.confirmar(1L, "Encargada");

        ArgumentCaptor<Venta> captor = ArgumentCaptor.forClass(Venta.class);
        verify(ventaRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getMetodoPago()).isEqualTo(MetodoPago.MERCADO_PAGO);
    }

    @Test
    void noConfirmaConsultaSinFormaDePago() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = consultaConItem(tienda, producto(tienda), EstadoConsulta.EN_PREPARACION);
        consulta.setFormaPago(null);
        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));

        assertThatThrownBy(() -> ventaService.confirmar(1L, "Encargada"))
                .isInstanceOf(VentaInvalidaException.class)
                .hasMessageContaining("forma de pago");
        verify(ventaRepository, never()).saveAndFlush(any());
    }

    @Test
    void noConfirmaConsultaCancelada() {
        autenticar(RolUsuario.DUENO, null);
        Consulta consulta = consultaConItem(tienda(1L), producto(tienda(1L)), EstadoConsulta.CANCELADA);
        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));

        assertThatThrownBy(() -> ventaService.confirmar(1L, "Encargada"))
                .isInstanceOf(VentaInvalidaException.class)
                .hasMessageContaining("en preparación");
        verify(ventaRepository, never()).saveAndFlush(any());
    }

    @Test
    void noConfirmaConsultaFinalizada() {
        autenticar(RolUsuario.DUENO, null);
        Consulta consulta = consultaConItem(tienda(1L), producto(tienda(1L)), EstadoConsulta.FINALIZADA);
        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));

        assertThatThrownBy(() -> ventaService.confirmar(1L, "Encargada"))
                .isInstanceOf(VentaInvalidaException.class);
        verify(ventaRepository, never()).saveAndFlush(any());
    }

    @Test
    void noConfirmaConsultaSinProductos() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = new Consulta();
        consulta.setId(1L);
        consulta.setNumero(7L);
        consulta.setEstado(EstadoConsulta.EN_PREPARACION);
        consulta.setTienda(tienda);
        consulta.setCliente(new Cliente("Juan", "1122334455"));
        consulta.setFormaPago(FormaPago.EFECTIVO);
        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));

        assertThatThrownBy(() -> ventaService.confirmar(1L, "Encargada"))
                .isInstanceOf(VentaInvalidaException.class)
                .hasMessageContaining("no tiene productos");
        verify(ventaRepository, never()).saveAndFlush(any());
    }

    @Test
    void noConfirmaSiElStockNoAlcanza() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Producto producto = producto(tienda);
        Consulta consulta = consultaConItem(tienda, producto, EstadoConsulta.EN_PREPARACION);

        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));
        when(ventaRepository.siguienteNumero()).thenReturn(42L);
        when(varianteProductoRepository.findByProductoIdIn(any()))
                .thenReturn(List.of(new VarianteProducto(producto, "Azul", "T1", 10)));
        when(ventaRepository.saveAndFlush(any(Venta.class))).thenAnswer(inv -> inv.getArgument(0));
        when(varianteProductoRepository.descontarStock(any(), anyInt(), any(Instant.class))).thenReturn(0);

        assertThatThrownBy(() -> ventaService.confirmar(1L, "Encargada"))
                .isInstanceOf(VentaInvalidaException.class)
                .hasMessageContaining("Stock insuficiente");
        verify(consultaRepository, never()).save(any());
        assertThat(consulta.getEstado()).isEqualTo(EstadoConsulta.EN_PREPARACION);
    }

    @Test
    void noPermiteConfirmarConsultaDeOtraTienda() {
        autenticar(RolUsuario.ENCARGADA, 1L);
        Consulta consulta = consultaConItem(tienda(2L), producto(tienda(2L)), EstadoConsulta.EN_PREPARACION);
        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));

        assertThatThrownBy(() -> ventaService.confirmar(1L, "Encargada"))
                .isInstanceOf(VentaInvalidaException.class)
                .hasMessageContaining("acceso");
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

        verify(varianteProductoRepository).reponerStock(eq(variante.getId()), eq(2), any(Instant.class));
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
    void noEntregaVentaNoConfirmada() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = consultaConItem(tienda, producto(tienda), EstadoConsulta.CANCELADA);
        Venta venta = ventaConItem(tienda, consulta, EstadoVenta.CANCELADA);

        when(ventaRepository.findDetalle(5L)).thenReturn(Optional.of(venta));

        assertThatThrownBy(() -> ventaService.entregar(5L, "Encargada"))
                .isInstanceOf(VentaInvalidaException.class)
                .hasMessageContaining("confirmada");
    }
}