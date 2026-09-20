import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import type { Tienda } from '../../types'
import NombreTienda from '../NombreTienda/NombreTienda'

interface PropsStoreCard {
  tienda: Tienda
}

function StoreCard({ tienda }: PropsStoreCard) {
  const estiloCard = {
    '--primario': tienda.colorPrimario,
    '--secundario': tienda.colorSecundario,
  } as CSSProperties

  return (
    <Link
      to={`/tienda/${tienda.slug}`}
      className="group relative block overflow-hidden rounded-[var(--radius-lg)]"
      style={estiloCard}
      aria-label={`${tienda.nombre} — ${tienda.etiquetaEdad}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          className="h-full w-full object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.06]"
          src={tienda.imagenHero}
          alt={`${tienda.nombre} — ${tienda.etiquetaEdad}`}
          loading="lazy"
        />
        <span className="absolute left-1/2 top-3.5 max-w-full -translate-x-1/2 whitespace-nowrap text-[13px] font-bold text-white max-[479px]:text-[10.5px]">
          {tienda.etiquetaEdad}
        </span>
        <span className="absolute inset-x-0 bottom-3 flex items-end justify-center px-3 text-center">
          <NombreTienda
            tienda={tienda}
            className="text-[24px] max-[479px]:text-[22px] sm:text-[26px] md:text-[28px]"
          />
        </span>
      </div>
    </Link>
  )
}

export default StoreCard