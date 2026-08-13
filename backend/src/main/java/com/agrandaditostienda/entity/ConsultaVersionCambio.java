package com.agrandaditostienda.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "consulta_version_cambio", indexes = {
        @Index(name = "idx_cvc_version", columnList = "version_id")
})
@Getter
@Setter
@NoArgsConstructor
public class ConsultaVersionCambio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "version_id", nullable = false)
    private ConsultaVersion version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoCambio tipo;

    @Column(nullable = false, length = 500)
    private String descripcion;

    public ConsultaVersionCambio(TipoCambio tipo, String descripcion) {
        this.tipo = tipo;
        this.descripcion = descripcion;
    }
}
