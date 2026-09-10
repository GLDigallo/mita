import { Link } from 'react-router-dom'
import type { Tienda } from '../../types'
import NombreTienda from '../NombreTienda/NombreTienda'

interface PropsStoreCard {
  tienda: Tienda
}

function StoreCard({ tienda }: PropsStoreCard) {
  return (
    <Link
      to={`/tienda/${tienda.slug}`}
      className="group relative block overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1.5 hover:shadow-[var(--shadow-md)]"
      aria-label={`${tienda.nombre} — ${tienda.etiquetaEdad}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-black">
        <img
          className="h-full w-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.06]"
          src={tienda.imagenHero}
          alt={`${tienda.nombre} — ${tienda.etiquetaEdad}`}
          loading="lazy"
        />
        <span className="absolute left-1/2 top-3 max-w-full -translate-x-1/2 whitespace-nowrap rounded-full border border-white/55 bg-black/60 px-2.5 py-1.5 text-[12.5px] font-bold text-white shadow-sm backdrop-blur-sm max-[479px]:px-2 max-[479px]:text-[9px] sm:px-3 sm:text-[13px]">
          {tienda.etiquetaEdad}
        </span>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center px-3 pb-3">
          <NombreTienda
            tienda={tienda}
            className="text-[24px] max-[479px]:text-[22px] sm:text-[26px] md:text-[28px]"
          />
        </div>
      </div>
    </Link>
  )
}

export default StoreCard