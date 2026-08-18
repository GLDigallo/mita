import { formatearPrecio } from '../../services/api'
import styles from './ProductCard.module.css'

function ProductCard({ producto, onSeleccionar, mostrarTienda }) {
  return (
    <article className={styles.tarjeta}>
      <button
        type="button"
        className={styles.boton}
        onClick={() => onSeleccionar(producto)}
        aria-label={`Ver detalle de ${producto.nombre}`}
      >
        <div className={styles.imagenContenedor}>
          <img
            className={styles.imagen}
            src={producto.imagen}
            alt={producto.nombre}
            loading="lazy"
          />
          {producto.destacado && <span className={styles.badge}>Destacado</span>}
        </div>
        <div className={styles.cuerpo}>
          {mostrarTienda && producto.tiendaNombre && (
            <p className={styles.tienda}>{producto.tiendaNombre}</p>
          )}
          <p className={styles.categoria}>{producto.categoriaNombre}</p>
          <h3 className={styles.nombre}>{producto.nombre}</h3>
          <p className={styles.precio}>{formatearPrecio(producto.precio)}</p>
        </div>
      </button>
    </article>
  )
}

export default ProductCard
