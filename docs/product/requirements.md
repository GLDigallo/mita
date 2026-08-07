# Requirements - Mitã

## Objetivo
Sitio web de un grupo de tiendas de ropa en Corrientes Capital con locales independientes según la edad del cliente, desde bebés hasta adolescentes.

## Usuarios
- **Clientes**: navegan, eligen tienda, filtran por categoría, consultan prendas.
- **Empleados**: en `/gestion`, hacen seguimiento de consultas y arman ventas (descuentan stock, eligen método de pago, entregan/cancelan).
- (Futuro) Administradores: gestionan tiendas, categorías, productos y precios.

## Requisitos funcionales (v1)
1. Página principal que presenta el grupo y permite acceder a cada tienda.
2. Cada tienda tiene: nombre propio, franja de edad, descripción y colores de identidad.
3. Dentro de cada tienda, filtro por categoría (prendas: remeras, pantalones, vestidos, etc.).
4. Grid de productos con imágenes distribuidas de forma uniforme y consistente.
5. Modal de producto con imagen grande, precio y acceso a consulta por WhatsApp.
6. Sitio responsive: móvil, tablet y desktop.
7. Panel de gestión (`/gestion`, login de empleado): lista de consultas, seguimiento de estados (PENDIENTE, EN_PREPARACION, CONFIRMADA, CANCELADA, FINALIZADA).
8. Venta en dos fases desde una consulta: se arma en EN_PREPARACION (editar/agregar/quitar ítems, cambiar variante/talle/color, cantidad) y al confirmar se descuenta stock atómicamente.
9. Estados de venta: EN_PREPARACION, CONFIRMADA, ENTREGADA, CANCELADA. Métodos de pago: EFECTIVO, TARJETA_DEBITO, TARJETA_CREDITO, TRANSFERENCIA, MERCADO_PAGO.
10. Venta numerada (V-%06d), con historial de ventas filtrable por estado.

## Requisitos no funcionales
- Seguridad OWASP (validación de entrada, errores sin datos internos).
- Arquitectura por capas, DTOs con records, CSS Modules.
- Configuración por variables de entorno, lista para deploy (SPA integrada).
- Descuento/reposición de stock con updates atómicos (guarda de stock suficiente) para evitar sobreventa en concurrencia.

## Fuera de alcance (futuro)
- Panel de administración del catálogo, carrito/compra online para clientes, login de clientes.
