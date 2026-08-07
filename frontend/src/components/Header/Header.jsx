import { Link } from 'react-router-dom'
import styles from './Header.module.css'

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.contenido}>
        <Link to="/" className={styles.marca} aria-label="Mitã — ir al inicio">
          <span className={styles.marcaTilde}>Mit</span>ã
        </Link>
      </div>
    </header>
  )
}

export default Header
