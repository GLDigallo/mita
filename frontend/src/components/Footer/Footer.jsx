import { Link, useLocation } from 'react-router-dom'
import styles from './Footer.module.css'

function Footer({ tiendas = [] }) {
  const ubicacion = useLocation()
  const enTienda = ubicacion.pathname.startsWith('/tienda/')
  return (
    <footer className={styles.footer}>
      <div className={styles.contenido}>
        <div className={styles.columna}>
          <p className={styles.marca}>AgrandaditosTienda</p>
          <p className={styles.texto}>
            Las tiendas de moda para bebés, niños, niñas y adolescentes de Corrientes Capital.
          </p>
        </div>
        <div className={styles.columna}>
          <p className={styles.titulo}>Tiendas</p>
          <ul className={styles.lista}>
            {tiendas.map((tienda) => (
              <li key={tienda.id}>
                <Link to={`/tienda/${tienda.slug}`} className={styles.enlace}>
                  {tienda.nombre}
                  {!enTienda && <span className={styles.etiqueta}>{tienda.etiquetaEdad}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.columna}>
          <p className={styles.titulo}>Contacto</p>
          <p className={styles.texto}>Corrientes Capital, Argentina</p>
          <p className={styles.texto}>Lunes a sábado de 9:00 a 20:00</p>
        </div>
      </div>
      <div className={styles.pie}>
        <p>© {new Date().getFullYear()} AgrandaditosTienda · Todos los derechos reservados</p>
      </div>
    </footer>
  )
}

export default Footer
