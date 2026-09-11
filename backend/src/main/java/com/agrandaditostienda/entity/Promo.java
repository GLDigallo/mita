package com.agrandaditostienda.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "promo", indexes = {
        @Index(name = "idx_promo_vigencia", columnList = "activa, fecha_fin"),
        @Index(name = "idx_promo_producto", columnList = "producto_id"),
        @Index(name = "idx_promo_tienda", columnList = "tienda_slug")
})
@Getter
@Setter
@NoArgsConstructor
public class Promo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String titulo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoPromo tipo;

    @Column(precision = 10, scale = 2)
    private BigDecimal valor;

    // null = vale para todas las tiendas (solo el dueño)
    @Column(length = 80)
    private String tiendaSlug;

    // null = promo por tienda; si viene, es una promo sobre un producto puntual
    @Column
    private Long productoId;

    @Column(nullable = false)
    private Instant fechaInicio;

    @Column(nullable = false)
    private Instant fechaFin;

    @Column(nullable = false)
    private boolean activa = true;

    @Column(nullable = false, updatable = false)
    private Instant creadaEn;

    @PrePersist
    void prePersist() {
        this.creadaEn = Instant.now();
    }

    public Promo(String titulo, TipoPromo tipo, BigDecimal valor, String tiendaSlug,
                 Long productoId, Instant fechaInicio, Instant fechaFin) {
        this.titulo = titulo;
        this.tipo = tipo;
        this.valor = valor;
        this.tiendaSlug = tiendaSlug;
        this.productoId = productoId;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
    }

    public boolean esDeProducto() {
        return productoId != null;
    }

    public boolean esPorcentaje() {
        return tipo == TipoPromo.PORCENTAJE;
    }

    public boolean esMonto() {
        return tipo == TipoPromo.MONTO;
    }

    public boolean esDePrecio() {
        return esPorcentaje() || esMonto();
    }
}