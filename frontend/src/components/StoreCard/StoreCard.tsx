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
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center bg-[linear-gradient(180deg,transparent_0%,rgba(15,15,25,0.4)_45%,rgba(15,15,25,0.7)_100%)] p-[48px_12px_12px]">
          <span className="inline-flex max-w-full items-center justify-center rounded-[var(--radius-md)] border border-black/10 bg-white/95 px-3.5 py-1.5 text-center shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
            <NombreTienda
              tienda={tienda}
              className="text-[24px] text-white max-[479px]:text-[22px] sm:text-[26px] md:text-[28px]"
            />
          </span>
        </div>
      </div>
    </Link>
  )
}

export default StoreCard