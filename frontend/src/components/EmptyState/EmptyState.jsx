import { Link } from 'react-router-dom'
import styles from './EmptyState.module.css'

function EmptyState({ titulo, texto, accion }) {
  return (
    <div className={styles.vacio}>
      <span className={styles.icono} aria-hidden="true">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
        </svg>
      </span>
      <h3 className={styles.titulo}>{titulo}</h3>
      <p className={styles.texto}>{texto}</p>
      {accion && (
        <Link to="/" className={styles.enlace}>
          {accion}
        </Link>
      )}
    </div>
  )
}

export default EmptyState
