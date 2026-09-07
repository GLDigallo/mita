import type { CSSProperties } from 'react'
import type { Categoria } from '../../types'

interface PropsCategoryFilter {
  categorias: Categoria[]
  seleccionada: string
  onSeleccionar: (slug: string) => void
  colorPrimario?: string
}

const chipBase =
  'inline-flex min-h-[42px] shrink-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-pill)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-[18px] text-[14.5px] font-semibold text-[var(--color-texto-suave)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-px hover:border-[var(--color-texto)] hover:text-[var(--color-texto)]'

const chipActivo = 'border-[var(--chip-color)] bg-[var(--chip-color)] text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)]'

function CategoryFilter({ categorias, seleccionada, onSeleccionar, colorPrimario }: PropsCategoryFilter) {
  return (
    <div
      className="flex gap-2.5 overflow-x-auto whitespace-nowrap px-0 pb-1.5 pt-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-x-visible"
      role="group"
      aria-label="Filtrar por categoría"
    >
      {[
        { slug: '', etiqueta: 'Todos' },
        { slug: 'destacados', etiqueta: '✦ Destacados' },
        ...categorias.map((c) => ({ slug: c.slug, etiqueta: c.nombre })),
      ].map(({ slug, etiqueta }) => {
        const activa = seleccionada === slug || (slug === '' && seleccionada === '')
        const esDestacado = slug === 'destacados'
        const estilo = (activa && colorPrimario
          ? { '--chip-color': colorPrimario }
          : undefined) as CSSProperties | undefined
        return (
          <button
            key={slug || 'todos'}
            type="button"
            className={`${chipBase} ${activa ? chipActivo : ''} ${esDestacado && !activa ? 'text-[#b7791f]' : ''}`}
            style={estilo}
            onClick={() => onSeleccionar(slug)}
            aria-pressed={activa}
          >
            {etiqueta}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryFilter