import type { CSSProperties } from 'react'
import type { Categoria } from '../../types'
import { colorContraste } from '../../utils/textoContraste'

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
  'inline-flex min-h-[42px] shrink-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-pill)] border px-[18px] text-[14.5px] font-semibold transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-px'

const chipInactivo = 'border-[var(--color-borde)] bg-[var(--color-superficie)] text-[var(--color-texto-suave)] hover:border-[var(--color-texto)] hover:text-[var(--color-texto)]'

const chipActivo = 'border-[var(--chip-color)] bg-[var(--chip-color)] text-[var(--chip-texto)]'

const chipDestacado =
  'animate-destacado-brillo border-2 border-[#9a6710] bg-[linear-gradient(100deg,#f7e3a7_0%,#efc04a_30%,#fff2c8_50%,#efc04a_70%,#f7e3a7_100%)] bg-[length:200%_100%] text-[#4a3310]'

const estiloActivo = (colorPrimario: string | undefined) =>
  ({ '--chip-color': colorPrimario ?? '#4f46e5', '--chip-texto': colorContraste(colorPrimario) }) as CSSProperties

function CategoryFilter({ categorias, tieneDestacados, seleccionada, onSeleccionar, colorPrimario }: PropsCategoryFilter) {
  const renderChip = (slug: string, etiqueta: string, destacado?: boolean) => {
    const activo = seleccionada === slug
    const esDestacados = destacado === true
    const estilo = esDestacados ? undefined : activo ? estiloActivo(colorPrimario) : undefined
    const clases = esDestacados
      ? `${chipBase} ${chipDestacado} ${activo ? 'scale-[1.06]' : 'hover:scale-[1.03]'}`
      : `${chipBase} ${activo ? chipActivo : chipInactivo}`
    return (
      <button
        key={slug}
        type="button"
        className={clases}
        style={estilo}
        onClick={() => onSeleccionar(activo ? '' : slug)}
        aria-pressed={activo}
      >
        {esDestacados ? (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block animate-destacado-estrella">
              ✦
            </span>
            {etiqueta}
          </span>
        ) : (
          etiqueta
        )}
      </button>
    )
  }

  return (
    <div className={fila} role="group" aria-label="Filtrar por categoría">
      {tieneDestacados && renderChip('destacados', 'Destacados', true)}
      {categorias.map((categoria) => renderChip(categoria.slug, categoria.nombre))}
    </div>
  )
}

export default CategoryFilter