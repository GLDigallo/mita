import { useEffect } from 'react'

export type TipoToast = 'error' | 'exito' | 'info'

export interface ToastItem {
  id: number
  tipo: TipoToast
  mensaje: string
}

interface PropsToastItem {
  toast: ToastItem
  onCerrar: (id: number) => void
}

interface PropsToastHost {
  toasts: ToastItem[]
  onCerrar: (id: number) => void
}

const bordePorTipo: Record<TipoToast, string> = {
  error: 'border-l-[#dc2626]',
  exito: 'border-l-[#16a34a]',
  info: 'border-l-[var(--gestion-color,var(--color-marca))]',
}

const fondoPorTipo: Record<TipoToast, string> = {
  error: 'bg-[#fef2f2] text-[#991b1b]',
  exito: 'bg-[#f0fdf4] text-[#166534]',
  info: 'bg-[var(--color-superficie)] text-[var(--color-texto)]',
}

function iconoTipo(tipo: TipoToast) {
  if (tipo === 'error') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
    )
  }
  if (tipo === 'exito') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="m8.5 12 2.5 2.5 4.5-5" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

function ToastItemView({ toast, onCerrar }: PropsToastItem) {
  useEffect(() => {
    const temporizador = setTimeout(() => onCerrar(toast.id), 5000)
    return () => clearTimeout(temporizador)
  }, [toast.id, onCerrar])

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-[var(--radius-sm)] border border-l-4 border-[var(--color-borde)] px-4 py-3 shadow-[var(--shadow-md)] animate-subir ${bordePorTipo[toast.tipo]} ${fondoPorTipo[toast.tipo]}`}
      role="alert"
    >
      <span className="mt-px shrink-0">{iconoTipo(toast.tipo)}</span>
      <p className="min-w-0 flex-1 text-[14px] font-medium leading-snug">{toast.mensaje}</p>
      <button
        type="button"
        className="shrink-0 text-[18px] leading-none opacity-60 transition-opacity duration-150 hover:opacity-100"
        onClick={() => onCerrar(toast.id)}
        aria-label="Cerrar aviso"
      >
        ×
      </button>
    </div>
  )
}

function ToastHost({ toasts, onCerrar }: PropsToastHost) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[calc(var(--z-modal)+20)] flex w-[min(92vw,380px)] flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItemView key={toast.id} toast={toast} onCerrar={onCerrar} />
      ))}
    </div>
  )
}

export default ToastHost