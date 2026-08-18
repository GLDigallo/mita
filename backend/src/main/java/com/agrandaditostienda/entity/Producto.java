package com.agrandaditostienda.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "producto", indexes = {
        @Index(name = "idx_producto_tienda", columnList = "tienda_id"),
        @Index(name = "idx_producto_categoria", columnList = "categoria_id")
})
@Getter
@Setter
@NoArgsConstructor
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(length = 500)
    private String descripcion;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;

    @Column(nullable = false, length = 500)
    private String imagen;

    @Column(nullable = false, length = 60)
    private String talles;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Genero genero;

    @Column(nullable = false)
    private boolean destacado = false;

    @Column(nullable = false)
    private boolean activo = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "categoria_id", nullable = true)
    private Categoria categoria;

    @Column(nullable = false, updatable = false)
    private Instant creadoEn;

    @Column(nullable = false)
    private Instant actualizadaEn;

    public Producto(String nombre, String descripcion, BigDecimal precio, String imagen,
                    String talles, Genero genero, boolean destacado, Tienda tienda, Categoria categoria) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.imagen = imagen;
        this.talles = talles;
        this.genero = genero;
        this.destacado = destacado;
        this.tienda = tienda;
        this.categoria = categoria;
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
