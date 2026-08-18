package com.agrandaditostienda.service;

import com.agrandaditostienda.dto.CrearConsultaRequest;
import com.agrandaditostienda.dto.ModificarConsultaRequest;
import com.agrandaditostienda.entity.Categoria;
import com.agrandaditostienda.entity.Cliente;
import com.agrandaditostienda.entity.Consulta;
import com.agrandaditostienda.entity.ConsultaVersion;
import com.agrandaditostienda.entity.ConsultaVersionCambio;
import com.agrandaditostienda.entity.EstadoConsulta;
import com.agrandaditostienda.entity.Genero;
import com.agrandaditostienda.entity.MotivoModificacion;
import com.agrandaditostienda.entity.Producto;
import com.agrandaditostienda.entity.ProductoConsultado;
import com.agrandaditostienda.entity.RangoEdad;
import com.agrandaditostienda.entity.RolUsuario;
import com.agrandaditostienda.entity.Tienda;
import com.agrandaditostienda.entity.TipoCambio;
import com.agrandaditostienda.entity.VarianteProducto;
import com.agrandaditostienda.entity.Venta;
import com.agrandaditostienda.entity.EstadoVenta;
import com.agrandaditostienda.exception.ConsultaInvalidaException;
import com.agrandaditostienda.mapper.ConsultaMapper;
import com.agrandaditostienda.repository.ClienteRepository;
import com.agrandaditostienda.repository.ConsultaRepository;
import com.agrandaditostienda.repository.ConsultaVersionRepository;
import com.agrandaditostienda.repository.ProductoRepository;
import com.agrandaditostienda.repository.VarianteProductoRepository;
import com.agrandaditostienda.repository.VentaRepository;
import com.agrandaditostienda.security.UsuarioPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConsultaServiceTest {

    @Mock
    private ConsultaRepository consultaRepository;
    @Mock
    private ClienteRepository clienteRepository;
    @Mock
    private ProductoRepository productoRepository;
    @Mock
    private VarianteProductoRepository varianteProductoRepository;
    @Mock
    private TiendaService tiendaService;
    @Mock
    private ConsultaMapper consultaMapper;
    @Mock
    private ConsultaVersionRepository consultaVersionRepository;
    @Mock
    private VentaRepository ventaRepository;
    @InjectMocks
    private ConsultaService consultaService;

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

    private Producto producto(Long id, Tienda tienda) {
        Producto producto = new Producto("Remera", "Remera lisa", new BigDecimal("100"), "remera.png",
                "T1,T2", Genero.NINO, false, tienda, new Categoria("Ropa", "ropa", 1, tienda));
        producto.setId(id);
        return producto;
    }

    private CrearConsultaRequest request(String nombre, String telefono) {
        return new CrearConsultaRequest(
                "mokositos-bebes",
                nombre,
                telefono,
                null,
                List.of(new CrearConsultaRequest.ItemConsultaRequest(10L, "Azul", "T1", 2, null)));
    }

    private void prepararDependencias(Tienda tienda, Producto producto) {
        when(tiendaService.obtenerEntidadPorSlug("mokositos-bebes")).thenReturn(tienda);
        when(productoRepository.findById(10L)).thenReturn(Optional.of(producto));
        when(varianteProductoRepository.findByProductoIdAndColorAndTalle(10L, "Azul", "T1"))
                .thenReturn(Optional.of(new VarianteProducto(producto, "Azul", "T1", 5)));
        when(consultaRepository.siguienteNumero()).thenReturn(7L);
        when(consultaRepository.save(any(Consulta.class))).thenAnswer(inv -> inv.getArgument(0));
        when(varianteProductoRepository.findByProductoIdInAndActivoTrueOrderByColorAscTalleAsc(anyList()))
                .thenReturn(List.of());
        when(ventaRepository.findByConsultaId(any())).thenReturn(Optional.empty());
        when(consultaMapper.toDTO(any(Consulta.class), anyMap(), anyBoolean(), any())).thenReturn(null);
    }

    private void prepararModificacion(Tienda tienda, Producto producto, Consulta consulta) {
        when(consultaRepository.findDetalle(consulta.getId())).thenReturn(Optional.of(consulta));
        when(consultaRepository.save(any(Consulta.class))).thenAnswer(inv -> inv.getArgument(0));
        when(productoRepository.findById(10L)).thenReturn(Optional.of(producto));
        when(varianteProductoRepository.findByProductoIdAndColorAndTalle(10L, "Azul", "T1"))
                .thenReturn(Optional.of(new VarianteProducto(producto, "Azul", "T1", 5)));
        when(varianteProductoRepository.findByProductoIdInAndActivoTrueOrderByColorAscTalleAsc(anyList()))
                .thenReturn(List.of());
        when(ventaRepository.findByConsultaId(any())).thenReturn(Optional.empty());
        when(consultaMapper.toDTO(any(Consulta.class), anyMap(), anyBoolean(), any())).thenReturn(null);
    }

    private Consulta consultaModificable(Tienda tienda) {
        Consulta consulta = new Consulta();
        consulta.setId(1L);
        consulta.setNumero(7L);
        consulta.setVersion(0);
        consulta.setTienda(tienda);
        consulta.setEstado(EstadoConsulta.PENDIENTE);
        consulta.setObservaciones("nota original");
        consulta.agregarProductoConsultado(new ProductoConsultado(
                producto(10L, tienda), "T1", "Azul", 2, "sin", new BigDecimal("100")));
        return consulta;
    }

    @Test
    void reutilizaClienteExistentePorTelefono() {
        Tienda tienda = tienda(1L);
        Producto producto = producto(10L, tienda);
        Cliente existente = new Cliente("Cliente Viejo", "1122334455");
        existente.setId(99L);
        prepararDependencias(tienda, producto);
        when(clienteRepository.findByTelefono("1122334455")).thenReturn(Optional.of(existente));

        consultaService.crear(request("Juan", "1122334455"));

        ArgumentCaptor<Consulta> captor = ArgumentCaptor.forClass(Consulta.class);
        verify(consultaRepository).save(captor.capture());
        assertThat(captor.getValue().getCliente()).isSameAs(existente);
        verify(clienteRepository, never()).save(any(Cliente.class));
    }

    @Test
    void creaClienteNuevoSiNoExiste() {
        Tienda tienda = tienda(1L);
        Producto producto = producto(10L, tienda);
        prepararDependencias(tienda, producto);
        when(clienteRepository.findByTelefono("1122334455")).thenReturn(Optional.empty());
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(inv -> {
            Cliente cliente = inv.getArgument(0);
            cliente.setId(200L);
            return cliente;
        });

        consultaService.crear(request("  Juan  ", "1122334455"));

        ArgumentCaptor<Cliente> clienteCaptor = ArgumentCaptor.forClass(Cliente.class);
        verify(clienteRepository).save(clienteCaptor.capture());
        assertThat(clienteCaptor.getValue().getTelefono()).isEqualTo("1122334455");
        assertThat(clienteCaptor.getValue().getNombre()).isEqualTo("Juan");

        ArgumentCaptor<Consulta> consultaCaptor = ArgumentCaptor.forClass(Consulta.class);
        verify(consultaRepository).save(consultaCaptor.capture());
        assertThat(consultaCaptor.getValue().getCliente().getTelefono()).isEqualTo("1122334455");
    }

    @Test
    void anteConflictoDeConcurrenciaReutilizaElClienteGanador() {
        Tienda tienda = tienda(1L);
        Producto producto = producto(10L, tienda);
        Cliente ganador = new Cliente("Ganador", "1122334455");
        ganador.setId(300L);
        prepararDependencias(tienda, producto);
        when(clienteRepository.findByTelefono("1122334455"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(ganador));
        when(clienteRepository.save(any(Cliente.class)))
                .thenThrow(new DataIntegrityViolationException("uk_cliente_telefono"));

        consultaService.crear(request("Juan", "1122334455"));

        ArgumentCaptor<Consulta> captor = ArgumentCaptor.forClass(Consulta.class);
        verify(consultaRepository).save(captor.capture());
        assertThat(captor.getValue().getCliente()).isSameAs(ganador);
    }

    @Test
    void noCreaConsultaConProductoDeOtraTienda() {
        Tienda tienda = tienda(1L);
        Producto productoDeOtraTienda = producto(10L, tienda(2L));
        when(tiendaService.obtenerEntidadPorSlug("mokositos-bebes")).thenReturn(tienda);
        when(productoRepository.findById(10L)).thenReturn(Optional.of(productoDeOtraTienda));
        when(clienteRepository.findByTelefono("1122334455")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> consultaService.crear(request("Juan", "1122334455")))
                .isInstanceOf(ConsultaInvalidaException.class)
                .hasMessageContaining("no pertenece a la sucursal");
        verify(consultaRepository, never()).save(any());
    }

    @Test
    void noCreaConsultaConVarianteInexistente() {
        Tienda tienda = tienda(1L);
        Producto producto = producto(10L, tienda);
        when(tiendaService.obtenerEntidadPorSlug("mokositos-bebes")).thenReturn(tienda);
        when(productoRepository.findById(10L)).thenReturn(Optional.of(producto));
        when(clienteRepository.findByTelefono("1122334455")).thenReturn(Optional.empty());
        when(varianteProductoRepository.findByProductoIdAndColorAndTalle(10L, "Azul", "T1"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> consultaService.crear(request("Juan", "1122334455")))
                .isInstanceOf(ConsultaInvalidaException.class)
                .hasMessageContaining("Variante no disponible");
        verify(consultaRepository, never()).save(any());
    }

    @Test
    void listaSoloConsultasDeLaTiendaDeLaEncargada() {
        autenticar(RolUsuario.ENCARGADA, 1L);
        when(consultaRepository.buscar(EstadoConsulta.PENDIENTE, 1L, null)).thenReturn(List.of());

        var resultado = consultaService.listar(EstadoConsulta.PENDIENTE, null, null);

        assertThat(resultado).isEmpty();
        verify(consultaRepository).buscar(EstadoConsulta.PENDIENTE, 1L, null);
    }

    @Test
    void noPermiteListarOtraTiendaComoEncargada() {
        autenticar(RolUsuario.ENCARGADA, 1L);

        assertThatThrownBy(() -> consultaService.listar(null, 2L, null))
                .isInstanceOf(ConsultaInvalidaException.class)
                .hasMessageContaining("acceso");
    }

    @Test
    void noPermiteVerConsultaDeOtraTienda() {
        autenticar(RolUsuario.ENCARGADA, 1L);
        Tienda tienda = tienda(2L);
        Consulta consulta = new Consulta();
        consulta.setId(1L);
        consulta.setTienda(tienda);
        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));

        assertThatThrownBy(() -> consultaService.obtener(1L))
                .isInstanceOf(ConsultaInvalidaException.class)
                .hasMessageContaining("acceso");
    }

    @Test
    void crearGuardaVersionInicialSnapshot() {
        Tienda tienda = tienda(1L);
        Producto producto = producto(10L, tienda);
        prepararDependencias(tienda, producto);
        when(clienteRepository.findByTelefono("1122334455")).thenReturn(Optional.empty());
        when(clienteRepository.save(any(Cliente.class))).thenAnswer(inv -> {
            Cliente cliente = inv.getArgument(0);
            cliente.setId(200L);
            return cliente;
        });

        consultaService.crear(request("Juan", "1122334455"));

        ArgumentCaptor<ConsultaVersion> captor = ArgumentCaptor.forClass(ConsultaVersion.class);
        verify(consultaVersionRepository).save(captor.capture());
        ConsultaVersion version = captor.getValue();
        assertThat(version.getVersion()).isZero();
        assertThat(version.getMotivo()).isNull();
        assertThat(version.getEmpleado()).isNull();
        assertThat(version.getItems()).hasSize(1);
        assertThat(version.getCambios()).isEmpty();
    }

    @Test
    void modificarIncrementaVersionYGuardaCambios() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Producto producto = producto(10L, tienda);
        Consulta consulta = consultaModificable(tienda);
        prepararModificacion(tienda, producto, consulta);

        consultaService.modificar(1L, new ModificarConsultaRequest(
                MotivoModificacion.CAMBIO_CANTIDAD,
                "nota nueva",
                List.of(new CrearConsultaRequest.ItemConsultaRequest(10L, "Azul", "T1", 3, "sin"))));

        ArgumentCaptor<Consulta> consultaCaptor = ArgumentCaptor.forClass(Consulta.class);
        verify(consultaRepository).save(consultaCaptor.capture());
        assertThat(consultaCaptor.getValue().getVersion()).isEqualTo(1);
        assertThat(consultaCaptor.getValue().getObservaciones()).isEqualTo("nota nueva");

        ArgumentCaptor<ConsultaVersion> versionCaptor = ArgumentCaptor.forClass(ConsultaVersion.class);
        verify(consultaVersionRepository).save(versionCaptor.capture());
        ConsultaVersion version = versionCaptor.getValue();
        assertThat(version.getVersion()).isEqualTo(1);
        assertThat(version.getMotivo()).isEqualTo(MotivoModificacion.CAMBIO_CANTIDAD);
        assertThat(version.getEmpleado()).isEqualTo("Empleado");
        assertThat(version.getItems()).hasSize(1);
        assertThat(version.getCambios())
                .extracting(ConsultaVersionCambio::getTipo)
                .contains(TipoCambio.CAMBIO_CANTIDAD);
    }

    @Test
    void noModificaConsultaConfirmada() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = consultaModificable(tienda);
        consulta.setEstado(EstadoConsulta.CONFIRMADA);
        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));

        assertThatThrownBy(() -> consultaService.modificar(1L, new ModificarConsultaRequest(
                MotivoModificacion.OTRO, null, List.of())))
                .isInstanceOf(ConsultaInvalidaException.class)
                .hasMessageContaining("No se puede modificar");
        verify(consultaRepository, never()).save(any());
        verify(consultaVersionRepository, never()).save(any());
    }

    @Test
    void noModificaConsultaConVentaEnPreparacion() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = consultaModificable(tienda);
        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));
        when(ventaRepository.existsByConsultaId(1L)).thenReturn(true);
        Venta ventaEnPreparacion = new Venta();
        ventaEnPreparacion.setEstado(EstadoVenta.EN_PREPARACION);
        when(ventaRepository.findByConsultaId(1L)).thenReturn(Optional.of(ventaEnPreparacion));

        assertThatThrownBy(() -> consultaService.modificar(1L, new ModificarConsultaRequest(
                MotivoModificacion.OTRO, null, List.of())))
                .isInstanceOf(ConsultaInvalidaException.class)
                .hasMessageContaining("venta");
        verify(consultaRepository, never()).save(any());
    }

    @Test
    void historialDevuelveVersionesOrdenadasPorVersion() {
        autenticar(RolUsuario.DUENO, null);
        Tienda tienda = tienda(1L);
        Consulta consulta = new Consulta();
        consulta.setId(1L);
        consulta.setNumero(7L);
        consulta.setTienda(tienda);
        when(consultaRepository.findDetalle(1L)).thenReturn(Optional.of(consulta));
        ConsultaVersion v1 = new ConsultaVersion();
        v1.setId(2L);
        v1.setVersion(1);
        ConsultaVersion v0 = new ConsultaVersion();
        v0.setId(1L);
        v0.setVersion(0);
        when(consultaVersionRepository.findHistorialCompleto(1L)).thenReturn(List.of(v1, v0));
        when(consultaMapper.toVersionDTO(any(Consulta.class), any(ConsultaVersion.class))).thenReturn(null);

        consultaService.historial(1L);

        ArgumentCaptor<ConsultaVersion> captor = ArgumentCaptor.forClass(ConsultaVersion.class);
        verify(consultaMapper, times(2)).toVersionDTO(any(Consulta.class), captor.capture());
        assertThat(captor.getAllValues()).extracting(ConsultaVersion::getVersion)
                .containsExactly(0, 1);
    }
}
