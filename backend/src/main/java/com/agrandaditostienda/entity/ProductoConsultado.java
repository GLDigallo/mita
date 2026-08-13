package com.agrandaditostienda.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "producto_consultado", indexes = {
        @Index(name = "idx_pc_consulta", columnList = "consulta_id"),
        @Index(name = "idx_pc_producto", columnList = "producto_id")
})
@Getter
@Setter
@NoArgsConstructor
public class ProductoConsultado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consulta_id", nullable = false)
    private Consulta consulta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false, length = 20)
    private String talle;

    @Column(length = 40)
    private String color;

    @Column(nullable = false)
    private int cantidad = 1;

    @Column(length = 500)
    private String observaciones;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Column(nullable = false, updatable = false)
    private Instant creadoEn;

    @Column(nullable = false)
    private Instant actualizadaEn;

    public ProductoConsultado(Producto producto, String talle, String color, int cantidad,
                              String observaciones, BigDecimal precioUnitario) {
        this.producto = producto;
        this.talle = talle;
        this.color = color;
        this.cantidad = cantidad;
        this.observaciones = observaciones;
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
