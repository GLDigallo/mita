import { Link } from 'react-router-dom'

interface PropsEmptyState {
  titulo: string
  texto: string
  accion?: string
}

function EmptyState({ titulo, texto, accion }: PropsEmptyState) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-borde)] bg-[var(--color-superficie)] px-5 py-15 text-center">
      <span className="mb-3.5 block text-[42px]" aria-hidden="true">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
        </svg>
      </span>
      <h3 className="mb-2 text-[22px] font-bold">{titulo}</h3>
      <p className="mb-5 text-[var(--color-texto-suave)]">{texto}</p>
      {accion && (
        <Link
          to="/"
          className="inline-block border-b-2 border-transparent font-bold text-[var(--color-marca)] transition-[border-color] duration-200 hover:border-current"
        >
          {accion}
        </Link>
      )}
    </div>
  )
}

export default EmptyState