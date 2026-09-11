import { useEffect, useMemo, useState } from 'react'
import { formatearPrecio } from '../../services/api'
import type { Producto, Tienda } from '../../types'
import { WhatsAppIcon } from '../icons'

interface PropsProductModal {
  producto: Producto
  tienda: Tienda
  onCerrar: () => void
  onAgregar: (item: {
    productoId: number
    nombre: string
    imagen: string
    precio: number
    color: string
    talle: string
    cantidad: number
  }) => void
}

const botonWhatsApp =
  'flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-[var(--radius-pill)] border-0 bg-[var(--color-whatsapp)] px-6 py-4 text-[16px] font-bold text-white transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(37,211,102,0.4)] hover:brightness-105'

const talleBase =
  'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3.5 py-2 text-[14px] font-semibold text-[var(--color-texto-suave)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-[var(--color-texto)] hover:text-[var(--color-texto)]'

const talleActivo = 'border-[var(--talle-color)] bg-[var(--talle-color)] text-white'

function ProductModal({ producto, tienda, onCerrar, onAgregar }: PropsProductModal) {
  const variantes = useMemo(() => producto.variantes ?? [], [producto.variantes])
  const colores = useMemo(() => [...new Set(variantes.map((v) => v.color))], [variantes])

  const [color, setColor] = useState('')
  const [talle, setTalle] = useState('')
  const [cantidad, setCantidad] = useState(1)

  const tallesDisponibles = useMemo(
    () => variantes.filter((v) => v.color === color).map((v) => v.talle),
    [variantes, color],
  )

  useEffect(() => {
    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar()
    }
    const overflowAnteriorHtml = document.documentElement.style.overflow
    const overflowAnteriorBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', manejarTecla)
    return () => {
      document.removeEventListener('keydown', manejarTecla)
      document.documentElement.style.overflow = overflowAnteriorHtml
      document.body.style.overflow = overflowAnteriorBody
    }
  }, [onCerrar])

  useEffect(() => {
    if (colores.length === 1) setColor(colores[0])
    else setColor('')
    setTalle('')
    setCantidad(1)
  }, [colores])

  useEffect(() => {
    setTalle(tallesDisponibles.length === 1 ? tallesDisponibles[0] : '')
  }, [tallesDisponibles])

  const puedeAgregar = color && talle && variantes.length > 0
  const enPromo = producto.precioPromocional !== undefined && producto.precioPromocional !== null

  function manejarAgregar() {
    if (!puedeAgregar) return
    onAgregar({
      productoId: producto.id,
      nombre: producto.nombre,
      imagen: producto.imagen,
      precio: enPromo ? producto.precioPromocional! : producto.precio,
      color,
      talle,
      cantidad,
    })
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-[rgba(15,15,25,0.6)] p-3 backdrop-blur-[6px] animate-aparecer md:p-5" onClick={onCerrar} role="presentation">
      <div
        className="flex max-h-[90vh] w-full max-w-[920px] flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-superficie)] shadow-[var(--shadow-lg)] animate-subir"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${producto.nombre}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-3.5 top-3.5 z-10 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/90 text-[16px] text-[var(--color-texto)] shadow-[var(--shadow-sm)] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:rotate-90 hover:scale-105"
          onClick={onCerrar}
          aria-label="Cerrar detalle"
        >
          ✕
        </button>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid-cols-2">
          <div className="bg-[#eeece6]">
            <img
              className="aspect-[4/3] max-h-[48vh] w-full object-cover md:aspect-[4/5] md:max-h-none md:h-full"
              src={producto.imagen}
              alt={producto.nombre}
            />
          </div>
          <div className="flex flex-col p-8">
            <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--color-texto-suave)]">
              {producto.categoriaNombre}
            </p>
            <h2 className="mb-3 text-[30px] tracking-[-0.02em]">{producto.nombre}</h2>
            {producto.descripcion && (
              <p className="mb-4 text-[15px] leading-relaxed text-[var(--color-texto-suave)]">{producto.descripcion}</p>
            )}
            <div className="mb-4">
              {enPromo && (
                <span className="mb-2 inline-block rounded-full bg-[#c0392b] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.04em] text-white">
                  {producto.promoBadge ?? 'Promo'}
                </span>
              )}
              {enPromo ? (
                <p className="flex flex-wrap items-baseline gap-2.5 text-[28px] font-bold">
                  <span className="text-[#c0392b]">{formatearPrecio(producto.precioPromocional!)}</span>
                  <span className="text-[18px] font-semibold text-[var(--color-texto-suave)] line-through">
                    {formatearPrecio(producto.precioAnterior ?? producto.precio)}
                  </span>
                </p>
              ) : (
                <p className="text-[28px] font-bold">{formatearPrecio(producto.precio)}</p>
              )}
            </div>

            {variantes.length === 0 && (
              <p className="mb-3 mt-1 text-[14px] text-[var(--color-texto-suave)]">
                Este producto aún no tiene talle y color cargados. Consultanos directamente por WhatsApp.
              </p>
            )}

            {variantes.length > 0 && (
              <>
                {colores.length > 1 && (
                  <div className="mb-[18px]">
                    <p className="mb-2.5 text-[14px] font-semibold">Color</p>
                    <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Elegir color">
                      {colores.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`${talleBase} ${color === c ? talleActivo : ''}`}
                          style={color === c ? { ['--talle-color' as string]: tienda.colorPrimario } : undefined}
                          onClick={() => setColor(c)}
                          aria-pressed={color === c}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-[18px]">
                  <p className="mb-2.5 text-[14px] font-semibold">Talle</p>
                  <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Elegir talle">
                    {tallesDisponibles.length === 0 ? (
                      <p className="mb-3 mt-1 text-[14px] text-[var(--color-texto-suave)]">
                        Elegí un color para ver los talles.
                      </p>
                    ) : (
                      tallesDisponibles.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`${talleBase} ${talle === t ? talleActivo : ''}`}
                          style={talle === t ? { ['--talle-color' as string]: tienda.colorPrimario } : undefined}
                          onClick={() => setTalle(t)}
                          aria-pressed={talle === t}
                        >
                          {t}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="mb-[18px]">
                  <p className="mb-2.5 text-[14px] font-semibold">Cantidad</p>
                  <div className="inline-flex items-center overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-borde)]">
                    <button
                      type="button"
                      className="h-12 w-12 border-0 bg-[var(--color-superficie)] text-[22px] text-[var(--color-texto)] transition-colors duration-200 hover:bg-[var(--color-fondo)]"
                      onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                      aria-label="Quitar uno"
                    >
                      −
                    </button>
                    <span className="min-w-12 text-center text-[16px] font-bold">{cantidad}</span>
                    <button
                      type="button"
                      className="h-12 w-12 border-0 bg-[var(--color-superficie)] text-[22px] text-[var(--color-texto)] transition-colors duration-200 hover:bg-[var(--color-fondo)]"
                      onClick={() => setCantidad((c) => Math.min(10, c + 1))}
                      aria-label="Sumar uno"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className={botonWhatsApp}
                  onClick={manejarAgregar}
                  disabled={!puedeAgregar}
                  style={!puedeAgregar ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                >
                  <span aria-hidden="true">
                    <WhatsAppIcon />
                  </span>
                  Agregar al carrito
                </button>
                <p className="mt-3.5 text-[13px] text-[var(--color-texto-suave)]">
                  Vas sumando prendas al carrito y al final cargás tus datos para enviar la consulta por WhatsApp.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductModal