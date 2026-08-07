# Reglas específicas - Mitã

## Descripción
Grupo de tiendas de ropa para bebés, niños, niñas y adolescentes, con locales propios e identidad independiente. Los clientes eligen la tienda que corresponde a su edad desde la página principal.

Marca provisoria: **Mitã** (palabra guaraní para "niño/niña"). Los 4 locales provisorios se dividen por franja de edad (ninguno es exclusivo de un género; cada tienda vende para varones, mujeres y unisex de su franja):
- **Mokositos** (`mokositos-bebes`) — Bebés (0-2 años)
- **Mokositos** (`mokositos-ninos`) — Niños (2-8 años)
- **Agrandaditos** (`agrandaditos`) — Preadolescentes (8-12 años)
- **Mood Teens** (`mood-teens`) — Adolescentes (12-16 años)

Los nombres son datos, no código: se cambian en la base de datos, no recompilando.

## Arquitectura
Fullstack: Spring Boot (backend + API REST + sirve SPA) + React (frontend).

## Tecnologías utilizadas
- Backend: Java 21, Spring Boot 3.4, Spring Data JPA, PostgreSQL 16
- Frontend: React 18, Vite, React Router v6, CSS Modules

## Configuración
- Puerto backend: 8080
- Puerto frontend (dev): 5173
- Base de datos local: `mita` (postgres/postgres)

## Funcionalidades principales
1. Página principal con selector de tiendas por franja de edad
2. Página de cada tienda con identidad propia (nombre, colores, edad)
3. Filtro por categoría dentro de cada tienda
4. Filtro por género dentro de cada tienda (los géneros disponibles salen del catálogo de esa tienda)
5. Grid de productos con distribución uniforme de imágenes
6. Modal de producto con talles y consulta por WhatsApp
7. Panel de gestión `/gestion` (login de empleado): consultas y ventas

## Flujo de venta (dos fases)
1. Desde una consulta se arma la venta en **EN_PREPARACION** (solo ítems de la consulta).
2. Se editan ítems vía servidor (cambiar variante/talle/color, cantidad, quitar, agregar del catálogo). Nada se descuenta todavía.
3. Al **confirmar**: descuento atómico de stock (update con guarda `stock >= cantidad`, rollback si no alcanza) y consulta → CONFIRMADA.
4. Al **entregar**: consulta → FINALIZADA. Al **cancelar**: si estaba CONFIRMADA se repone stock y consulta → CANCELADA.
5. La venta se numera con secuencia independiente (`venta_numero_seq`, formato V-%06d).

## Flujo de trabajo
1. Desarrollador expresa una idea
2. Agente implementa
3. Agente ejecuta y muestra URL
4. Desarrollador revisa
5. Se repite hasta lograr el resultado

## Lecciones técnicas (evitar errores repetidos)
- Hibernate 6 NO permite `@GeneratedValue` sobre una columna que no es el `@Id`. Para un número único generado por secuencia, crear la secuencia con `JdbcTemplate` al arranque (`create sequence if not exists`) y asignar el valor con `select nextval(...)` (query nativa) antes del insert.
- Spring Security 6 no persiste el `SecurityContext` en la sesión HTTP por defecto: hay que configurar `securityContext.securityContextRepository(new HttpSessionSecurityContextRepository())` y `requireExplicitSave(false)`. Sin esto, la sesión no sobrevive entre requests.
- El `numero` (C-0000X) de una consulta es una secuencia independiente del `id` de fila; puede haber "huecos" tras intentos fallidos (nextval se consume antes de validar los ítems). No es un bug.
- El descuento de stock ante concurrencia NO se hace leyendo stock y restando en Java (race condition): se hace con `UPDATE variante_producto SET stock = stock - :cantidad WHERE id = :id AND stock >= :cantidad` y se verifica el count de filas afectadas. Si una variante no alcanza, rollback de todo.
