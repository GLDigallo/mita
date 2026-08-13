# Backend Guidelines - AgrandaditosTienda

## Arquitectura de capas

```
Controller → Service → Repository → Database
```

Queda prohibido: Controller → Repository, Controller → Database, Frontend → Database.

## Base de datos

- PostgreSQL 16. Base local: `agrandaditostienda`, usuario `postgres`, password `postgres`.
- Configuración por variables de entorno: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, con defaults para desarrollo local.
- Conversión de `DATABASE_URL` en dos niveles (shell + `main()` de Java) para producción. Aplicar `.trim()` a toda variable de entorno.
- Todas las tablas con `id bigserial` (Long), campos string con longitud máxima definida.
- Índices en foreign keys y columnas de búsqueda frecuente (`slug`).

## Entidades

- Lombok `@Getter @Setter @NoArgsConstructor`. Prohibido `@Data`, `@ToString`, `@AllArgsConstructor` en entidades.
- Timestamps con `@PrePersist` / `@PreUpdate`.
- Relaciones `FetchType.LAZY`.
- `@Enumerated(EnumType.STRING)` para enums.

## DTOs

- Records de Java. Validación con Jakarta Validation.
- Nunca exponer entidades.

## Mappers

- Un mapper por entidad, `@Component`. Conversión centralizada Entity ↔ DTO.

## Controllers

- `@RestController` + `@RequestMapping`. Sin lógica de negocio.
- `@Valid` en entradas. `ResponseEntity` con códigos correctos.

## Services

- `@Transactional(readOnly = true)` para lecturas.
- Excepciones específicas, nunca `RuntimeException` genérica.

## Exception handling

- `@RestControllerAdvice` global. Formato uniforme de error. Nunca stack traces al cliente.

## SPA Integration

- `SpaFilter` (`@Order(HIGHEST_PRECEDENCE)`) redirige rutas no-API a `/index.html`.
- `WebConfig`: view controller de `/` a `index.html`.
- `SecurityConfig`: `permitAll()` para `/`, `/index.html`, `/assets/**`, `/favicon.ico` y rutas públicas.
- El SpaFilter se registra ANTES que Spring Security.
