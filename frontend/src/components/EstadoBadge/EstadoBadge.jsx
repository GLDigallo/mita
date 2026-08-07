import { etiquetaEstado } from '../../services/api'
import styles from './EstadoBadge.module.css'

const COLORES = {
  PENDIENTE: { fondo: '#fef3c7', texto: '#92400e' },
  EN_REVISION: { fondo: '#dbeafe', texto: '#1e40af' },
  ESPERANDO_CLIENTE: { fondo: '#ede9fe', texto: '#6d28d9' },
  CONFIRMADA: { fondo: '#dcfce7', texto: '#15803d' },
  CANCELADA: { fondo: '#fee2e2', texto: '#b91c1c' },
  FINALIZADA: { fondo: '#f3f4f6', texto: '#374151' },
  EN_PREPARACION: { fondo: '#ffedd5', texto: '#c2410c' },
  ENTREGADA: { fondo: '#ecfdf5', texto: '#047857' },
}

function EstadoBadge({ estado }) {
  const color = COLORES[estado] ?? { fondo: '#f3f4f6', texto: '#374151' }
  return (
    <span
      className={styles.badge}
      style={{ backgroundColor: color.fondo, color: color.texto }}
    >
      {etiquetaEstado(estado)}
    </span>
  )
}

export default EstadoBadge
