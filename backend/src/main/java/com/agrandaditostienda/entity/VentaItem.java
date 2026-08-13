package com.agrandaditostienda.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "venta_item", indexes = {
        @Index(name = "idx_venta_item_venta", columnList = "venta_id"),
        @Index(name = "idx_venta_item_producto", columnList = "producto_id"),
        @Index(name = "idx_venta_item_variante", columnList = "variante_id")
})
@Getter
@Setter
@NoArgsConstructor
public class VentaItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "venta_id", nullable = false)
    private Venta venta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "variante_id", nullable = false)
    private VarianteProducto variante;

    @Column(nullable = false, length = 20)
    private String talle;

    @Column(length = 40)
    private String color;

    @Column(nullable = false)
    private int cantidad = 1;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Column(nullable = false, updatable = false)
    private Instant creadoEn;

    @Column(nullable = false)
    private Instant actualizadaEn;

    public VentaItem(Producto producto, VarianteProducto variante, String talle, String color,
                     int cantidad, BigDecimal precioUnitario) {
        this.producto = producto;
        this.variante = variante;
        this.talle = talle;
        this.color = color;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        this.creadoEn = now;
        this.actualizadaEn = now;
    }

    @PreUpdate
    void preUpdate() {
        this.actualizadaEn = Instant.now();
    }
}
