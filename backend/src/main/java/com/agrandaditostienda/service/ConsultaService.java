package com.agrandaditostienda.service;

import com.agrandaditostienda.dto.ConsultaCreadaDTO;
import com.agrandaditostienda.dto.ConsultaDTO;
import com.agrandaditostienda.dto.ConsultaResumenDTO;
import com.agrandaditostienda.dto.ConsultaVersionDTO;
import com.agrandaditostienda.dto.CrearConsultaRequest;
import com.agrandaditostienda.dto.ModificarConsultaRequest;
import com.agrandaditostienda.entity.Cliente;
import com.agrandaditostienda.entity.Consulta;
import com.agrandaditostienda.entity.ConsultaVersion;
import com.agrandaditostienda.entity.ConsultaVersionCambio;
import com.agrandaditostienda.entity.ConsultaVersionItem;
import com.agrandaditostienda.entity.EstadoConsulta;
import com.agrandaditostienda.entity.FormaPago;
import com.agrandaditostienda.entity.MotivoModificacion;
import com.agrandaditostienda.entity.Producto;
import com.agrandaditostienda.entity.ProductoConsultado;
import com.agrandaditostienda.entity.Tienda;
import com.agrandaditostienda.entity.TipoCambio;
import com.agrandaditostienda.entity.VarianteProducto;
import com.agrandaditostienda.exception.ConsultaInvalidaException;
import com.agrandaditostienda.exception.RecursoNoEncontradoException;
import com.agrandaditostienda.mapper.ConsultaMapper;
import com.agrandaditostienda.repository.ClienteRepository;
import com.agrandaditostienda.repository.ConsultaRepository;
import com.agrandaditostienda.repository.ConsultaVersionRepository;
import com.agrandaditostienda.repository.ProductoRepository;
import com.agrandaditostienda.repository.VarianteProductoRepository;
import com.agrandaditostienda.repository.VentaRepository;
import com.agrandaditostienda.security.Seguridad;
import com.agrandaditostienda.security.UsuarioPrincipal;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ConsultaService {

    private static final Logger log = LoggerFactory.getLogger(ConsultaService.class);
    private static final Duration TIEMPO_CANCELACION_PENDIENTE = Duration.ofHours(48);

    private final ConsultaRepository consultaRepository;
    private final ClienteRepository clienteRepository;
    private final ProductoRepository productoRepository;
    private final VarianteProductoRepository varianteProductoRepository;
    private final TiendaService tiendaService;
    private final ConsultaMapper consultaMapper;
    private final ConsultaVersionRepository consultaVersionRepository;
    private final VentaRepository ventaRepository;

    public ConsultaService(ConsultaRepository consultaRepository,
                           ClienteRepository clienteRepository,
                           ProductoRepository productoRepository,
                           VarianteProductoRepository varianteProductoRepository,
                           TiendaService tiendaService,
                           ConsultaMapper consultaMapper,
                           ConsultaVersionRepository consultaVersionRepository,
                           VentaRepository ventaRepository) {
        this.consultaRepository = consultaRepository;
        this.clienteRepository = clienteRepository;
        this.productoRepository = productoRepository;
        this.varianteProductoRepository = varianteProductoRepository;
        this.tiendaService = tiendaService;
        this.consultaMapper = consultaMapper;
        this.consultaVersionRepository = consultaVersionRepository;
        this.ventaRepository = ventaRepository;
    }

    @Transactional
    public ConsultaCreadaDTO crear(CrearConsultaRequest request) {
        Tienda tienda = tiendaService.obtenerEntidadPorSlug(request.tiendaSlug());
        Cliente cliente = obtenerOCrearCliente(request.nombre(), request.telefono());

        Consulta consulta = new Consulta();
        consulta.setTienda(tienda);
        consulta.setCliente(cliente);
        consulta.setEstado(EstadoConsulta.PENDIENTE);
        consulta.setNumero(consultaRepository.siguienteNumero());
        consulta.setObservaciones(observacionLimpia(request.observaciones()));
        agregarProductos(consulta, request.items());

        Consulta guardada = consultaRepository.save(consulta);
        guardarVersion(guardada, null, null, List.of());

        ConsultaDTO dto = consultaMapper.toDTO(guardada, variantesDe(guardada.getProductosConsultados()), esEditable(guardada), ventaAsociadaEstado(guardada));
        String mensaje = construirMensaje(guardada);
        String enlace = "https://wa.me/" + tienda.getWhatsapp() + "?text="
                + URLEncoder.encode(mensaje, StandardCharsets.UTF_8);
        return new ConsultaCreadaDTO(dto, mensaje, enlace);
    }

    @Transactional
    public ConsultaDTO modificar(Long id, ModificarConsultaRequest request) {
        Consulta consulta = consultaRepository.findDetalle(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Consulta no encontrada: " + id));
        verificarAcceso(consulta);
        validarModificable(consulta);

        List<LineaItem> anteriores = consulta.getProductosConsultados().stream()
                .map(this::aLinea)
                .toList();

        consulta.getProductosConsultados().clear();
        agregarProductos(consulta, request.items());
        consulta.setObservaciones(observacionLimpia(request.observaciones()));
        consulta.setVersion(consulta.getVersion() + 1);
        Consulta guardada = consultaRepository.save(consulta);

        List<LineaItem> nuevos = guardada.getProductosConsultados().stream()
                .map(this::aLinea)
                .toList();
        List<ConsultaVersionCambio> cambios = calcularCambios(anteriores, nuevos);
        guardarVersion(guardada, request.motivo(), Seguridad.principalRequerido().nombre(), cambios);

        return consultaMapper.toDTO(guardada, variantesDe(guardada.getProductosConsultados()), esEditable(guardada), ventaAsociadaEstado(guardada));
    }

    @Transactional(readOnly = true)
    public List<ConsultaVersionDTO> historial(Long id) {
        Consulta consulta = consultaRepository.findDetalle(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Consulta no encontrada: " + id));
        verificarAcceso(consulta);
        List<ConsultaVersion> versiones = new ArrayList<>(consultaVersionRepository.findHistorialCompleto(id));
        versiones.sort(Comparator.comparingInt(ConsultaVersion::getVersion));
        return versiones.stream()
                .map(version -> consultaMapper.toVersionDTO(consulta, version))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ConsultaResumenDTO> listar(EstadoConsulta estado, Long tiendaId, String busqueda) {
        String termino = (busqueda == null || busqueda.isBlank()) ? null
                : "%" + busqueda.trim().toLowerCase() + "%";
        List<Consulta> consultas = consultaRepository.buscar(estado, tiendaIdPermitida(tiendaId), termino);
        Map<Long, Integer> itemsPorConsulta = contarItems(consultas);
        return consultas.stream()
                .map(c -> new ConsultaResumenDTO(
                        c.getId(),
                        consultaMapper.formatearNumeroConVersion(c.getNumero(), c.getVersion()),
                        c.getEstado(),
                        c.getFormaPago(),
                        c.getFechaConsulta(),
                        c.getTienda().getSlug(),
                        c.getTienda().getNombre(),
                        c.getCliente().getNombre(),
                        c.getCliente().getTelefono(),
                        itemsPorConsulta.getOrDefault(c.getId(), 0)))
                .toList();
    }

    @Transactional(readOnly = true)
    public ConsultaDTO obtener(Long id) {
        Consulta consulta = consultaRepository.findDetalle(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Consulta no encontrada: " + id));
        verificarAcceso(consulta);
        return consultaMapper.toDTO(consulta, variantesDe(consulta.getProductosConsultados()), esEditable(consulta), ventaAsociadaEstado(consulta));
    }

    @Transactional
    public ConsultaDTO cambiarEstado(Long id, EstadoConsulta estado) {
        Consulta consulta = consultaRepository.findDetalle(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Consulta no encontrada: " + id));
        verificarAcceso(consulta);
        if (esEstadoCerrado(consulta.getEstado())) {
            throw new ConsultaInvalidaException(
                    "La consulta está " + etiquetaEstado(consulta.getEstado()) + " y no admite cambios de estado");
        }
        consulta.setEstado(estado);
        Consulta guardada = consultaRepository.save(consulta);
        return consultaMapper.toDTO(guardada, variantesDe(guardada.getProductosConsultados()), esEditable(guardada), ventaAsociadaEstado(guardada));
    }

    @Transactional
    public ConsultaDTO cambiarFormaPago(Long id, FormaPago formaPago) {
        Consulta consulta = consultaRepository.findDetalle(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Consulta no encontrada: " + id));
        verificarAcceso(consulta);
        consulta.setFormaPago(formaPago);
        Consulta guardada = consultaRepository.save(consulta);
        return consultaMapper.toDTO(guardada, variantesDe(guardada.getProductosConsultados()), esEditable(guardada), ventaAsociadaEstado(guardada));
    }

    @Transactional
    public ConsultaDTO actualizarNotaInterna(Long id, String notaInterna) {
        Consulta consulta = consultaRepository.findDetalle(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Consulta no encontrada: " + id));
        verificarAcceso(consulta);
        consulta.setNotaInterna((notaInterna == null || notaInterna.isBlank()) ? null : notaInterna.trim());
        Consulta guardada = consultaRepository.save(consulta);
        return consultaMapper.toDTO(guardada, variantesDe(guardada.getProductosConsultados()), esEditable(guardada), ventaAsociadaEstado(guardada));
    }

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void cancelarPendientesVencidas() {
        Instant limite = Instant.now().minus(TIEMPO_CANCELACION_PENDIENTE);
        List<Consulta> vencidas = consultaRepository.vencidasSinVenta(EstadoConsulta.PENDIENTE, limite);
        if (vencidas.isEmpty()) {
            return;
        }
        for (Consulta consulta : vencidas) {
            consulta.setEstado(EstadoConsulta.CANCELADA);
        }
        consultaRepository.saveAll(vencidas);
        log.info("{} consulta(s) PENDIENTE canceladas automáticamente por superar las 48h", vencidas.size());
    }

    private Long tiendaIdPermitida(Long tiendaId) {
        UsuarioPrincipal principal = Seguridad.principalRequerido();
        if (principal.esEncargada()) {
            if (tiendaId != null && !tiendaId.equals(principal.tiendaId())) {
                throw new ConsultaInvalidaException("No tiene acceso a esa tienda");
            }
            return principal.tiendaId();
        }
        return tiendaId;
    }

    private void verificarAcceso(Consulta consulta) {
        UsuarioPrincipal principal = Seguridad.principalRequerido();
        if (principal.esEncargada() && !consulta.getTienda().getId().equals(principal.tiendaId())) {
            throw new ConsultaInvalidaException("No tiene acceso a esa consulta");
        }
    }

    private void validarModificable(Consulta consulta) {
        if (esEstadoCerrado(consulta.getEstado())) {
            throw new ConsultaInvalidaException("No se puede modificar una consulta " + etiquetaEstado(consulta.getEstado()));
        }
        if (ventaRepository.existsByConsultaId(consulta.getId())) {
            var venta = ventaRepository.findByConsultaId(consulta.getId()).orElse(null);
            if (venta != null && venta.getEstado() == com.agrandaditostienda.entity.EstadoVenta.EN_PREPARACION) {
                throw new ConsultaInvalidaException("No se puede modificar una consulta mientras se arma la venta");
            }
        }
    }

    private boolean esEditable(Consulta consulta) {
        if (esEstadoCerrado(consulta.getEstado())) {
            return false;
        }
        var venta = ventaRepository.findByConsultaId(consulta.getId()).orElse(null);
        if (venta == null) {
            return true;
        }
        return venta.getEstado() == com.agrandaditostienda.entity.EstadoVenta.CONFIRMADA
            || venta.getEstado() == com.agrandaditostienda.entity.EstadoVenta.CANCELADA;
    }

    private String ventaAsociadaEstado(Consulta consulta) {
        return ventaRepository.findByConsultaId(consulta.getId())
                .map(v -> v.getEstado().name())
                .orElse(null);
    }

    private boolean esEstadoCerrado(EstadoConsulta estado) {
        return estado == EstadoConsulta.CONFIRMADA
                || estado == EstadoConsulta.CANCELADA
                || estado == EstadoConsulta.FINALIZADA;
    }

    private void guardarVersion(Consulta consulta, MotivoModificacion motivo, String empleado,
                                List<ConsultaVersionCambio> cambios) {
        ConsultaVersion version = new ConsultaVersion();
        version.setConsulta(consulta);
        version.setVersion(consulta.getVersion());
        version.setEstado(consulta.getEstado());
        version.setObservaciones(consulta.getObservaciones());
        version.setMotivo(motivo);
        version.setEmpleado(empleado);
        version.setFecha(Instant.now());
        for (ProductoConsultado pc : consulta.getProductosConsultados()) {
            version.agregarItem(new ConsultaVersionItem(
                    pc.getProducto().getId(),
                    pc.getProducto().getNombre(),
                    pc.getProducto().getImagen(),
                    pc.getTalle(),
                    pc.getColor(),
                    pc.getCantidad(),
                    pc.getPrecioUnitario(),
                    pc.getObservaciones()));
        }
        for (ConsultaVersionCambio cambio : cambios) {
            version.agregarCambio(cambio);
        }
        consultaVersionRepository.save(version);
    }

    private void agregarProductos(Consulta consulta, List<CrearConsultaRequest.ItemConsultaRequest> items) {
        for (CrearConsultaRequest.ItemConsultaRequest item : items) {
            Producto producto = productoRepository.findById(item.productoId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado: " + item.productoId()));
            if (!producto.getTienda().getId().equals(consulta.getTienda().getId())) {
                throw new ConsultaInvalidaException(
                        "El producto '" + producto.getNombre() + "' no pertenece a la sucursal " + consulta.getTienda().getNombre());
            }
            String color = colorLimpio(item.color());
            varianteProductoRepository.findByProductoIdAndColorAndTalle(producto.getId(), color, item.talle().trim())
                    .orElseThrow(() -> new ConsultaInvalidaException(
                            "Variante no disponible: " + producto.getNombre()
                                    + " (" + (color == null ? "sin color" : color) + ", " + item.talle() + ")"));

            consulta.agregarProductoConsultado(new ProductoConsultado(
                    producto,
                    item.talle().trim(),
                    color,
                    item.cantidad(),
                    observacionLimpia(item.observaciones()),
                    producto.getPrecio()));
        }
    }

    private List<ConsultaVersionCambio> calcularCambios(List<LineaItem> anteriores, List<LineaItem> nuevos) {
        List<ConsultaVersionCambio> cambios = new ArrayList<>();
        for (LineaItem anterior : anteriores) {
            LineaItem igual = coincidenciaExacta(nuevos, anterior);
            if (igual != null) {
                if (igual.cantidad() != anterior.cantidad()) {
                    cambios.add(new ConsultaVersionCambio(TipoCambio.CAMBIO_CANTIDAD,
                            "Cantidad de «" + etiquetaLinea(igual) + "»: " + anterior.cantidad() + " → " + igual.cantidad()));
                }
                if (!Objects.equals(igual.observaciones(), anterior.observaciones())) {
                    cambios.add(new ConsultaVersionCambio(TipoCambio.CAMBIO_OBSERVACIONES,
                            "Se modificó la nota del producto «" + igual.productoNombre() + "»"));
                }
                continue;
            }
            LineaItem mismoProductoMismoColor = coincidenciaPorProductoYColor(nuevos, anterior);
            LineaItem mismoProductoMismoTalle = coincidenciaPorProductoYTalle(nuevos, anterior);
            if (mismoProductoMismoColor != null && mismoProductoMismoTalle == null) {
                cambios.add(new ConsultaVersionCambio(TipoCambio.CAMBIO_TALLE,
                        "«" + anterior.productoNombre() + "» pasó del talle " + anterior.talle()
                                + " al talle " + mismoProductoMismoColor.talle()));
            } else if (mismoProductoMismoTalle != null && mismoProductoMismoColor == null) {
                cambios.add(new ConsultaVersionCambio(TipoCambio.CAMBIO_COLOR,
                        "«" + anterior.productoNombre() + "» pasó de color " + colorTexto(anterior.color())
                                + " a color " + colorTexto(mismoProductoMismoTalle.color())));
            } else if (mismoProductoMismoColor != null && mismoProductoMismoTalle != null) {
                cambios.add(new ConsultaVersionCambio(TipoCambio.CAMBIO_TALLE,
                        "«" + anterior.productoNombre() + "» cambió de variante: ("
                                + colorTexto(anterior.color()) + ", talle " + anterior.talle() + ") → ("
                                + colorTexto(mismoProductoMismoColor.color()) + ", talle " + mismoProductoMismoColor.talle() + ")"));
            } else {
                cambios.add(new ConsultaVersionCambio(TipoCambio.PRODUCTO_QUITADO,
                        "Se quitó «" + anterior.productoNombre() + "» ("
                                + colorTexto(anterior.color()) + ", talle " + anterior.talle() + ")"));
            }
        }
        for (LineaItem nuevo : nuevos) {
            if (coincidenciaExacta(anteriores, nuevo) == null && coincidenciaPorProducto(anteriores, nuevo) == null) {
                cambios.add(new ConsultaVersionCambio(TipoCambio.PRODUCTO_AGREGADO,
                        "Se agregó «" + nuevo.productoNombre() + "» ("
                                + colorTexto(nuevo.color()) + ", talle " + nuevo.talle() + ") × " + nuevo.cantidad()));
            }
        }
        return cambios;
    }

    private LineaItem coincidenciaExacta(List<LineaItem> lineas, LineaItem buscada) {
        return lineas.stream()
                .filter(l -> l.productoId().equals(buscada.productoId())
                        && Objects.equals(l.talle(), buscada.talle())
                        && Objects.equals(l.color(), buscada.color()))
                .findFirst()
                .orElse(null);
    }

    private LineaItem coincidenciaPorProducto(List<LineaItem> lineas, LineaItem buscada) {
        return lineas.stream()
                .filter(l -> l.productoId().equals(buscada.productoId()))
                .findFirst()
                .orElse(null);
    }

    private LineaItem coincidenciaPorProductoYColor(List<LineaItem> lineas, LineaItem buscada) {
        return lineas.stream()
                .filter(l -> l.productoId().equals(buscada.productoId()) && Objects.equals(l.color(), buscada.color()))
                .findFirst()
                .orElse(null);
    }

    private LineaItem coincidenciaPorProductoYTalle(List<LineaItem> lineas, LineaItem buscada) {
        return lineas.stream()
                .filter(l -> l.productoId().equals(buscada.productoId()) && Objects.equals(l.talle(), buscada.talle()))
                .findFirst()
                .orElse(null);
    }

    private LineaItem aLinea(ProductoConsultado pc) {
        return new LineaItem(
                pc.getProducto().getId(),
                pc.getProducto().getNombre(),
                pc.getProducto().getImagen(),
                pc.getTalle(),
                pc.getColor(),
                pc.getCantidad(),
                pc.getPrecioUnitario(),
                pc.getObservaciones());
    }

    private String etiquetaLinea(LineaItem linea) {
        return linea.productoNombre() + " (" + colorTexto(linea.color()) + ", talle " + linea.talle() + ")";
    }

    private String colorTexto(String color) {
        return color == null ? "sin color" : color;
    }

    private Cliente obtenerOCrearCliente(String nombre, String telefono) {
        String telefonoLimpio = telefono.trim();
        String nombreLimpio = nombreLimpio(nombre);
        return clienteRepository.findByTelefono(telefonoLimpio)
                .map(existente -> {
                    if (nombreLimpio != null) {
                        existente.setNombre(nombreLimpio);
                    }
                    return existente;
                })
                .orElseGet(() -> {
                    try {
                        return clienteRepository.save(new Cliente(nombreLimpio, telefonoLimpio));
                    } catch (DataIntegrityViolationException conflicto) {
                        return clienteRepository.findByTelefono(telefonoLimpio).orElseThrow();
                    }
                });
    }

    private Map<Long, Integer> contarItems(List<Consulta> consultas) {
        List<Long> ids = consultas.stream().map(Consulta::getId).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Long, Integer> resultado = new LinkedHashMap<>();
        for (Object[] fila : consultaRepository.contarItems(ids)) {
            resultado.put(((Number) fila[0]).longValue(), ((Number) fila[1]).intValue());
        }
        return resultado;
    }

    private Map<Long, List<VarianteProducto>> variantesDe(List<ProductoConsultado> items) {
        List<Long> ids = items.stream()
                .map(pc -> pc.getProducto().getId())
                .distinct()
                .toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Long, List<VarianteProducto>> mapa = new LinkedHashMap<>();
        for (VarianteProducto variante : varianteProductoRepository
                .findByProductoIdInAndActivoTrueOrderByColorAscTalleAsc(ids)) {
            mapa.computeIfAbsent(variante.getProducto().getId(), k -> new java.util.ArrayList<>()).add(variante);
        }
        return mapa;
    }

    private String construirMensaje(Consulta consulta) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hola ").append(consulta.getTienda().getNombre()).append("!");
        sb.append("\nSoy ")
                .append(consulta.getCliente().getNombre() == null ? "un cliente" : consulta.getCliente().getNombre())
                .append(" (tel. ").append(consulta.getCliente().getTelefono()).append(").");
        sb.append("\nMi consulta es la N° ").append(consultaMapper.formatearNumeroConVersion(consulta.getNumero(), consulta.getVersion()))
                .append(" (").append(etiquetaEstado(consulta.getEstado())).append(").\n\n");
        int indice = 1;
        for (ProductoConsultado pc : consulta.getProductosConsultados()) {
            sb.append(indice++).append(". ").append(pc.getProducto().getNombre());
            sb.append(" | Talle ").append(pc.getTalle());
            if (pc.getColor() != null) {
                sb.append(" | Color ").append(pc.getColor());
            }
            sb.append(" | Cant. ").append(pc.getCantidad());
            if (pc.getObservaciones() != null) {
                sb.append(" | ").append(pc.getObservaciones());
            }
            sb.append("\n");
        }
        if (consulta.getObservaciones() != null) {
            sb.append("\nNota: ").append(consulta.getObservaciones());
        }
        return sb.toString().trim();
    }

    private String etiquetaEstado(EstadoConsulta estado) {
        return switch (estado) {
            case PENDIENTE -> "pendiente";
            case EN_REVISION -> "en revisión";
            case ESPERANDO_CLIENTE -> "esperando respuesta del cliente";
            case CONFIRMADA -> "confirmada";
            case CANCELADA -> "cancelada";
            case FINALIZADA -> "finalizada";
        };
    }

    private String nombreLimpio(String nombre) {
        return (nombre == null || nombre.isBlank()) ? null : nombre.trim();
    }

    private String observacionLimpia(String observacion) {
        return (observacion == null || observacion.isBlank()) ? null : observacion.trim();
    }

    private String colorLimpio(String color) {
        return (color == null || color.isBlank()) ? null : color.trim();
    }

    private record LineaItem(Long productoId, String productoNombre, String productoImagen,
                             String talle, String color, int cantidad, BigDecimal precioUnitario,
                             String observaciones) {
    }
}
