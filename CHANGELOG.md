# Changelog

Todas las novedades notables del proyecto AgrandaditosTienda.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto respeta [Versionado Semántico](https://semver.org/lang/es/).

## [1.0.0] — 2026-08-10

### AgrandaditosTienda: consulta → venta, en producción

Primera versión estable del sistema del grupo de tiendas de ropa para chicos (Mokositos Bebés, Mokositos Niños, Agrandaditos y Mood Teens): la cara pública donde el cliente consulta prendas y el panel de gestión donde el empleado convierte esas consultas en ventas reales con control de stock.

### Agregado

#### Sitio público (cliente)
- Página principal (`/home`) que presenta el grupo y permite elegir la tienda por franja de edad.
- Identidad **data-driven** de cada tienda (nombre, colores, descripción, franja de edad) guardada en la base de datos; se cambia sin recompilar.
- Catálogo por tienda con filtro por categoría, grid de productos uniforme y modal de producto con imagen grande, precio y consulta por WhatsApp.

#### Consultas (panel de gestión)
- Alta de consultas con cliente (find-or-create con constraint único), productos, talle y cantidad.
- Numeración consecutiva por secuencia de base de datos, formateada como `O-XX` en toda la interfaz.
- Seguimiento de estados: `PENDIENTE`, `EN_REVISION`, `ESPERANDO_CLIENTE`, `CONFIRMADA`, `CANCELADA`, `FINALIZADA`.
- Estados cerrados (`CONFIRMADA`, `CANCELADA`, `FINALIZADA`): no admiten edición, cambio de estado ni reapertura.
- Forma de pago `EFECTIVO` / `DIGITAL` por consulta, que precarga el método de pago de la venta.
- **Versionado de consultas**: cada edición guarda una versión, con historial consultable por número completo.
- Auto-cancelación de consultas `PENDIENTE` que no se atienden en 48 horas (tarea programada).
- Detalle con acciones fijas al pie (Pendiente · Pago Efectivo/Digital · Cancelar · Exitoso), ventana con cierre siempre visible y sin scroll lateral.

#### Ventas (panel de gestión)
- Venta en **dos fases** desde una consulta: se arma en `EN_PREPARACION` (editar, agregar, quitar ítems, cambiar variante/talle, cantidad) y al confirmar se descuenta stock **atómicamente**.
- Numeración consecutiva `V-XX`, historial de ventas filtrable por estado.
- Métodos de pago: `EFECTIVO`, `TARJETA_DEBITO`, `TARJETA_CREDITO`, `TRANSFERENCIA`, `MERCADO_PAGO`.
- Estados ligados: confirmar/entregar/cancelar una venta actualiza la consulta a `CONFIRMADA`/`FINALIZADA`/`CANCELADA`; si la venta estaba confirmada, la cancelación repone el stock.

#### Usuarios y roles
- Login con Spring Security 6 (SecurityContext persistido en sesión HTTP).
- Roles `DUEÑO` (accede a todas las tiendas) y `ENCARGADA` (acceso aislado a una sola tienda), con autorización verificada en el servidor en cada request.

#### Plataforma
- SPA única: el frontend se compila dentro de Spring Boot (`backend/src/main/resources/static`), una sola URL.
- Deploy en contenedor Docker/Render con base de datos PostgreSQL externa (soporte de endpoint pooled de Neon).
- Configuración por variables de entorno (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`, `DATABASE_URL`).
- Seed automático de catálogo y usuarios al primer arranque.

### Cambiado
- Formato de números de consulta y venta unificado (`O-1` / `V-1`), sin sufijo de tienda.
- Modales más compactos y con la barra de acciones fija en el detalle de consulta.
- `/gestion` oculto de la cara pública (solo tiendas e imágenes).

### Corregido
- Login persistente entre requests (Spring Security 6).
- Stock bajo concurrencia: descuento/reposición con update atómico con guarda (`stock >= cantidad`) y rollback total si alguna variante no alcanza.
- Alta de clientes duplicados (patrón find-or-create con constraint único).
- Numeración con Hibernate 6 usando secuencias reales en la base de datos.
- Scroll lateral y X de cierre que desaparecía al hacer scroll en las ventanas de detalle.

### Técnico
- Arquitectura por capas `Controller → Service → Repository`, DTOs con records, entidades nunca expuestas.
- Frontend en React 18 + Vite + React Router v6 con CSS Modules.
- Validación de entrada, errores sin stack traces al cliente y sin secretos en logs.
- 33 tests unitarios de los servicios (usuarios, consultas, ventas).
