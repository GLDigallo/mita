package com.mita.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "consulta", indexes = {
        @Index(name = "idx_consulta_numero", columnList = "numero", unique = true),
        @Index(name = "idx_consulta_cliente", columnList = "cliente_id"),
        @Index(name = "idx_consulta_tienda", columnList = "tienda_id"),
        @Index(name = "idx_consulta_estado", columnList = "estado")
})
@Getter
@Setter
@NoArgsConstructor
public class Consulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, updatable = false)
    private Long numero;

    @Column(nullable = false)
    private int version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoConsulta estado = EstadoConsulta.PENDIENTE;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

    @Column(nullable = false, updatable = false)
    private Instant fechaConsulta;

    @Column(length = 1000)
    private String observaciones;

    @OneToMany(mappedBy = "consulta", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ProductoConsultado> productosConsultados = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant creadaEn;

    @Column(nullable = false)
    private Instant actualizadaEn;

    public void agregarProductoConsultado(ProductoConsultado item) {
        productosConsultados.add(item);
        item.setConsulta(this);
    }

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        this.fechaConsulta = now;
        this.creadaEn = now;
        this.actualizadaEn = now;
    }

    @PreUpdate
    void preUpdate() {
        this.actualizadaEn = Instant.now();
    }
}
