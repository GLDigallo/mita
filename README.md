# Mitã

Grupo de tiendas de ropa para bebés, niños, niñas y adolescentes en Corrientes Capital. Cada local tiene nombre e identidad propia y el cliente accede desde una página principal.

## Tiendas (nombres provisorios)

| Tienda | Edad | Slug |
|--------|------|------|
| Nunu | Bebés 0-2 | `nunu-bebes` |
| Gurí | Niños 2-8 | `guri-ninos` |
| Chinita | Niñas 2-8 | `chinita-ninas` |
| Pibe | Adolescentes 9-16 | `pibe-adolescentes` |

Los nombres son datos en la base de datos (tabla `tienda`), no código: se cambian sin recompilar.

## Stack

- **Backend**: Java 21, Spring Boot 3.4, Spring Data JPA, PostgreSQL 16
- **Frontend**: React 18, Vite, React Router v6, CSS Modules

## Requisitos

- JDK 21, Maven 3.8+, Node 18+
- PostgreSQL 16 corriendo localmente con usuario `postgres` / `postgres`

## Puesta en marcha

```bash
# 1. Crear la base de datos
createdb mita  # o: psql -U postgres -c "CREATE DATABASE mita;"

# 2. Backend (seed automático la primera vez)
cd backend && mvn spring-boot:run

# 3. Frontend (solo para desarrollo)
cd frontend && npm install && npm run dev   # http://localhost:5173
```

En producción el frontend se compila dentro de Spring Boot:

```bash
cd frontend && npm run build   # genera archivos en backend/src/main/resources/static
```

Una sola URL: **http://localhost:8080**

## Configuración

Variables de entorno (con defaults locales): `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`. Para cloud se soporta `DATABASE_URL` (`postgresql://user:pass@host/db`) con conversión automática en `main()`.

El número de WhatsApp del modal está en `frontend/src/services/api.js` (`WHATSAPP_NUMBER`).

## API

- `GET /api/tiendas`
- `GET /api/tiendas/{slug}`
- `GET /api/tiendas/{slug}/categorias`
- `GET /api/tiendas/{slug}/productos?categoria={slug}`
- `GET /api/productos/destacados`
- `GET /api/health`

## Documentación

Ver `docs/` (arquitectura, reglas, guías de backend/frontend y requisitos) y `AGENTS.md`.
