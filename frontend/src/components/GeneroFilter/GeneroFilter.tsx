import type { CSSProperties } from 'react'
import type { Genero } from '../../types'
import { colorContraste } from '../../utils/textoContraste'

interface PropsGeneroFilter {
  generos: Genero[]
  seleccionado: string
  onSeleccionar: (genero: Genero) => void
  colorPrimario?: string
  onTodo?: () => void
  todoActivo?: boolean
}

const GENERO_ETIQUETAS: Record<Genero, string> = {
  NINO: 'Niños',
  NINA: 'Niñas',
  UNISEX: 'Unisex',
}

const chipBase =
  'inline-flex min-h-[42px] shrink-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-pill)] border px-[18px] text-[14.5px] font-semibold transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-px'

const chipInactivo = 'border-[var(--color-borde)] bg-[var(--color-superficie)] text-[var(--color-texto-suave)] hover:border-[var(--color-texto)] hover:text-[var(--color-texto)]'

const chipActivo = 'border-[var(--chip-color)] bg-[var(--chip-color)] text-[var(--chip-texto)] shadow-[0_4px_14px_rgba(0,0,0,0.18)]'

const estiloActivo = (colorPrimario: string | undefined) =>
  ({ '--chip-color': colorPrimario ?? '#4f46e5', '--chip-texto': colorContraste(colorPrimario) }) as CSSProperties

function GeneroFilter({ generos, seleccionado, onSeleccionar, colorPrimario, onTodo, todoActivo }: PropsGeneroFilter) {
  return (
    <div
      className="flex gap-2.5 overflow-x-auto whitespace-nowrap px-0 pb-1.5 pt-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-x-visible"
      role="group"
      aria-label="Filtrar por género"
    >
      {onTodo && (
        <button
          type="button"
          className={`${chipBase} ${todoActivo ? chipActivo : chipInactivo}`}
          style={todoActivo ? estiloActivo(colorPrimario) : undefined}
          onClick={onTodo}
          aria-pressed={todoActivo}
        >
          Todo
        </button>
      )}
      {generos.map((genero) => {
        const activo = seleccionado === genero
        return (
          <button
            key={genero}
            type="button"
            className={`${chipBase} ${activo ? chipActivo : chipInactivo}`}
            style={activo ? estiloActivo(colorPrimario) : undefined}
            onClick={() => onSeleccionar(genero)}
            aria-pressed={activo}
          >
            {GENERO_ETIQUETAS[genero] ?? genero}
          </button>
        )
      })}
    </div>
  )
}

export default GeneroFilter