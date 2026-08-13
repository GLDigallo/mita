package com.agrandaditostienda.entity;

public enum MotivoModificacion {
    CAMBIO_TALLE("Cambió el talle"),
    CAMBIO_PRODUCTO("Cambió el producto"),
    CAMBIO_CANTIDAD("Cambió la cantidad"),
    CAMBIO_COLOR("Cambió el color"),
    CORRECCION("Corrección de datos"),
    OTRO("Otro");

    private final String etiqueta;

    MotivoModificacion(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }
}
