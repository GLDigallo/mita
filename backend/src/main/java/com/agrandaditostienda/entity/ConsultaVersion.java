package com.agrandaditostienda.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "consulta_version", indexes = {
        @Index(name = "idx_cv_consulta", columnList = "consulta_id"),
        @Index(name = "uk_cv_consulta_version", columnList = "consulta_id, version", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
public class ConsultaVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "consulta_id", nullable = false)
    private Consulta consulta;

    @Column(nullable = false)
    private int version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoConsulta estado;

    @Column(length = 1000)
    private String observaciones;

    @Enumerated(EnumType.STRING)
    @Column(length = 40)
    private MotivoModificacion motivo;

    @Column(length = 80)
    private String empleado;

    @Column(nullable = false, updatable = false)
    private Instant fecha;

    @OneToMany(mappedBy = "version", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderColumn(name = "posicion")
    private List<ConsultaVersionItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "version", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderColumn(name = "posicion")
    private List<ConsultaVersionCambio> cambios = new ArrayList<>();

    public void agregarItem(ConsultaVersionItem item) {
        items.add(item);
        item.setVersion(this);
    }

    public void agregarCambio(ConsultaVersionCambio cambio) {
        cambios.add(cambio);
        cambio.setVersion(this);
    }
}
