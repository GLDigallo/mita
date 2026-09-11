package com.agrandaditostienda.service;

import com.agrandaditostienda.dto.PromoAplicadaDTO;
import com.agrandaditostienda.dto.PromoDTO;
import com.agrandaditostienda.dto.PromoRequest;
import com.agrandaditostienda.entity.Producto;
import com.agrandaditostienda.entity.Promo;
import com.agrandaditostienda.entity.TipoPromo;
import com.agrandaditostienda.exception.ReglaNegocioException;
import com.agrandaditostienda.exception.RecursoNoEncontradoException;
import com.agrandaditostienda.repository.ProductoRepository;
import com.agrandaditostienda.repository.PromoRepository;
import com.agrandaditostienda.security.Seguridad;
import com.agrandaditostienda.security.UsuarioPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
@Service
public class PromoService {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");
    private static final int MAX_RESULTADOS_BUSQUEDA = 20;

    private final PromoRepository promoRepository;
    private final ProductoRepository productoRepository;

    @Transactional(readOnly = true)
    public List<PromoDTO> listar() {
        UsuarioPrincipal principal = Seguridad.principalRequerido();
        exigirDueno(principal);
        return promoRepository.findAll().stream()
                .sorted((a, b) -> b.getCreadaEn().compareTo(a.getCreadaEn()))
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public PromoDTO crear(PromoRequest request) {
        UsuarioPrincipal principal = Seguridad.principalRequerido();
        exigirDueno(principal);

        validarValor(request.tipo(), request.valor());
        if (request.productoId() != null) {
            productoRepository.findById(request.productoId())
                    .orElseThrow(() -> new RecursoNoEncontradoException("Producto no encontrado: " + request.productoId()));
        }

        Instant inicio = parseFecha(request.fechaInicio(), "fecha de inicio");
        Instant fin = parseFinDia(request.fechaFin());
        if (fin.isBefore(inicio)) {
            throw new ReglaNegocioException("La fecha de fin no puede ser anterior a la de inicio");
        }

        String tiendaSlug = (request.tiendaSlug() == null || request.tiendaSlug().isBlank())
                ? null
                : request.tiendaSlug().trim();
        Promo promo = new Promo(
                request.titulo().trim(),
                request.tipo(),
                request.valor(),
                tiendaSlug,
                request.productoId(),
                inicio,
                fin);
        return toDTO(promoRepository.save(promo));
    }

    @Transactional
    public PromoDTO alternarActiva(Long id, PromoRequest.ActivarRequest request) {
        UsuarioPrincipal principal = Seguridad.principalRequerido();
        exigirDueno(principal);
        Promo promo = buscar(id);
        promo.setActiva(request.activa());
        return toDTO(promoRepository.save(promo));
    }

    @Transactional
    public void eliminar(Long id) {
        UsuarioPrincipal principal = Seguridad.principalRequerido();
        exigirDueno(principal);
        Promo promo = buscar(id);
        promoRepository.delete(promo);
    }

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void desactivarVencidas() {
        Instant ahora = Instant.now();
        List<Promo> vencidas = promoRepository.findAllByActivaTrueAndFechaFinBefore(ahora);
        if (vencidas.isEmpty()) {
            return;
        }
        for (Promo promo : vencidas) {
            promo.setActiva(false);
        }
        promoRepository.saveAll(vencidas);
        log.info("{} promo(s) desactivadas automáticamente por vencer su fecha", vencidas.size());
    }

    @Transactional(readOnly = true)
    public List<Producto> buscarProductos(String termino, UsuarioPrincipal principal) {
        exigirDueno(principal);
        String texto = (termino == null || termino.isBlank()) ? null : termino.trim();
        if (texto == null) {
            return List.of();
        }
        return productoRepository.buscarPorNombre(null, texto).stream()
                .limit(MAX_RESULTADOS_BUSQUEDA)
                .toList();
    }

    public PromoAplicadaDTO aplicar(Producto producto) {
        return aplicar(List.of(producto)).get(producto.getId());
    }

    @Transactional(readOnly = true)
    public Map<Long, PromoAplicadaDTO> aplicar(List<Producto> productos) {
        Map<Long, PromoAplicadaDTO> resultado = new LinkedHashMap<>();
        if (productos.isEmpty()) {
            return resultado;
        }
        Instant ahora = Instant.now();
        List<Promo> vigentes = promoRepository.findAllByActivaTrue().stream()
                .filter(promo -> !ahora.isBefore(promo.getFechaInicio()) && !ahora.isAfter(promo.getFechaFin()))
                .toList();
        for (Producto producto : productos) {
            resultado.put(producto.getId(), resolverProducto(producto, vigentes));
        }
        return resultado;
    }

    public BigDecimal precioConPromo(Producto producto) {
        PromoAplicadaDTO aplicada = aplicar(producto);
        return aplicada != null && aplicada.precio() != null ? aplicada.precio() : producto.getPrecio();
    }

    private PromoAplicadaDTO resolverProducto(Producto producto, List<Promo> vigentes) {
        return vigentes.stream()
                .filter(promo -> aplicaA(promo, producto))
                .sorted((a, b) -> {
                    int porPrioridad = Integer.compare(prioridad(a), prioridad(b));
                    if (porPrioridad != 0) {
                        return porPrioridad;
                    }
                    return descuento(b, producto).compareTo(descuento(a, producto));
                })
                .findFirst()
                .map(promo -> toAplicada(promo, producto))
                .orElse(null);
    }

    private boolean aplicaA(Promo promo, Producto producto) {
        if (promo.esDeProducto()) {
            return promo.getProductoId().equals(producto.getId());
        }
        return promo.getTiendaSlug() == null || promo.getTiendaSlug().equals(producto.getTienda().getSlug());
    }

    private int prioridad(Promo promo) {
        if (promo.esDeProducto()) {
            return 0;
        }
        return promo.getTiendaSlug() == null ? 2 : 1;
    }

    private BigDecimal descuento(Promo promo, Producto producto) {
        if (!promo.esDePrecio() || promo.getValor() == null) {
            return BigDecimal.ZERO;
        }
        return producto.getPrecio().subtract(precioPromo(promo, producto.getPrecio()));
    }

    private PromoAplicadaDTO toAplicada(Promo promo, Producto producto) {
        BigDecimal precio = promo.esDePrecio() && promo.getValor() != null
                ? precioPromo(promo, producto.getPrecio())
                : null;
        return new PromoAplicadaDTO(precio, promo.getTitulo(), promo.getTipo(), etiqueta(promo), promo.getValor());
    }

    private BigDecimal precioPromo(Promo promo, BigDecimal base) {
        BigDecimal precio = switch (promo.getTipo()) {
            case PORCENTAJE -> base.multiply(BigDecimal.ONE.subtract(
                    promo.getValor().divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP)));
            case MONTO -> base.subtract(promo.getValor());
            default -> base;
        };
        return precio.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }

    private String etiqueta(Promo promo) {
        return switch (promo.getTipo()) {
            case PORCENTAJE -> promo.getValor().stripTrailingZeros().toPlainString() + "%";
            case MONTO -> "$" + promo.getValor().stripTrailingZeros().toPlainString();
            case DOS_POR_UNO -> "2x1";
            case ENVIO_GRATIS -> "Envío gratis";
        };
    }

    private void validarValor(TipoPromo tipo, BigDecimal valor) {
        if (tipo == TipoPromo.PORCENTAJE || tipo == TipoPromo.MONTO) {
            if (valor == null || valor.signum() <= 0) {
                throw new ReglaNegocioException("La promo de descuento necesita un valor mayor a cero");
            }
            if (tipo == TipoPromo.PORCENTAJE && valor.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new ReglaNegocioException("El porcentaje de descuento no puede superar el 100%");
            }
        }
    }

    private Instant parseFecha(String valor, String campo) {
        try {
            LocalDate fecha = LocalDate.parse(valor);
            return fecha.atStartOfDay(ZONA).toInstant();
        } catch (DateTimeParseException e) {
            throw new ReglaNegocioException("La " + campo + " debe tener formato aaaa-mm-dd");
        }
    }

    private Instant parseFinDia(String valor) {
        try {
            LocalDate fecha = LocalDate.parse(valor);
            return fecha.atTime(LocalTime.MAX).atZone(ZONA).toInstant();
        } catch (DateTimeParseException e) {
            throw new ReglaNegocioException("La fecha de fin debe tener formato aaaa-mm-dd");
        }
    }

    private Promo buscar(Long id) {
        return promoRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Promo no encontrada: " + id));
    }

    private void exigirDueno(UsuarioPrincipal principal) {
        if (principal.esEncargada()) {
            throw new ReglaNegocioException("Las promociones son exclusivas del dueño");
        }
    }

    private PromoDTO toDTO(Promo promo) {
        String productoNombre = null;
        String productoImagen = null;
        if (promo.esDeProducto()) {
            Producto producto = productoRepository.findById(promo.getProductoId()).orElse(null);
            if (producto != null) {
                productoNombre = producto.getNombre();
                productoImagen = producto.getImagen();
            }
        }
        return new PromoDTO(
                promo.getId(),
                promo.getTitulo(),
                promo.getTipo(),
                promo.getValor(),
                promo.getTiendaSlug(),
                promo.getProductoId(),
                productoNombre,
                productoImagen,
                promo.esDeProducto(),
                promo.getFechaInicio(),
                promo.getFechaFin(),
                promo.isActiva());
    }
}