import { useEffect, useState } from 'react'
import { crearConsulta, formatearPrecio } from '../../services/api'
import type { CarritoItem, Tienda } from '../../types'
import { WhatsAppIcon } from '../icons'

interface PropsCartModal {
  items: CarritoItem[]
  tienda: Tienda
  onCerrar: () => void
  onQuitar: (indice: number) => void
  onLimpiar: () => void
}

const botonWhatsApp =
  'flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-[var(--radius-pill)] border-0 bg-[var(--color-whatsapp)] px-6 py-4 text-[16px] font-bold text-white transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(37,211,102,0.4)] hover:brightness-105'

const inputBase =
  'w-full min-h-12 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] p-3 text-[15px] text-[var(--color-texto)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--color-marca)] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] focus:outline-none'

function CartModal({ items, tienda, onCerrar, onQuitar, onLimpiar }: PropsCartModal) {
  const [telefono, setTelefono] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState<{ consulta: { numero: string }; enlaceWhatsApp: string } | null>(null)

  const total = items.reduce((suma, item) => suma + item.precio * item.cantidad, 0)
  const puedeEnviar = telefono.trim() && items.length > 0 && !enviando

  useEffect(() => {
    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', manejarTecla)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', manejarTecla)
      document.body.style.overflow = ''
    }
  }, [onCerrar])

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault()
    if (!puedeEnviar) return
    setEnviando(true)
    setError('')
    try {
      const creada = await crearConsulta({
        tiendaSlug: tienda.slug,
        telefono: telefono.trim(),
        observaciones: observaciones.trim() || undefined,
        items: items.map((item) => ({
          productoId: item.productoId,
          color: item.color,
          talle: item.talle,
          cantidad: item.cantidad,
        })),
      })
      setResultado(creada)
      onLimpiar()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-[rgba(15,15,25,0.6)] p-3 backdrop-blur-[6px] animate-aparecer md:p-5" onClick={onCerrar} role="presentation">
      <div
        className="relative max-h-[90vh] w-full max-w-[960px] overflow-y-auto rounded-[var(--radius-lg)] bg-[var(--color-superficie)] shadow-[var(--shadow-lg)] animate-subir"
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        onClick={(evento) => evento.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-3.5 top-3.5 z-10 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/90 text-[16px] text-[var(--color-texto)] shadow-[var(--shadow-sm)] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:rotate-90 hover:scale-105"
          onClick={onCerrar}
          aria-label="Cerrar carrito"
        >
          ✕
        </button>

        {resultado ? (
          <div className="flex flex-col items-center p-12 text-center">
            <div className="mb-5 flex h-[84px] w-[84px] items-center justify-center rounded-full bg-[rgba(37,211,102,0.15)] text-[#1faa52]">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mb-2 text-[22px] font-bold">¡Consulta registrada!</p>
            <p className="mb-4 text-[30px] font-bold tracking-[-0.02em]">N° {resultado.consulta.numero}</p>
            <p className="mb-7 max-w-[420px] text-[15px] leading-[1.6] text-[var(--color-texto-suave)]">
              Tu consulta ya quedó registrada. Si tenés alguna duda o querés comunicarte con la tienda, podés escribirnos por WhatsApp.
            </p>
            <a
              className={botonWhatsApp}
              href={resultado.enlaceWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span aria-hidden="true">
                <WhatsAppIcon size={22} filled />
              </span>
              Escribinos por WhatsApp
            </a>
            <button
              type="button"
              className="mt-[18px] min-h-11 border-0 bg-transparent px-4 py-2 text-[15px] font-semibold text-[var(--color-texto-suave)] transition-colors duration-200 hover:text-[var(--color-texto)]"
              onClick={onCerrar}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="border-b border-[var(--color-borde)] p-8 md:border-b-0 md:border-r">
              <h3 className="mb-[18px] flex items-center gap-2 text-[18px] font-bold">
                Tu selección
                {items.length > 0 && (
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--color-marca)] px-1.5 text-[13px] font-bold text-white">
                    {items.length}
                  </span>
                )}
              </h3>

              {items.length === 0 ? (
                <p className="text-[15px] text-[var(--color-texto-suave)]">Todavía no elegiste productos.</p>
              ) : (
                <ul className="flex flex-col gap-3.5">
                  {items.map((item, indice) => (
                    <li key={`${item.productoId}-${item.color}-${item.talle}`} className="flex items-center gap-3.5">
                      <img className="h-16 w-16 shrink-0 rounded-[var(--radius-sm)] bg-[#eeece6] object-cover" src={item.imagen} alt={item.nombre} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold">{item.nombre}</p>
                        <p className="mt-0.5 text-[13px] text-[var(--color-texto-suave)]">
                          {item.color} · Talle {item.talle} · x{item.cantidad}
                        </p>
                        <p className="mt-0.5 text-[14px] font-bold">{formatearPrecio(item.precio * item.cantidad)}</p>
                      </div>
                      <button
                        type="button"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[15px] text-[var(--color-texto-suave)] transition-colors duration-200 hover:bg-[rgba(192,57,43,0.08)] hover:font-semibold hover:text-[#c0392b]"
                        onClick={() => onQuitar(indice)}
                        aria-label={`Quitar ${item.nombre}`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {items.length > 0 && (
                <div className="mt-5 flex items-center justify-between border-t border-[var(--color-borde)] pt-4">
                  <span className="text-[15px] text-[var(--color-texto-suave)]">Total estimado</span>
                  <strong className="text-[22px] font-bold">{formatearPrecio(total)}</strong>
                </div>
              )}
            </div>

            <form className="flex flex-col p-8" onSubmit={manejarEnvio}>
              <h3 className="mb-[18px] text-[18px] font-bold">Tus datos</h3>
              <p className="-mt-2 mb-[18px] text-[13px] leading-[1.6] text-[var(--color-texto-suave)]">
                Dejanos tu teléfono y si querés un comentario. Te respondemos por WhatsApp.
              </p>

              <div className="mb-[18px]">
                <label className="mb-2.5 block text-[14px] font-semibold" htmlFor="carrito-telefono">
                  Tu teléfono (WhatsApp)
                </label>
                <input
                  id="carrito-telefono"
                  className={inputBase}
                  type="tel"
                  value={telefono}
                  onChange={(evento) => setTelefono(evento.target.value)}
                  placeholder="+54 9 379 4 000000"
                  required
                />
              </div>

              <div className="mb-[18px]">
                <label className="mb-2.5 block text-[14px] font-semibold" htmlFor="carrito-observaciones">
                  Comentario (opcional)
                </label>
                <textarea
                  id="carrito-observaciones"
                  className={`${inputBase} resize-y`}
                  value={observaciones}
                  onChange={(evento) => setObservaciones(evento.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Ej.: talle específico, color que busco, etc."
                />
              </div>

              {error && <p className="mb-3.5 text-[14px] text-[#c0392b]">{error}</p>}

              <button
                type="submit"
                className={botonWhatsApp}
                disabled={!puedeEnviar}
                style={!puedeEnviar ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              >
                <span aria-hidden="true">
                  <WhatsAppIcon size={22} filled />
                </span>
                {enviando ? 'Enviando…' : 'Consultar por WhatsApp'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartModal