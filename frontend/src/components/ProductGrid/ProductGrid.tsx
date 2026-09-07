import type { Producto } from '../../types'
import ProductCard from '../ProductCard/ProductCard'

interface PropsProductGrid {
  productos: Producto[]
  onSeleccionar: (producto: Producto) => void
  mensajeVacio?: string
}

function ProductGrid({ productos, onSeleccionar, mensajeVacio }: PropsProductGrid) {
  if (productos.length === 0) {
    return (
      <p className="py-10 text-center text-[15px] text-[var(--color-texto-suave)]">
        {mensajeVacio ?? 'Todavía no hay prendas en esta categoría. ¡Volvé pronto!'}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
      {productos.map((producto) => (
        <ProductCard key={producto.id} producto={producto} onSeleccionar={onSeleccionar} />
      ))}
    </div>
  )
}

export default ProductGrid