package com.mita.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "venta", indexes = {
        @Index(name = "idx_venta_numero", columnList = "numero", unique = true),
        @Index(name = "idx_venta_consulta", columnList = "consulta_id"),
        @Index(name = "idx_venta_tienda", columnList = "tienda_id"),
        @Index(name = "idx_venta_cliente", columnList = "cliente_id"),
        @Index(name = "idx_venta_estado", columnList = "estado"),
        @Index(name = "idx_venta_fecha", columnList = "fecha_venta")
})
@Getter
@Setter
@NoArgsConstructor
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, updatable = false)
    private Long numero;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoVenta estado = EstadoVenta.EN_PREPARACION;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consulta_id", nullable = false)
    private Consulta consulta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(nullable = false, length = 80)
    private String empleado;

    @Column
    private Instant fechaVenta;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private MetodoPago metodoPago;

    @Column(precision = 12, scale = 2)
    private BigDecimal importeTotal;

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<VentaItem> items = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant creadaEn;

    @Column(nullable = false)
    private Instant actualizadaEn;

    public void agregarItem(VentaItem item) {
        items.add(item);
        item.setVenta(this);
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
