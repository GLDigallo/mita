import { useEffect } from 'react'

interface PropsConfirmDialog {
  titulo: string
  mensaje: string
  textoAccion?: string
  peligro?: boolean
  onConfirmar: () => void
  onCancelar: () => void
  cargando?: boolean
}

function ConfirmDialog({
  titulo,
  mensaje,
  textoAccion = 'Confirmar',
  peligro = false,
  onConfirmar,
  onCancelar,
  cargando = false,
}: PropsConfirmDialog) {
  useEffect(() => {
    function manejarEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && !cargando) onCancelar()
    }
    document.addEventListener('keydown', manejarEscape)
    return () => document.removeEventListener('keydown', manejarEscape)
  }, [onCancelar, cargando])

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={!cargando ? onCancelar : undefined}
    >
      <div
        className="w-full max-w-[400px] rounded-[var(--radius-lg)] bg-[var(--color-superficie)] p-6 shadow-[var(--shadow-lg)]"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="mb-2 text-[18px] font-bold">{titulo}</h3>
        <p className="mb-6 text-[15px] leading-[1.5] text-[var(--color-texto-suave)]">{mensaje}</p>
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            className="min-h-10 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-4 text-[14px] font-semibold text-[var(--color-texto-suave)] transition-colors duration-200 hover:border-[var(--color-texto)] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onCancelar}
            disabled={cargando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`min-h-10 rounded-[var(--radius-sm)] border px-4 text-[14px] font-semibold text-white transition-opacity duration-200 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50 ${
              peligro
                ? 'border-[#c0392b] bg-[#c0392b]'
                : 'border-[var(--color-marca)] bg-[var(--color-marca)]'
            }`}
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Procesando…' : textoAccion}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog