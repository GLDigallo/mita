import { Link, useLocation } from 'react-router-dom'
import styles from './Header.module.css'

function Header({ colorPrimario }) {
  const ubicacion = useLocation()
  const enInicio = ubicacion.pathname === '/'
  const estilo = colorPrimario ? { '--marca': colorPrimario } : undefined

  if (enInicio) {
    return (
      <header className={styles.header} style={estilo}>
        <div className={styles.contenido}>
          <span className={`${styles.marca} ${styles.marcaInicio}`} aria-label="AgrandaditosTienda">
            Agrandaditos<span className={styles.marcaTilde}>Tienda</span>
          </span>
        </div>
      </header>
    )
  }

  return (
    <header className={styles.header} style={estilo}>
      <div className={styles.contenido}>
        <Link to="/" className={styles.marca} aria-label="AgrandaditosTienda — ir al inicio">
          Agrandaditos<span className={styles.marcaTilde}>Tienda</span>
        </Link>
      </div>
    </header>
  )
}

export default Header
