import ProductCard from '../ProductCard/ProductCard'
import styles from './ProductGrid.module.css'

function ProductGrid({ productos, onSeleccionar, mensajeVacio }) {
  if (productos.length === 0) {
    return <p className={styles.vacio}>{mensajeVacio ?? 'Todavía no hay prendas en esta categoría. ¡Volvé pronto!'}</p>
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
