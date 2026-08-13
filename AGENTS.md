# AGENTS.md — AgrandaditosTienda

# AgrandaditosTienda · Agente de Desarrollo

## En qué proyecto trabajás

AgrandaditosTienda es un grupo de **4 tiendas de ropa para chicos**, cada una con su propia identidad visual (colores, nombre, slug) y su franja de edad:

- **Mokositos** (`mokositos-bebes`) — Bebés (0-2 años)
- **Mokositos** (`mokositos-ninos`) — Niños (2-8 años)
- **Agrandaditos** (`agrandaditos`) — Preadolescentes (8-12 años)
- **Mood Teens** (`mood-teens`) — Adolescentes (12-16 años)

La identidad de cada tienda es **dato, no código**: se cambia en la base de datos, no recompilando.

AgrandaditosTienda tiene dos caras:

1. **Pública** — el cliente elige su tienda por edad, filtra por categoría y género, ve el catálogo y consulta prendas por WhatsApp.
2. **De gestión** (`/gestion`) — el empleado sigue las consultas y las convierte en **ventas reales** con control de stock.

## Tu misión acá

El corazón del sistema es el ciclo **consulta → venta**:

```
CONSULTA          VENTA
PENDIENTE ──────► EN_PREPARACION   (armado desde los ítems de la consulta)
EN_PREPARACION ──► ...             (edición de ítems, nada se descuenta)
CONFIRMADA ─────► CONFIRMADA       (descuenta stock, atómico)
FINALIZADA ◄───── ENTREGADA        (se entregó en el local)
CANCELADA ◄────── CANCELADA        (si estaba CONFIRMADA, repone stock)
```

Tu trabajo es que ese ciclo funcione **sin perder stock, sin perder trazabilidad y sin romper la cara pública**.

## Cómo se juega

Trabajás **para** el desarrollador: él es el arquitecto y el único que decide. Vos implementás, verificás y ejecutás.

- Proponé mejoras, no las implementes sin aprobación.
- Antes de escribir **una sola línea**, repasá TODAS las reglas aplicables de este archivo y de los referenciados abajo, y verificá que lo que vas a hacer las cumple.
- Cada regla existente nació de un error o una lección. Ignorarla es repetir el error.

### Reglas de fondo (no se duplican acá, se aplican)
- Globales — `~/.config/opencode/agent-rules/global-rules.md`
- Java / Spring Boot — `~/.config/opencode/agent-rules/java-spring-rules.md`
- React — `~/.config/opencode/agent-rules/react-rules.md`

### Reglas específicas de AgrandaditosTienda
- Este archivo
- `docs/ia/rules.md` — identidad del proyecto, tecnologías, lecciones
- `docs/product/requirements.md` — qué debe hacer AgrandaditosTienda
- `docs/architecture/architecture.md` — módulos, modelo de datos, API
- `docs/backend/backend-guidelines.md` — convenciones de backend
- `docs/frontend/ui-guidelines.md` — convenciones de frontend

**Jerarquía:** lo específico de AgrandaditosTienda gana sobre lo global. Si hay conflicto, prevalece la regla del proyecto.

## Los invariantes de AgrandaditosTienda (no se negocian)

1. **Identidad data-driven.** Nombres, colores, edades y catálogo viven en la BD. Nunca hardcodear una tienda en el frontend.
2. **Toda venta nace de una consulta.** No existe una venta sin su consulta asociada (trazabilidad completa).
3. **Nada descuenta stock hasta confirmar.** La fase EN_PREPARACION solo edita ítems; el descuento ocurre en la confirmación.
4. **Stock íntegro bajo concurrencia.** Nunca "leer stock y restar en Java". El descuento/reposición es un update atómico con guarda (`stock >= cantidad`) y rollback total si alguna variante no alcanza.
5. **Estados ligados.** Al confirmar/entregar/cancelar una venta, la consulta pasa a CONFIRMADA/FINALIZADA/CANCELADA. Nunca pueden quedar desincronizados.
6. **Una sola SPA.** El frontend se compila a `backend/src/main/resources/static` y lo sirve Spring Boot. Una sola URL.
7. **`/gestion` es solo para empleados.** Autenticación y autorización verificadas en el servidor en cada request.

## Antes de tocar código

1. Comprendé la solicitud a fondo.
2. Repasá TODAS las reglas aplicables (este archivo, docs, reglas globales).
3. **Mapeá el impacto en el ciclo consulta → venta**: ¿toca consultas, ventas, stock o estados? ¿Toca la cara pública?
4. Verificá dependencias disponibles (`pom.xml`, `package.json`) antes de escribir.
5. Implementá.
6. Verificá compilación, imports, warnings, errores.
7. Ejecutá el proyecto y probá (si tocaste el ciclo, probá el flujo completo consulta → venta → entrega/cancelación y controlá stock en BD).
8. Informá cambios realizados.

## Mientras escribís código

- Respetá estructura, estilo y convenciones existentes. Reutilizá código antes de crear nuevo.
- Arquitectura de capas: `Controller → Service → Repository`. DTOs records. Nunca exponer entidades.
- Cada clase, cada método, cada archivo: una responsabilidad.
- No sobreingeniería, no optimizaciones prematuras, no patrones por cumplir una regla.
- El código debe leerse como documentación.
- Validá toda entrada externa; errores sin stack traces al cliente; sin secretos en logs.

## Definición de "listo"

Una tarea termina cuando:

- Compila sin errores ni warnings importantes.
- La aplicación se ejecuta y responde.
- No se rompieron funcionalidades existentes (sobre todo la cara pública y el ciclo consulta → venta).
- El stock quedó consistente en las pruebas.
- Se respetaron todas las reglas de este documento y de las reglas de fondo.
- El proyecto quedó en estado ejecutable.

Al finalizar, informá: archivos creados/modificados, funcionalidades implementadas, decisiones técnicas importantes, problemas encontrados y recomendaciones.

## Lecciones que ya pagó AgrandaditosTienda

- **Hibernate 6** no permite `@GeneratedValue` sobre una columna que no es `@Id`. Para el número de consulta (`C-%06d`) y de venta (`V-%06d`) se crea la secuencia al arranque (`create sequence if not exists`) y se asigna con `select nextval(...)` antes del insert.
- **Spring Security 6** no persiste el `SecurityContext` en la sesión HTTP por defecto: hay que configurar `securityContext.securityContextRepository(new HttpSessionSecurityContextRepository())` con `requireExplicitSave(false)`. Sin esto, el login no sobrevive entre requests.
- **Stock bajo concurrencia**: el descuento se hace con `UPDATE variante_producto SET stock = stock - :cantidad WHERE id = :id AND stock >= :cantidad` verificando el count de filas afectadas. Si una variante no alcanza, rollback de todo. Leer-y-restar en Java es una race condition.
- **Guardado asíncrono en el frontend**: si una edición llega mientras una guarda anterior está en vuelo y se descarta, el usuario pierde cambios. Serializar las guardas con una cola (ref) y hacer que "confirmar" espere a que la cola termine antes de descargar stock.

## Mejora continua

Cada error, cada falla, cada mala decisión técnica debe dejar una lección escrita. Cuando cometés un error: reconocelo, corregilo y actualizá este documento con una regla conceptual que prevenga que vuelva a ocurrir. No hay vergüenza en equivocarse; la vergüenza sería repetir el error porque no se documentó la lección.
