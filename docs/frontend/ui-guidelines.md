# UI Guidelines - Mitã

## Tecnologías
- React 18, Vite, React Router v6, CSS Modules.

## Estructura
```
src/
├── components/
│   └── ComponentName/
│       ├── ComponentName.jsx
│       ├── ComponentName.module.css
│       └── index.js
├── pages/
├── services/
├── hooks/
├── data/
└── styles/
```

## Convenciones de nombres
- Componentes: PascalCase, un componente por archivo.
- CSS Modules: `ComponentName.module.css`.
- Hooks: prefijo `use`.
- Servicios: camelCase (`api.js`), funciones con verbos (`fetchTiendas`).

## Diseño
- **Mobile-first obligatorio**: el CSS base es siempre la versión móvil (celular ≤480px). Las pantallas más grandes se adaptan SOLO con media queries `min-width` (`@media (min-width: 768px)` etc.).
- Prohibido `@media (max-width: ...)` para el layout (patrón desktop-first). El único uso permitido es `prefers-reduced-motion`.
- Breakpoints estándar: **480** (móvil L), **768** (tablet), **1024** (desktop), **1200** (desktop L). Cubrir también tamaños habituales: 360-430 (móvil), 820-1024 (tablets), 1280-1536 (laptops), 1920 (monitores).
- Columnas fijas por breakpoint, explícitas (nunca `auto-fill` arbitrario). Definir siempre el número de columnas por rango:
  - Grid productos: 2 (móvil) → 3 (768) → 4 (1024)
  - Tiendas: 1 (móvil) → 2 (768) → 4 (1024)
- Contenedor central `max-width: 1200px` centrado para que en 1920 no se estire.
- Grid de productos con aspect-ratio uniforme para una distribución perfecta de imágenes.
- Targets táctiles ≥42-44px en móvil (chips, talles, botones).
- Variables CSS en `src/styles/global.css`.

## CSS
- `transition` con propiedades específicas, nunca `transition: all`.
- `cubic-bezier` para animaciones suaves. 0.2-0.3s hover, 0.5-0.9s layout.
- `position: fixed/absolute` no requiere reservar espacio; usar `z-index`.

## Accesibilidad
- `alt` en imágenes, labels en inputs, contraste ≥4.5:1, navegación por teclado.

## Estados
- Skeleton loading, empty states y error states en todas las vistas de datos.

## Identidad de marca
- Cada tienda tiene colorPrimario y colorSecundario desde la API (data-driven).
- La página de cada tienda usa su paleta: header, filtros y acentos.

## Rutas
- `/` → Home (selector de tiendas + destacados)
- `/tienda/:slug` → tienda (identidad + filtros + grid)
- Modal de producto sobre la página de tienda.
