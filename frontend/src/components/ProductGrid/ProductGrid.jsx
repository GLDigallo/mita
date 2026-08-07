import ProductCard from '../ProductCard/ProductCard'
import styles from './ProductGrid.module.css'

function ProductGrid({ productos, onSeleccionar }) {
  if (productos.length === 0) {
    return (
      <p className={styles.vacio}>
        Todavía no hay prendas en esta categoría. ¡Volvé pronto!
      </p>
    )
  }

  return (
    <div className={styles.grid}>
      {productos.map((producto) => (
        <ProductCard key={producto.id} producto={producto} onSeleccionar={onSeleccionar} />
      ))}
    </div>
  )
}

export default ProductGrid
