# Arquitectura - AgrandaditosTienda

## Vista general

```
Browser (SPA React) → Spring Boot (API REST + archivos estáticos) → PostgreSQL
```

El frontend se compila a `backend/src/main/resources/static` y se sirve desde el mismo servidor Spring Boot. Una sola URL: `http://localhost:8080`.

## Backend (capa)

```
Controller → Service → Repository → Database
```

### Módulos
- `com.agrandaditostienda.entity` — Tienda, Categoria, Producto, VarianteProducto, Cliente, Consulta, ProductoConsultado, Venta, VentaItem
- `com.agrandaditostienda.repository` — Spring Data JPA
- `com.agrandaditostienda.dto` — records de respuesta/solicitud
- `com.agrandaditostienda.mapper` — Entity ↔ DTO
- `com.agrandaditostienda.service` — lógica de negocio
- `com.agrandaditostienda.controller` — API REST pública y de gestión
- `com.agrandaditostienda.exception` — manejo global de errores
- `com.agrandaditostienda.config` — seguridad, SPA, CORS, datos iniciales

## Modelo de datos

- **tienda**: id, nombre, slug, franja de edad (enum), descripción, colores, imagen, activa
- **categoria**: id, nombre, slug, orden, tienda_id (FK)
- **producto**: id, nombre, descripcion, precio, imagen, talle, destacado, activo, tienda_id (FK), categoria_id (FK)
- **variante_producto**: id, color, talle, stock, producto_id (FK). Un producto tiene varias variantes (talle+color) con su propio stock.
- **cliente**: id, nombre, telefono, email, canal_preferido
- **consulta**: id, numero (secuencia C-%06d), estado (enum), fecha, tienda_id (FK), cliente_id (FK)
- **producto_consultado**: id, consulta_id (FK), producto_id (FK), variante_id (FK), cantidad, precio_unitario
- **venta**: id, numero (secuencia V-%06d), estado (enum), metodo_pago (enum), fecha, empleado, importe_total, tienda_id (FK), consulta_id (FK), cliente_id (FK)
- **venta_item**: id, venta_id (FK), producto_id (FK), variante_id (FK), cantidad, precio_unitario

Una tienda tiene muchas categorías y muchos productos. Una consulta tiene muchos productos consultados y, al confirmarse la venta, descuenta stock de las variantes.

## API

Público:
- `GET /api/tiendas` — lista de tiendas activas
- `GET /api/tiendas/{slug}` — detalle de tienda
- `GET /api/tiendas/{slug}/categorias` — categorías de la tienda
- `GET /api/tiendas/{slug}/productos?categoria={slug}` — productos (filtrables)
- `GET /api/productos/destacados` — destacados de todo el grupo
- `POST /api/consultas` — crear consulta (pública)

Autenticado (empleados):
- `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET/PATCH /api/consultas/**` — listar, detalle, cambiar estado
- `POST /api/consultas/{id}/ventas` — crear venta desde consulta
- `GET /api/ventas` — listar (filtros por estado), `GET /api/ventas/{id}` — detalle
- `PUT /api/ventas/{id}/items` — editar ítems (solo EN_PREPARACION)
- `POST /api/ventas/{id}/confirmar` — descuenta stock atómicamente
- `POST /api/ventas/{id}/entregar` — consulta pasa a FINALIZADA
- `POST /api/ventas/{id}/cancelar` — repone stock si estaba CONFIRMADA
- `GET /api/consultas/{id}/venta` — venta asociada a una consulta

## Seguridad

- `permitAll()` para rutas públicas del SPA y API de catálogo.
- `/api/consultas/**` (GET/PATCH) y `/api/ventas/**` autenticados con sesión HTTP.
- Sin datos sensibles en logs. Errores genéricos al cliente.
