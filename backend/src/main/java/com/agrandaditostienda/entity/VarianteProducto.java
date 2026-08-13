package com.agrandaditostienda.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "variante_producto", indexes = {
        @Index(name = "idx_variante_producto", columnList = "producto_id"),
        @Index(name = "uq_variante_color_talle", columnList = "producto_id, color, talle", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
public class VarianteProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false, length = 40)
    private String color;

    @Column(nullable = false, length = 20)
    private String talle;

    @Column(nullable = false)
    private int stock = 0;

    @Column(nullable = false)
    private boolean activo = true;

    @Column(nullable = false, updatable = false)
    private Instant creadaEn;

    @Column(nullable = false)
    private Instant actualizadaEn;

    public VarianteProducto(Producto producto, String color, String talle, int stock) {
        this.producto = producto;
        this.color = color;
        this.talle = talle;
        this.stock = stock;
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        this.creadaEn = now;
        this.actualizadaEn = now;
    }

    @PreUpdate
    void preUpdate() {
        this.actualizadaEn = Instant.now();
    }
}
