# AgrandaditosTienda

> Sistema de gestión del ciclo **consulta → venta** para un grupo de tiendas de ropa para chicos en Corrientes Capital.

AgrandaditosTienda conecta dos mundos:

1. **La cara pública** donde el cliente elige la tienda según la edad, recorre el catálogo y consulta prendas por WhatsApp.
2. **El panel de gestión** (`/gestion`) donde el empleado sigue esas consultas, las convierte en **ventas reales** y descuenta stock de forma consistente.

Cada tienda tiene nombre, franja de edad, colores y descripción propios. La identidad es **dato, no código**: vive en la base de datos y se cambia sin recompilar.

## Tiendas

| Tienda | Franja | Slug |
|--------|--------|------|
| Mokositos | Bebés 0-2 años | `mokositos-bebes` |
| Mokositos | Niños 2-8 años | `mokositos-ninos` |
| Agrandaditos | Preadolescentes 8-12 años | `agrandaditos` |
| Mood Teens | Adolescentes 12-16 años | `mood-teens` |

## Características

### Sitio público
- Página principal que presenta el grupo y deriva a cada tienda por franja de edad.
- Catálogo por tienda con filtro por categoría y género, grid de productos uniforme y modal con imagen grande, precio y consulta por WhatsApp.

### Consultas
- Alta de consultas con cliente, productos, talle y cantidad.
- Numeración consecutiva `O-1`, `O-2`, … (secuencia en base de datos).
- Estados: `PENDIENTE`, `EN_REVISION`, `ESPERANDO_CLIENTE`, `CONFIRMADA`, `CANCELADA`, `FINALIZADA`.
- Estados cerrados (`CONFIRMADA`, `CANCELADA`, `FINALIZADA`) no admiten edición, cambio de estado ni reapertura.
- Forma de pago `EFECTIVO` / `DIGITAL` que precarga el método de pago de la venta.
- **Versionado de consultas**: cada edición deja una versión consultable en el historial.
- Auto-cancelación de consultas `PENDIENTE` que no se atienden en 48 horas.

### Ventas
- **Dos fases desde una consulta**: se arma en `EN_PREPARACION` (editar, agregar, quitar ítems, cambiar variante/talle, cantidad) y al confirmar se descuenta stock **atómicamente**.
- Numeración consecutiva `V-1`, `V-2`, … e historial filtrable por estado.
- Métodos de pago: `EFECTIVO`, `TARJETA_DEBITO`, `TARJETA_CREDITO`, `TRANSFERENCIA`, `MERCADO_PAGO`.
- Estados ligados consulta ↔ venta: confirmar / entregar / cancelar una venta actualiza la consulta a `CONFIRMADA` / `FINALIZADA` / `CANCELADA`; si la venta estaba confirmada, cancelarla **repone el stock**.

```
CONSULTA          VENTA
PENDIENTE ──────► EN_PREPARACION   (armado desde los ítems de la consulta)
EN_PREPARACION ──► ...             (edición de ítems, nada se descuenta)
CONFIRMADA ─────► CONFIRMADA       (descuenta stock, atómico)
FINALIZADA ◄───── ENTREGADA        (se entregó en el local)
CANCELADA ◄────── CANCELADA        (si estaba CONFIRMADA, repone stock)
```

### Usuarios y roles
- Login con **Spring Security 6** y sesión HTTP persistente.
- Rol `DUEÑO`: acceso a todas las tiendas.
- Rol `ENCARGADA`: acceso aislado a una sola tienda, verificado en el servidor en cada request.

## Stack

- **Backend**: Java 21, Spring Boot 3.4, Spring Data JPA, PostgreSQL, Spring Security
- **Frontend**: React 18, Vite, React Router v6, CSS Modules
- **Deploy**: Docker, Render (free) con base de datos externa (Neon)

## Estructura del repositorio

```
backend/       API REST (Controller → Service → Repository) + SPA servida por Spring Boot
frontend/      Aplicación React compilada dentro del backend (una sola URL)
docs/          Arquitectura, reglas y guías de desarrollo
Dockerfile     Build multi-etapa: frontend → jar → imagen JRE
render.yaml    Configuración de deploy en Render
CHANGELOG.md   Historial de versiones
```

## Puesta en marcha (desarrollo local)

Requisitos: JDK 21, Maven 3.8+, Node 18+, PostgreSQL 16.

