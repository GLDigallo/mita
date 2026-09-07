import type { CSSProperties } from 'react'
import type { Categoria } from '../../types'

interface PropsCategoryFilter {
  categorias: Categoria[]
  tieneDestacados: boolean
  seleccionada: string
  onSeleccionar: (slug: string) => void
  colorPrimario?: string
}

const fila =
  'flex gap-2.5 overflow-x-auto whitespace-nowrap px-0 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-x-visible'

const chipBase =
  'inline-flex min-h-[42px] shrink-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-pill)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-[18px] text-[14.5px] font-semibold text-[var(--color-texto-suave)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-px hover:border-[var(--color-texto)] hover:text-[var(--color-texto)]'

const chipActivo = 'border-[var(--chip-color)] bg-[var(--chip-color)] text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)]'

function CategoryFilter({ categorias, tieneDestacados, seleccionada, onSeleccionar, colorPrimario }: PropsCategoryFilter) {
  const renderChip = (slug: string, etiqueta: string, extraClase?: string) => {
    const activo = seleccionada === slug
    const estilo = (activo && colorPrimario ? { '--chip-color': colorPrimario } : undefined) as CSSProperties | undefined
    return (
      <button
        key={slug}
        type="button"
        className={`${chipBase} ${activo ? chipActivo : ''} ${extraClase ?? ''}`}
        style={estilo}
        onClick={() => onSeleccionar(activo ? '' : slug)}
        aria-pressed={activo}
      >
        {etiqueta}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {tieneDestacados && (
        <div className={fila} role="group" aria-label="Filtrar por destacados">
          {renderChip(
            'destacados',
            '✦ Destacados',
            seleccionada !== 'destacados' ? 'text-[#b7791f]' : undefined,
          )}
        </div>
      )}
      <div className={fila} role="group" aria-label="Filtrar por categoría">
        {categorias.map((categoria) => renderChip(categoria.slug, categoria.nombre))}
      </div>
    </div>
  )
}

export default CategoryFilter