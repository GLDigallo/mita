import { Link } from 'react-router-dom'
import NombreTienda from '../NombreTienda/NombreTienda'
import styles from './StoreCard.module.css'

function StoreCard({ tienda }) {
  return (
    <Link
      to={`/tienda/${tienda.slug}`}
      className={styles.tarjeta}
      aria-label={`${tienda.nombre} — ${tienda.etiquetaEdad}`}
    >
      <div className={styles.imagenContenedor}>
        <img
          className={styles.imagen}
          src={tienda.imagenHero}
          alt={`${tienda.nombre} — ${tienda.etiquetaEdad}`}
          loading="lazy"
        />
        <span className={styles.badge}>{tienda.etiquetaEdad}</span>
        <div className={styles.overlay}>
          <NombreTienda tienda={tienda} className={styles.nombre} />
        </div>
      </div>
    </Link>
  )
}

export default StoreCard
