package com.agrandaditostienda.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "tienda", indexes = {
        @Index(name = "idx_tienda_slug", columnList = "slug", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
public class Tienda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(nullable = false, length = 80)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RangoEdad rangoEdad;

    @Column(nullable = false, length = 40)
    private String etiquetaEdad;

    @Column(length = 400)
    private String descripcion;

    @Column(nullable = false, length = 20)
    private String colorPrimario;

    @Column(nullable = false, length = 20)
    private String colorSecundario;

    @Column(length = 500)
    private String imagenHero;

    @Column(length = 20)
    private String whatsapp;

    @Column(nullable = false)
    private int orden;

    @Column(nullable = false)
    private boolean activa = true;

    @Column(nullable = false, updatable = false)
    private Instant creadaEn;

    @Column(nullable = false)
    private Instant actualizadaEn;

    public Tienda(String nombre, String slug, RangoEdad rangoEdad, String etiquetaEdad,
                  String descripcion, String colorPrimario, String colorSecundario,
                  String imagenHero, String whatsapp, int orden) {
        this.nombre = nombre;
        this.slug = slug;
        this.rangoEdad = rangoEdad;
        this.etiquetaEdad = etiquetaEdad;
        this.descripcion = descripcion;
        this.colorPrimario = colorPrimario;
        this.colorSecundario = colorSecundario;
        this.imagenHero = imagenHero;
        this.whatsapp = whatsapp;
        this.orden = orden;
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
