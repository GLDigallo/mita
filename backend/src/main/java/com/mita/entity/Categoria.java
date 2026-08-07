package com.mita.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "categoria", indexes = {
        @Index(name = "idx_categoria_tienda", columnList = "tienda_id")
})
@Getter
@Setter
@NoArgsConstructor
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(nullable = false, length = 80)
    private String slug;

    @Column(nullable = false)
    private int orden;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

    @Column(nullable = false, updatable = false)
    private Instant creadaEn;

    @Column(nullable = false)
    private Instant actualizadaEn;

    public Categoria(String nombre, String slug, int orden, Tienda tienda) {
        this.nombre = nombre;
        this.slug = slug;
        this.orden = orden;
        this.tienda = tienda;
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
