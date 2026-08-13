package com.agrandaditostienda.service;

import com.agrandaditostienda.dto.ActualizarItemsVentaRequest;
import com.agrandaditostienda.dto.ConfirmarVentaRequest;
import com.agrandaditostienda.dto.VentaDTO;
import com.agrandaditostienda.dto.VentaResumenDTO;
import com.agrandaditostienda.entity.Consulta;
import com.agrandaditostienda.entity.EstadoConsulta;
import com.agrandaditostienda.entity.EstadoVenta;
import com.agrandaditostienda.entity.Producto;
import com.agrandaditostienda.entity.ProductoConsultado;
import com.agrandaditostienda.entity.VarianteProducto;
import com.agrandaditostienda.entity.Venta;
import com.agrandaditostienda.entity.VentaItem;
import com.agrandaditostienda.exception.RecursoNoEncontradoException;
import com.agrandaditostienda.exception.VentaInvalidaException;
import org.springframework.dao.DataIntegrityViolationException;
import com.agrandaditostienda.mapper.ConsultaMapper;
import com.agrandaditostienda.mapper.VentaMapper;
import com.agrandaditostienda.repository.ConsultaRepository;
import com.agrandaditostienda.repository.ProductoRepository;
import com.agrandaditostienda.repository.VarianteProductoRepository;
import com.agrandaditostienda.repository.VentaRepository;
import com.agrandaditostienda.security.Seguridad;
import com.agrandaditostienda.security.UsuarioPrincipal;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class VentaService {

    private final VentaRepository ventaRepository;
    private final ConsultaRepository consultaRepository;
    private final ProductoRepository productoRepository;
    private final VarianteProductoRepository varianteProductoRepository;
    private final VentaMapper ventaMapper;
    private final ConsultaMapper consultaMapper;
    private final EntityManager entityManager;

    public VentaService(VentaRepository ventaRepository,
                        ConsultaRepository consultaRepository,
                        ProductoRepository productoRepository,
                        VarianteProductoRepository varianteProductoRepository,
                        VentaMapper ventaMapper,
                        ConsultaMapper consultaMapper,
                        EntityManager entityManager) {
        this.ventaRepository = ventaRepository;
        this.consultaRepository = consultaRepository;
        this.productoRepository = productoRepository;
        this.varianteProductoRepository = varianteProductoRepository;
        this.ventaMapper = ventaMapper;
        this.consultaMapper = consultaMapper;
        this.entityManager = entityManager;
    }

    @Transactional
    public VentaDTO crearDesdeConsulta(Long consultaId, String empleado) {
        Consulta consulta = consultaRepository.findDetalle(consultaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Consulta no encontrada: " + consultaId));
        verificarAcceso(consulta);
        if (consulta.getEstado() == EstadoConsulta.CANCELADA || consulta.getEstado() == EstadoConsulta.FINALIZADA) {
            throw new VentaInvalidaException(
                    "No se puede generar una venta de una consulta " + etiquetaEstado(consulta.getEstado()));
        }
        Venta existente = ventaRepository.findByConsultaId(consultaId).orElse(null);
        if (existente != null) {
            if (existente.getEstado() != EstadoVenta.EN_PREPARACION) {
                throw new VentaInvalidaException(
                        "La consulta ya tiene una venta asociada (" + etiquetaEstado(existente.getEstado()) + ")");
            }
            return ventaMapper.toDTO(existente);
        }

        Venta venta = new Venta();
        venta.setNumero(ventaRepository.siguienteNumero());
        venta.setConsulta(consulta);
        venta.setTienda(consulta.getTienda());
        venta.setCliente(consulta.getCliente());
        venta.setEmpleado(empleado);

        for (ProductoConsultado pc : consulta.getProductosConsultados()) {
            VarianteProducto variante = varianteProductoRepository
                    .findByProductoIdAndColorAndTalle(pc.getProducto().getId(), pc.getColor(), pc.getTalle())
                    .orElseThrow(() -> new VentaInvalidaException(
                            "Variante no disponible para: " + pc.getProducto().getNombre()
                                    + " (" + (pc.getColor() == null ? "sin color" : pc.getColor()) + ", talle " + pc.getTalle() + ")"));
            venta.agregarItem(new VentaItem(
                    pc.getProducto(),
                    variante,
                    pc.getTalle(),
                    pc.getColor(),
                    pc.getCantidad(),
                    pc.getPrecioUnitario()));
        }

        try {
            Venta guardada = ventaRepository.saveAndFlush(venta);
            return ventaMapper.toDTO(ventaRepository.findDetalle(guardada.getId()).orElseThrow());
        } catch (DataIntegrityViolationException conflicto) {
            Venta ganadora = ventaRepository.findByConsultaId(consultaId).orElseThrow();
            if (ganadora.getEstado() != EstadoVenta.EN_PREPARACION) {
                throw new VentaInvalidaException(
                        "La consulta ya tiene una venta asociada (" + etiquetaEstado(ganadora.getEstado()) + ")");
            }
            return ventaMapper.toDTO(ganadora);
        }
    }

    @Transactional
    public VentaDTO actualizarItems(Long ventaId, ActualizarItemsVentaRequest request, String empleado) {
        Venta venta = ventaRepository.findDetalle(ventaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Venta no encontrada: " + ventaId));
        verificarAcceso(venta);
        if (venta.getEstado() != EstadoVenta.EN_PREPARACION) {
            throw new VentaInvalidaException("Solo se pueden modificar los productos de una venta en preparación");
        }

        venta.getItems().clear();
        for (ActualizarItemsVentaRequest.ItemVentaRequest item : request.items()) {
            Producto producto = productoRepository.findById(item.productoId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado: " + item.productoId()));
            VarianteProducto variante = varianteProductoRepository.findById(item.varianteId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Variante no encontrada: " + item.varianteId()));
            if (!variante.getProducto().getId().equals(producto.getId())) {
                throw new VentaInvalidaException(
                        "La variante seleccionada no corresponde al producto '" + producto.getNombre() + "'");
            }
            if (!producto.getTienda().getId().equals(venta.getTienda().getId())) {
                throw new VentaInvalidaException(
                        "El producto '" + producto.getNombre() + "' no pertenece a la sucursal " + venta.getTienda().getNombre());
            }
            if (!variante.isActivo()) {
                throw new VentaInvalidaException(
                        "La variante no está activa: " + producto.getNombre() + " (" + variante.getColor() + ", talle " + variante.getTalle() + ")");
            }
            if (item.cantidad() > variante.getStock()) {
                throw new VentaInvalidaException(
                        "Stock insuficiente para " + producto.getNombre()
                                + " (" + variante.getColor() + ", talle " + variante.getTalle()
                                + "): hay " + variante.getStock() + " unidades");
            }
            venta.agregarItem(new VentaItem(
                    producto,
                    variante,
                    variante.getTalle(),
                    variante.getColor(),
                    item.cantidad(),
                    producto.getPrecio()));
        }

        venta.setEmpleado(empleado);
        Venta guardada = ventaRepository.save(venta);
        return ventaMapper.toDTO(ventaRepository.findDetalle(guardada.getId()).orElseThrow());
    }

    @Transactional
    public VentaDTO confirmar(Long ventaId, ConfirmarVentaRequest request, String empleado) {
        Venta venta = ventaRepository.findDetalle(ventaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Venta no encontrada: " + ventaId));
        verificarAcceso(venta);
        if (venta.getEstado() != EstadoVenta.EN_PREPARACION) {
            throw new VentaInvalidaException("Solo se puede confirmar una venta en preparación");
        }
        if (venta.getItems().isEmpty()) {
            throw new VentaInvalidaException("La venta no tiene productos");
        }

        BigDecimal importe = venta.getItems().stream()
                .map(i -> i.getPrecioUnitario().multiply(BigDecimal.valueOf(i.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        venta.setEstado(EstadoVenta.CONFIRMADA);
        venta.setFechaVenta(Instant.now());
        venta.setMetodoPago(request.metodoPago());
        venta.setImporteTotal(importe);
        venta.setEmpleado(empleado);
        ventaRepository.saveAndFlush(venta);

        for (VentaItem item : venta.getItems()) {
            int descontados = varianteProductoRepository
                    .descontarStock(item.getVariante().getId(), item.getCantidad(), Instant.now());
            if (descontados == 0) {
                throw new VentaInvalidaException(
                        "Stock insuficiente para " + item.getProducto().getNombre()
                                + " (" + (item.getColor() == null ? "sin color" : item.getColor())
                                + ", talle " + item.getTalle() + ")");
            }
        }

        Consulta consulta = venta.getConsulta();
        consulta.setEstado(EstadoConsulta.CONFIRMADA);
        consultaRepository.save(consulta);

        refrescarStock(venta);
        return ventaMapper.toDTO(ventaRepository.findDetalle(venta.getId()).orElseThrow());
    }

    @Transactional
    public VentaDTO entregar(Long ventaId, String empleado) {
        Venta venta = ventaRepository.findDetalle(ventaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Venta no encontrada: " + ventaId));
        verificarAcceso(venta);
        if (venta.getEstado() != EstadoVenta.CONFIRMADA) {
            throw new VentaInvalidaException("Solo se puede entregar una venta confirmada");
        }
        venta.setEstado(EstadoVenta.ENTREGADA);
        venta.setEmpleado(empleado);
        ventaRepository.save(venta);

        Consulta consulta = venta.getConsulta();
        consulta.setEstado(EstadoConsulta.FINALIZADA);
        consultaRepository.save(consulta);

        return ventaMapper.toDTO(ventaRepository.findDetalle(venta.getId()).orElseThrow());
    }

    @Transactional
    public VentaDTO cancelar(Long ventaId, String empleado) {
        Venta venta = ventaRepository.findDetalle(ventaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Venta no encontrada: " + ventaId));
        verificarAcceso(venta);
        if (venta.getEstado() == EstadoVenta.CANCELADA) {
            throw new VentaInvalidaException("La venta ya está cancelada");
        }
        if (venta.getEstado() == EstadoVenta.ENTREGADA) {
            throw new VentaInvalidaException("Una venta entregada no se puede cancelar");
        }
        if (venta.getEstado() == EstadoVenta.CONFIRMADA) {
            for (VentaItem item : venta.getItems()) {
                varianteProductoRepository.reponerStock(item.getVariante().getId(), item.getCantidad(), Instant.now());
            }
            refrescarStock(venta);
        }
        venta.setEstado(EstadoVenta.CANCELADA);
        venta.setEmpleado(empleado);
        ventaRepository.save(venta);

        Consulta consulta = venta.getConsulta();
        consulta.setEstado(EstadoConsulta.CANCELADA);
        consultaRepository.save(consulta);

        return ventaMapper.toDTO(ventaRepository.findDetalle(venta.getId()).orElseThrow());
    }

    @Transactional(readOnly = true)
    public List<VentaResumenDTO> listar(EstadoVenta estado, Long tiendaId, String busqueda) {
        String termino = (busqueda == null || busqueda.isBlank()) ? null
                : "%" + busqueda.trim().toLowerCase() + "%";
        List<Venta> ventas = ventaRepository.buscar(estado, tiendaIdPermitida(tiendaId), termino);
        Map<Long, Integer> itemsPorVenta = contarItems(ventas);
        return ventas.stream()
                .map(v -> new VentaResumenDTO(
                        v.getId(),
                        ventaMapper.formatearNumero(v.getNumero()),
                        v.getEstado(),
                        v.getFechaVenta(),
                        v.getEmpleado(),
                        v.getTienda().getNombre(),
                        v.getCliente().getNombre(),
                        v.getCliente().getTelefono(),
                        consultaNumero(v.getConsulta()),
                        v.getImporteTotal(),
                        itemsPorVenta.getOrDefault(v.getId(), 0)))
                .toList();
    }

    @Transactional(readOnly = true)
    public VentaDTO obtener(Long id) {
        Venta venta = ventaRepository.findDetalle(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Venta no encontrada: " + id));
        verificarAcceso(venta);
        return ventaMapper.toDTO(venta);
    }

    @Transactional(readOnly = true)
    public VentaDTO obtenerPorConsulta(Long consultaId) {
        Venta venta = ventaRepository.findByConsultaId(consultaId)
                .orElseThrow(() -> new RecursoNoEncontradoException("La consulta no tiene una venta asociada"));
        verificarAcceso(venta);
        return ventaMapper.toDTO(venta);
    }

    private Long tiendaIdPermitida(Long tiendaId) {
        UsuarioPrincipal principal = Seguridad.principalRequerido();
        if (principal.esEncargada()) {
            if (tiendaId != null && !tiendaId.equals(principal.tiendaId())) {
                throw new VentaInvalidaException("No tiene acceso a esa tienda");
            }
            return principal.tiendaId();
        }
        return tiendaId;
    }

    private void verificarAcceso(Venta venta) {
        verificarAcceso(venta.getConsulta());
    }

    private void verificarAcceso(Consulta consulta) {
        UsuarioPrincipal principal = Seguridad.principalRequerido();
        if (principal.esEncargada() && !consulta.getTienda().getId().equals(principal.tiendaId())) {
            throw new VentaInvalidaException("No tiene acceso a esa venta");
        }
    }

    private Map<Long, Integer> contarItems(List<Venta> ventas) {
        List<Long> ids = ventas.stream().map(Venta::getId).toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Long, Integer> resultado = new LinkedHashMap<>();
        for (Object[] fila : ventaRepository.contarItems(ids)) {
            resultado.put(((Number) fila[0]).longValue(), ((Number) fila[1]).intValue());
        }
        return resultado;
    }

    private void refrescarStock(Venta venta) {
        entityManager.flush();
        for (VentaItem item : venta.getItems()) {
            entityManager.refresh(item.getVariante());
        }
    }

    private String consultaNumero(Consulta consulta) {
        return consulta == null ? null
                : consultaMapper.formatearNumeroConVersion(consulta.getNumero(), consulta.getVersion());
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

    private String etiquetaEstado(EstadoVenta estado) {
        return switch (estado) {
            case EN_PREPARACION -> "en preparación";
            case CONFIRMADA -> "confirmada";
            case ENTREGADA -> "entregada";
            case CANCELADA -> "cancelada";
        };
    }
}
