package com.mita.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "consulta_version_item", indexes = {
        @Index(name = "idx_cvi_version", columnList = "version_id")
})
@Getter
@Setter
@NoArgsConstructor
public class ConsultaVersionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "version_id", nullable = false)
    private ConsultaVersion version;

    @Column(nullable = false)
    private Long productoId;

    @Column(nullable = false, length = 120)
    private String productoNombre;

    @Column(length = 500)
    private String productoImagen;

    @Column(nullable = false, length = 20)
    private String talle;

    @Column(length = 40)
    private String color;

    @Column(nullable = false)
    private int cantidad;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Column(length = 500)
    private String observaciones;

    public ConsultaVersionItem(Long productoId, String productoNombre, String productoImagen,
                               String talle, String color, int cantidad, BigDecimal precioUnitario,
                               String observaciones) {
        this.productoId = productoId;
        this.productoNombre = productoNombre;
        this.productoImagen = productoImagen;
        this.talle = talle;
        this.color = color;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.observaciones = observaciones;
    }
}
