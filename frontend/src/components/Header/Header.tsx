import type { CSSProperties } from 'react'
import { Link, useLocation } from 'react-router-dom'

interface PropsHeader {
  colorPrimario?: string
}

function Header({ colorPrimario }: PropsHeader) {
  const ubicacion = useLocation()
  const enInicio = ubicacion.pathname === '/'
  const estilo = (colorPrimario ? { '--marca': colorPrimario } : undefined) as CSSProperties | undefined

  const marcaClase =
    'font-[var(--font-display)] text-[32px] font-bold leading-tight tracking-[-0.5px] text-[var(--marca,#4f46e5)] transition-opacity duration-200 hover:opacity-80 md:text-[34px]'

  return (
    <header
      className="sticky top-0 z-[var(--z-header)] border-b border-[var(--color-borde)] bg-[rgba(247,246,243,0.85)] backdrop-blur-xl"
      style={estilo}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-center px-5 py-3.5 md:px-6 md:py-4">
        {enInicio ? (
          <span className={`${marcaClase} cursor-default`} aria-label="AgrandaditosTienda">
            Agrandaditos<span className="text-[var(--color-texto)]">Tienda</span>
          </span>
        ) : (
          <Link to="/" className={marcaClase} aria-label="AgrandaditosTienda — ir al inicio">
            Agrandaditos<span className="text-[var(--color-texto)]">Tienda</span>
          </Link>
        )}
      </div>
    </header>
  )
}

export default Header