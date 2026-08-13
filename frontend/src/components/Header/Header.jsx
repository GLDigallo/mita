import { Link } from 'react-router-dom'
import styles from './Header.module.css'

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.contenido}>
        <Link to="/" className={styles.marca} aria-label="AgrandaditosTienda — ir al inicio">
          Agrandaditos<span className={styles.marcaTilde}>Tienda</span>
        </Link>
      </div>
    </header>
  )
}

export default Header
