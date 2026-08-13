# AgrandaditosTienda · Conocimiento del proyecto

Mapa de hechos y decisiones del dominio. El `AGENTS.md` define cómo trabaja el agente; este archivo es la memoria del proyecto.

## Qué es

Grupo de **4 tiendas de ropa para chicos**, cada una con local propio e identidad independiente. El cliente elige la tienda que corresponde a su edad desde la página principal.

| Tienda | Slug | Franja |
|--------|------|--------|
| Mokositos | `mokositos-bebes` | Bebés (0-2) |
| Mokositos | `mokositos-ninos` | Niños (2-8) |
| Agrandaditos | `agrandaditos` | Preadolescentes (8-12) |
| Mood Teens | `mood-teens` | Adolescentes (12-16) |

Ninguna tienda es exclusiva de un género: cada una vende para varones, mujeres y unisex de su franja. Los nombres y colores son datos de la BD, no código.

## Stack y configuración

- **Backend**: Java 21, Spring Boot 3.4, Spring Data JPA, PostgreSQL 16 (`backend/`).
- **Frontend**: React 18, Vite, React Router v6, CSS Modules (`frontend/`).
- **Build**: el frontend compila a `backend/src/main/resources/static`; Spring Boot sirve el SPA (una sola URL).
- **Local**: backend `http://localhost:8080`, dev frontend `http://localhost:5173`, BD `agrandaditostienda` (postgres/postgres).
- **Producción**: `DATABASE_URL` convertida en dos niveles (shell + `main()`), puerto `PORT`, credenciales de empleado por env vars. Deploy Docker + Render.

## El dominio en una pasada

- **Consulta** (pública): el cliente la genera desde el modal de producto y contacta por WhatsApp. Estados: `PENDIENTE`, `EN_PREPARACION`, `CONFIRMADA`, `FINALIZADA`, `CANCELADA`. Número secuencial `C-%06d`.
- **Venta** (empleado, en `/gestion`): se arma desde una consulta en dos fases — armado `EN_PREPARACION` (editar variante/talle/color, cantidad, quitar/agregar productos del catálogo) → confirmación `CONFIRMADA` que descuenta stock de las variantes → `ENTREGADA` (consulta FINALIZADA) o `CANCELADA` (reponer stock si estaba confirmada). Número secuencial `V-%06d`.
- **Métodos de pago**: `EFECTIVO`, `TARJETA_DEBITO`, `TARJETA_CREDITO`, `TRANSFERENCIA`, `MERCADO_PAGO`.
- **Identidad por tienda**: `colorPrimario`, `colorSecundario`, descripción, rango de edad — data-driven desde la API.

## Modelo de datos

`tienda` → `categoria` y `producto`; `producto` → `variante_producto` (color + talle + stock). `cliente` → `consulta` → `producto_consultado`. `venta` → `venta_item` (producto + variante + cantidad + precio). La venta guarda su consulta y su cliente (trazabilidad).

## Acceso

- **Público**: catálogo, `POST /api/consultas`, `GET /api/tiendas`, productos/destacados.
- **Empleado**: `/gestion` con login (`POST /api/auth/login`, sesión HTTP). Consultas (GET/PATCH) y `/api/ventas/**` requieren autenticación. Admin local: `admin` / `admin123` (env vars en producción).

## Lecciones del proyecto

Ver `AGENTS.md` → "Lecciones que ya pagó AgrandaditosTienda" (secuencias con `nextval`, sesión Spring Security, stock atómico con guarda, cola de guardado en el frontend).
