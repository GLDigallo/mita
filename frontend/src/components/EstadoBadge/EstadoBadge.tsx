import { etiquetaEstado } from '../../services/api'

const COLORES: Record<string, { fondo: string; texto: string }> = {
  CONFIRMADA: { fondo: '#dcfce7', texto: '#15803d' },
  CANCELADA: { fondo: '#fee2e2', texto: '#b91c1c' },
  FINALIZADA: { fondo: '#f3f4f6', texto: '#374151' },
  EN_PREPARACION: { fondo: '#ffedd5', texto: '#c2410c' },
  ENTREGADA: { fondo: '#ecfdf5', texto: '#047857' },
}

interface PropsEstadoBadge {
  estado: string
}

function EstadoBadge({ estado }: PropsEstadoBadge) {
  const color = COLORES[estado] ?? { fondo: '#f3f4f6', texto: '#374151' }
  return (
    <span
      className="inline-flex min-h-[26px] items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-bold tracking-[0.02em]"
      style={{ backgroundColor: color.fondo, color: color.texto }}
    >
      {etiquetaEstado(estado)}
    </span>
  )
}

export default EstadoBadge