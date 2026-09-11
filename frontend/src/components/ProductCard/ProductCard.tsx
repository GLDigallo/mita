import { formatearPrecio } from '../../services/api'
import type { Producto } from '../../types'

interface PropsProductCard {
  producto: Producto
  onSeleccionar: (producto: Producto) => void
  mostrarTienda?: boolean
}

function ProductCard({ producto, onSeleccionar, mostrarTienda }: PropsProductCard) {
  const enPromo = producto.precioPromocional !== undefined && producto.precioPromocional !== null

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-borde)] bg-[var(--color-superficie)] shadow-[var(--shadow-sm)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:shadow-[var(--shadow-md)]">
      <button
        type="button"
        className="flex w-full flex-1 flex-col p-0 text-left"
        onClick={() => onSeleccionar(producto)}
        aria-label={`Ver detalle de ${producto.nombre}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-[#eeece6]">
          <img
            className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.05]"
            src={producto.imagen}
            alt={producto.nombre}
            loading="lazy"
          />
          <span className="absolute left-0 top-3 flex flex-col gap-1.5">
            {producto.promoBadge && (
              <span
                className="w-fit rounded-r-full py-1.5 pl-2.5 pr-3.5 text-[12px] font-bold uppercase tracking-[0.04em] text-white shadow-sm"
                style={{ background: enPromo ? '#c0392b' : 'var(--color-texto)' }}
              >
                {producto.promoBadge}
              </span>
            )}
          </span>
          {producto.destacado && (
            <span className="absolute right-3 top-3 rounded-full bg-[var(--color-texto)] px-2.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.04em] text-white">
              Destacado
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          {mostrarTienda && producto.tiendaNombre && (
            <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[var(--color-primario,#6b5ce7)]">
              {producto.tiendaNombre}
            </p>
          )}
          <p className="mb-1.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-[var(--color-texto-suave)]">
            {producto.categoriaNombre}
          </p>
          <h3 className="mb-2 text-[16.5px] leading-[1.3]">{producto.nombre}</h3>
          <div className="mt-auto">
            {enPromo ? (
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-bold text-[#c0392b]">{formatearPrecio(producto.precioPromocional!)}</span>
                <span className="text-[14px] font-semibold text-[var(--color-texto-suave)] line-through">
                  {formatearPrecio(producto.precioAnterior ?? producto.precio)}
                </span>
              </div>
            ) : (
              <p className="text-[18px] font-bold">{formatearPrecio(producto.precio)}</p>
            )}
          </div>
        </div>
      </button>
    </article>
  )
}

export default ProductCard