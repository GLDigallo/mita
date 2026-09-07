import type { CSSProperties } from 'react'
import type { Genero } from '../../types'

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
  'inline-flex min-h-[42px] shrink-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-pill)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-[18px] text-[14.5px] font-semibold text-[var(--color-texto-suave)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-px hover:border-[var(--color-texto)] hover:text-[var(--color-texto)]'

const chipActivo = 'border-[var(--chip-color)] bg-[var(--chip-color)] text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)]'

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
          className={`${chipBase} ${todoActivo ? chipActivo : ''}`}
          style={(todoActivo && colorPrimario ? { '--chip-color': colorPrimario } : undefined) as CSSProperties | undefined}
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
            className={`${chipBase} ${activo ? chipActivo : ''}`}
            style={(activo && colorPrimario ? { '--chip-color': colorPrimario } : undefined) as CSSProperties | undefined}
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