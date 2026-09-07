import type { CSSProperties } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { Tienda } from '../../types'

interface PropsFooter {
  tiendas?: Tienda[]
  colorPrimario?: string
}

function Footer({ tiendas = [], colorPrimario }: PropsFooter) {
  const ubicacion = useLocation()
  const enTienda = ubicacion.pathname.startsWith('/tienda/')
  const estilo = (colorPrimario
    ? { '--marca-accent': colorPrimario }
    : undefined) as CSSProperties | undefined

  return (
    <footer
      className="mt-20 text-white"
      style={{
        ...estilo,
        background: `color-mix(in srgb, var(--marca-accent, var(--color-marca)) 24%, #0d0d22)`,
      }}
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-5 py-11 md:grid-cols-[2fr_1fr_1fr] md:gap-10 md:px-6 md:py-14">
        <div>
          <p className="mb-3 font-[var(--font-display)] text-[28px] font-bold text-[var(--marca-accent,#a5b4fc)]">
            AgrandaditosTienda
          </p>
          <p className="text-[15px] leading-[1.7] text-white/75">
            Las tiendas de moda para bebés, niños, niñas y adolescentes de Corrientes Capital.
          </p>
        </div>
        <div>
          <p className="mb-4 text-[15px] font-semibold uppercase tracking-[0.08em] text-[var(--marca-accent,#a5b4fc)]">
            Tiendas
          </p>
          <ul className="flex flex-col gap-2.5">
            {tiendas.map((tienda) => (
              <li key={tienda.id}>
                <Link
                  to={`/tienda/${tienda.slug}`}
                  className="font-medium text-white/90 transition-colors duration-200 hover:text-white"
                >
                  {tienda.nombre}
                  {!enTienda && (
                    <span className="block text-[13px] font-normal text-white/55">
                      {tienda.etiquetaEdad}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[15px] font-semibold uppercase tracking-[0.08em] text-[var(--marca-accent,#a5b4fc)]">
            Contacto
          </p>
          <p className="text-[15px] leading-[1.7] text-white/75">Corrientes Capital, Argentina</p>
          <p className="text-[15px] leading-[1.7] text-white/75">Lunes a sábado de 9:00 a 20:00</p>
        </div>
      </div>
      <div className="border-t border-white/12">
        <p className="mx-auto max-w-[1200px] px-5 py-4.5 text-[13px] text-white/45">
          © {new Date().getFullYear()} AgrandaditosTienda · Todos los derechos reservados
        </p>
      </div>
    </footer>
  )
}

export default Footer