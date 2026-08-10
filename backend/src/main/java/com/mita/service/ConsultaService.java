package com.mita.service;

import com.mita.dto.ConsultaCreadaDTO;
import com.mita.dto.ConsultaDTO;
import com.mita.dto.ConsultaResumenDTO;
import com.mita.dto.CrearConsultaRequest;
import com.mita.entity.Cliente;
import com.mita.entity.Consulta;
import com.mita.entity.EstadoConsulta;
import com.mita.entity.Producto;
import com.mita.entity.ProductoConsultado;
import com.mita.entity.Tienda;
import com.mita.entity.VarianteProducto;
import com.mita.exception.ConsultaInvalidaException;
import com.mita.exception.RecursoNoEncontradoException;
import com.mita.mapper.ConsultaMapper;
import com.mita.security.Seguridad;
import com.mita.security.UsuarioPrincipal;
import com.mita.repository.ClienteRepository;
import com.mita.repository.ConsultaRepository;
import com.mita.repository.ProductoRepository;
import com.mita.repository.VarianteProductoRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ConsultaService {

    private final ConsultaRepository consultaRepository;
    private final ClienteRepository clienteRepository;
    private final ProductoRepository productoRepository;
    private final VarianteProductoRepository varianteProductoRepository;
    private final TiendaService tiendaService;
    private final ConsultaMapper consultaMapper;

    public ConsultaService(ConsultaRepository consultaRepository,
                           ClienteRepository clienteRepository,
                           ProductoRepository productoRepository,
                           VarianteProductoRepository varianteProductoRepository,
                           TiendaService tiendaService,
                           ConsultaMapper consultaMapper) {
        this.consultaRepository = consultaRepository;
        this.clienteRepository = clienteRepository;
        this.productoRepository = productoRepository;
        this.varianteProductoRepository = varianteProductoRepository;
        this.tiendaService = tiendaService;
        this.consultaMapper = consultaMapper;
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

        for (CrearConsultaRequest.ItemConsultaRequest item : request.items()) {
            Producto producto = productoRepository.findById(item.productoId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado: " + item.productoId()));
            if (!producto.getTienda().getId().equals(tienda.getId())) {
                throw new ConsultaInvalidaException(
                        "El producto '" + producto.getNombre() + "' no pertenece a la sucursal " + tienda.getNombre());
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

        Consulta guardada = consultaRepository.save(consulta);
        ConsultaDTO dto = consultaMapper.toDTO(guardada, variantesDe(guardada.getProductosConsultados()));
        String mensaje = construirMensaje(guardada);
        String enlace = "https://wa.me/" + tienda.getWhatsapp() + "?text="
                + URLEncoder.encode(mensaje, StandardCharsets.UTF_8);
        return new ConsultaCreadaDTO(dto, mensaje, enlace);
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
                        consultaMapper.formatearNumero(c.getNumero()),
                        c.getEstado(),
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
        return consultaMapper.toDTO(consulta, variantesDe(consulta.getProductosConsultados()));
    }

    @Transactional
    public ConsultaDTO cambiarEstado(Long id, EstadoConsulta estado) {
        Consulta consulta = consultaRepository.findDetalle(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Consulta no encontrada: " + id));
        verificarAcceso(consulta);
        consulta.setEstado(estado);
        Consulta guardada = consultaRepository.save(consulta);
        return consultaMapper.toDTO(guardada, variantesDe(guardada.getProductosConsultados()));
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
        sb.append("\nMi consulta es la N° ").append(consultaMapper.formatearNumero(consulta.getNumero()))
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
}