```bash
# 1. Crear la base de datos
createdb agrandaditostienda   # o: psql -U postgres -c "CREATE DATABASE agrandaditostienda;"

# 2. Backend (seed automático la primera vez)
cd backend && mvn spring-boot:run

# 3. Frontend (solo para desarrollo, con hot reload)
cd frontend && npm install && npm run dev   # http://localhost:5173
```

Para probar la aplicación completa (SPA servida por Spring Boot):

```bash
cd frontend && npm run build   # genera el bundle en backend/src/main/resources/static
```

Una sola URL: **http://localhost:8080** · Panel de gestión: **http://localhost:8080/gestion**

### Usuarios de ejemplo (seed)

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Dueño | `admin` | `admin123` |
| Encargada | `encargada-{slug}` (una por tienda) | `encargada123` |

> En producción, definí `ADTIENDA_ADMIN_USERNAME` y `ADTIENDA_ADMIN_PASSWORD` (ver Configuración).

## Configuración

Variables de entorno (con defaults locales):

| Variable | Default | Descripción |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | Host de PostgreSQL |
| `DB_PORT` | `5432` | Puerto |
| `DB_NAME` | `agrandaditostienda` | Nombre de la base |
| `DB_USER` | `postgres` | Usuario |
| `DB_PASSWORD` | `postgres` | Contraseña |
| `PORT` | `8080` | Puerto HTTP |
| `DATABASE_URL` | — | Cadena `postgresql://user:pass@host/db` para cloud (conversión automática, soporta endpoint pooled de Neon) |
| `ADTIENDA_ADMIN_USERNAME` | `admin` | Usuario dueño del seed |
| `ADTIENDA_ADMIN_PASSWORD` | `admin123` | Contraseña del dueño del seed |

El número de WhatsApp del modal se configura por tienda en la base de datos, y el número de respaldo del frontend está en `frontend/src/services/api.js` (`WHATSAPP_NUMBER`).

## API (resumen)

```
GET    /api/tiendas                          Tiendas del grupo
GET    /api/tiendas/{slug}                   Detalle de una tienda
GET    /api/tiendas/{slug}/categorias        Categorías
GET    /api/tiendas/{slug}/generos           Géneros
GET    /api/tiendas/{slug}/productos         Catálogo
GET    /api/productos/destacados             Destacados
GET    /api/health                           Healthcheck

POST   /api/auth/login                       Login (sesión HTTP)
POST   /api/auth/logout                      Logout
GET    /api/auth/me                          Usuario actual

POST   /api/consultas                        Alta de consulta
GET    /api/consultas                        Listado (filtrado por tienda según rol)
GET    /api/consultas/{id}                   Detalle
PATCH  /api/consultas/{id}/estado            Cambio de estado
PATCH  /api/consultas/{id}/forma-pago        Forma de pago Efectivo/Digital
PUT    /api/consultas/{id}                   Edición (versiona la consulta)
GET    /api/consultas/{id}/versiones         Historial de versiones

POST   /api/consultas/{id}/ventas            Crear venta desde consulta
GET    /api/ventas                           Historial de ventas
GET    /api/ventas/{id}                      Detalle
GET    /api/consultas/{id}/venta             Venta asociada a la consulta
PUT    /api/ventas/{id}/items                Editar ítems (fase de armado)
POST   /api/ventas/{id}/confirmar            Confirmar (descuenta stock)
POST   /api/ventas/{id}/entregar             Entregar
POST   /api/ventas/{id}/cancelar             Cancelar (reponer stock si corresponde)

GET    /api/dueño/encargadas                 Gestión de encargadas (solo dueño)
POST   /api/dueño/encargadas                 Alta de encargada (solo dueño)
PATCH  /api/dueño/encargadas/{id}/estado     Activar/desactivar (solo dueño)
```

## Deploy

El `Dockerfile` hace un build multi-etapa (frontend → backend → imagen JRE mínima). En Render se usa `render.yaml` con base de datos externa gratuita (Neon) y healthcheck en `/api/health`.

## Documentación

- `docs/` — arquitectura, requisitos de producto, guías de backend y frontend, reglas del proyecto.
- `AGENTS.md` — contexto e invariantes para agentes de desarrollo.
- `CHANGELOG.md` — historial de versiones.

## Versión

**v1.0.0** — primera versión estable del ciclo consulta → venta. Ver [CHANGELOG.md](./CHANGELOG.md).
