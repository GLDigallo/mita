import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  alternarPromo,
  buscarProductos,
  crearPromo,
  eliminarPromo,
  fetchPromos,
  formatearPrecio,
} from '../../../services/api'
import type { Promo, TipoPromo } from '../../../services/api'
import type { Producto, Tienda } from '../../../types'

interface PropsPromosView {
  tiendas: Tienda[]
  usuario: unknown
}

const TIPOS_PROMO: { valor: TipoPromo; etiqueta: string; pideValor: boolean }[] = [
  { valor: 'PORCENTAJE', etiqueta: 'Descuento %', pideValor: true },
  { valor: 'MONTO', etiqueta: 'Descuento en $', pideValor: true },
  { valor: 'DOS_POR_UNO', etiqueta: '2x1', pideValor: false },
  { valor: 'ENVIO_GRATIS', etiqueta: 'Envío gratis', pideValor: false },
]

const input =
  'w-full min-h-12 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3.5 py-2.5 text-[15px] text-[var(--color-texto)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--gestion-color,var(--color-marca))] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--gestion-color,var(--color-marca))_15%,transparent)] focus:outline-none disabled:opacity-50'

const botonPeligro =
  'min-h-[38px] rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3.5 py-1.5 text-[13px] font-semibold text-[#c0392b] transition-colors duration-200 hover:border-[#c0392b]'

const botonCrear =
  'min-h-12 rounded-[var(--radius-sm)] border-0 bg-[var(--gestion-color,var(--color-marca))] px-5 text-[15px] font-bold text-white transition-opacity duration-200 hover:opacity-90'

function hoyISO() {
  const ahora = new Date()
  const offset = ahora.getTimezoneOffset() * 60000
  return new Date(ahora.getTime() - offset).toISOString().slice(0, 10)
}

function etiquetaTipo(promo: Promo): string {
  return TIPOS_PROMO.find((t) => t.valor === promo.tipo)?.etiqueta ?? promo.tipo
}

function formatearPromoFechas(fechaInicio: string, fechaFin: string): string {
  const corta = (iso: string) => {
    const parte = iso.slice(0, 10)
    const [anio, mes, dia] = parte.split('-')
    return `${dia}/${mes}/${anio}`
  }
  return `${corta(fechaInicio)} → ${corta(fechaFin)}`
}

function PromosView({ tiendas }: PropsPromosView) {
  const [promos, setPromos] = useState<Promo[]>([])
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState('')

  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<TipoPromo>('PORCENTAJE')
  const [valor, setValor] = useState('')
  const [tiendaSlug, setTiendaSlug] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const [tituloProd, setTituloProd] = useState('')
  const [tipoProd, setTipoProd] = useState<TipoPromo>('PORCENTAJE')
  const [valorProd, setValorProd] = useState('')
  const [fechaInicioProd, setFechaInicioProd] = useState('')
  const [fechaFinProd, setFechaFinProd] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<Producto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [producto, setProducto] = useState<Producto | null>(null)
  const [busquedaAbierta, setBusquedaAbierta] = useState(false)

  useEffect(() => {
    setFechaInicio(hoyISO())
    setFechaInicioProd(hoyISO())
    refetchPromos()
  }, [])

  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setResultados([])
      setBusquedaAbierta(false)
      return
    }
    if (producto) return
    setBuscando(true)
    const timer = setTimeout(async () => {
      try {
        const datos = await buscarProductos(busqueda.trim())
        setResultados(datos)
        setBusquedaAbierta(true)
      } catch {
        setResultados([])
      } finally {
        setBuscando(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [busqueda, producto])

  async function refetchPromos() {
    try {
      setPromos(await fetchPromos())
    } catch (err) {
      setAviso((err as Error).message)
    } finally {
      setCargando(false)
    }
  }

  function validarFechas(inicio: string, fin: string): string | null {
    if (!inicio || !fin) return 'Completá la fecha de inicio y de fin.'
    if (fin < inicio) return 'La fecha de fin no puede ser anterior a la de inicio.'
    return null
  }

  async function agregarTienda(evento: FormEvent) {
    evento.preventDefault()
    const errorFechas = validarFechas(fechaInicio, fechaFin)
    if (errorFechas) {
      setAviso(errorFechas)
      return
    }
    if (!titulo.trim()) {
      setAviso('Poné un nombre para la promo.')
      return
    }
    const entrada = TIPOS_PROMO.find((t) => t.valor === tipo)!
    try {
      await crearPromo({
        titulo: titulo.trim(),
        tipo,
        valor: entrada.pideValor ? Number(valor) || 0 : null,
        tiendaSlug: tiendaSlug || null,
        productoId: null,
        fechaInicio,
        fechaFin,
      })
      setAviso('Promo creada. Se activa y se da de baja sola según las fechas.')
      setTitulo('')
      setValor('')
      setTiendaSlug('')
      setFechaInicio(hoyISO())
      setFechaFin('')
      await refetchPromos()
    } catch (err) {
      setAviso((err as Error).message)
    }
  }

  async function agregarProducto(evento: FormEvent) {
    evento.preventDefault()
    const errorFechas = validarFechas(fechaInicioProd, fechaFinProd)
    if (errorFechas) {
      setAviso(errorFechas)
      return
    }
    if (!producto) {
      setAviso('Buscá y elegí el producto de la promo.')
      return
    }
    if (!tituloProd.trim()) {
      setAviso('Poné un nombre para la promo.')
      return
    }
    const entrada = TIPOS_PROMO.find((t) => t.valor === tipoProd)!
    try {
      await crearPromo({
        titulo: tituloProd.trim(),
        tipo: tipoProd,
        valor: entrada.pideValor ? Number(valorProd) || 0 : null,
        tiendaSlug: null,
        productoId: producto.id,
        fechaInicio: fechaInicioProd,
        fechaFin: fechaFinProd,
      })
      setAviso('Promo creada sobre el producto. Se activa y se da de baja sola según las fechas.')
      setTituloProd('')
      setValorProd('')
      setFechaInicioProd(hoyISO())
      setFechaFinProd('')
      setProducto(null)
      setBusqueda('')
      await refetchPromos()
    } catch (err) {
      setAviso((err as Error).message)
    }
  }

  async function alternar(id: number, activa: boolean) {
    try {
      await alternarPromo(id, activa)
      await refetchPromos()
    } catch (err) {
      setAviso((err as Error).message)
    }
  }

  async function eliminar(id: number) {
    try {
      await eliminarPromo(id)
      await refetchPromos()
    } catch (err) {
      setAviso((err as Error).message)
    }
  }

  function tiendaNombre(slug: string | null): string {
    if (!slug) return 'Todas las tiendas'
    return tiendas.find((t) => t.slug === slug)?.nombre ?? slug
  }

  const campoFechas = 'grid grid-cols-1 gap-2.5 md:grid-cols-2'

  return (
    <section className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] tracking-[-0.02em]">Promociones</h2>
        <p className="text-[13px] text-[var(--color-texto-suave)]">
          Cada promo tiene fecha de inicio y fin. Mientras esté vigente se refleja automáticamente en los precios de la tienda y al vencer se da de baja sola. 2x1 y Envío gratis se muestran como etiqueta sin cambiar el precio.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <form className="flex h-full flex-col gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-t-[3px] border-t-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4" onSubmit={agregarTienda}>
          <div className="flex flex-col gap-1">
            <h3 className="text-[16px] font-bold">Promo por tienda</h3>
            <p className="text-[12.5px] text-[var(--color-texto-suave)]">Vale para todos los productos de una tienda (o todas).</p>
          </div>

          <select
            className={input}
            value={tiendaSlug}
            onChange={(evento) => setTiendaSlug(evento.target.value)}
            aria-label="Tienda de la promo"
          >
            <option value="">Todas las tiendas</option>
            {tiendas.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.nombre}
              </option>
            ))}
          </select>

          <input
            className={input}
            type="text"
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
            placeholder="Nombre de la promo (ej: Semana del bebé)"
            aria-label="Nombre de la promo"
          />

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <select
              className={input}
              value={tipo}
              onChange={(evento) => setTipo(evento.target.value as TipoPromo)}
              aria-label="Tipo de promo"
            >
              {TIPOS_PROMO.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
            <input
              className={input}
              type="number"
              min="0"
              value={valor}
              onChange={(evento) => setValor(evento.target.value)}
              placeholder={tipo === 'PORCENTAJE' ? 'Porcentaje' : 'Monto en $'}
              aria-label="Valor de la promo"
              disabled={!TIPOS_PROMO.find((t) => t.valor === tipo)!.pideValor}
            />
          </div>

          <div className={campoFechas}>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-[var(--color-texto-suave)]">Desde</span>
              <input
                className={input}
                type="date"
                value={fechaInicio}
                onChange={(evento) => setFechaInicio(evento.target.value)}
                aria-label="Fecha de inicio"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-[var(--color-texto-suave)]">Hasta</span>
              <input
                className={input}
                type="date"
                value={fechaFin}
                onChange={(evento) => setFechaFin(evento.target.value)}
                aria-label="Fecha de fin"
                min={fechaInicio}
              />
            </label>
          </div>

          <button type="submit" className={botonCrear}>
            Crear promo
          </button>
        </form>

        <form className="flex h-full flex-col gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-t-[3px] border-t-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4" onSubmit={agregarProducto}>
          <div className="flex flex-col gap-1">
            <h3 className="text-[16px] font-bold">Promo por producto</h3>
            <p className="text-[12.5px] text-[var(--color-texto-suave)]">Buscá cualquier producto; su tienda ya figura y se toma sola.</p>
          </div>

          <div className="relative">
            <input
              className={input}
              type="search"
              value={producto ? producto.nombre : busqueda}
              onChange={(evento) => {
                if (producto) setProducto(null)
                setBusqueda(evento.target.value)
              }}
              placeholder="Buscar producto… (nombre)"
              aria-label="Buscar producto"
              onFocus={() => setBusquedaAbierta(true)}
              onBlur={() => setTimeout(() => setBusquedaAbierta(false), 180)}
            />
            {busquedaAbierta && !producto && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-borde)] bg-[var(--color-superficie)] shadow-[var(--shadow-lg)]">
                {buscando ? (
                  <p className="p-3.5 text-[13px] text-[var(--color-texto-suave)]">Buscando…</p>
                ) : resultados.length === 0 ? (
                  <p className="p-3.5 text-[13px] text-[var(--color-texto-suave)]">
                    Escribí al menos 2 letras para buscar.
                  </p>
                ) : (
                  resultados.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="flex w-full items-center gap-3 border-b border-[var(--color-borde)] p-2.5 text-left transition-colors duration-150 hover:bg-[var(--color-fondo)] last:border-b-0"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setProducto(p)
                        setResultados([])
                        setBusquedaAbierta(false)
                      }}
                    >
                      <img className="h-11 w-11 shrink-0 rounded-[var(--radius-sm)] bg-[#eeece6] object-cover" src={p.imagen} alt="" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold">{p.nombre}</p>
                        <p className="truncate text-[12.5px] text-[var(--color-texto-suave)]">{p.tiendaNombre} · {formatearPrecio(p.precio)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {producto && (
            <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-fondo)] p-2.5">
              <img className="h-12 w-12 shrink-0 rounded-[var(--radius-sm)] bg-[#eeece6] object-cover" src={producto.imagen} alt="" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold">{producto.nombre}</p>
                <p className="text-[12.5px] text-[var(--color-texto-suave)]">{producto.tiendaNombre}</p>
              </div>
              <button type="button" className="text-[13px] font-semibold text-[#c0392b]" onClick={() => setProducto(null)} aria-label="Quitar producto">
                Quitar
              </button>
            </div>
          )}

          <input
            className={input}
            type="text"
            value={tituloProd}
            onChange={(evento) => setTituloProd(evento.target.value)}
            placeholder="Nombre de la promo (ej: Sale de este vestido)"
            aria-label="Nombre de la promo"
          />

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <select
              className={input}
              value={tipoProd}
              onChange={(evento) => setTipoProd(evento.target.value as TipoPromo)}
              aria-label="Tipo de promo"
            >
              {TIPOS_PROMO.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
            <input
              className={input}
              type="number"
              min="0"
              value={valorProd}
              onChange={(evento) => setValorProd(evento.target.value)}
              placeholder={tipoProd === 'PORCENTAJE' ? 'Porcentaje' : 'Monto en $'}
              aria-label="Valor de la promo"
              disabled={!TIPOS_PROMO.find((t) => t.valor === tipoProd)!.pideValor}
            />
          </div>

          <div className={campoFechas}>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-[var(--color-texto-suave)]">Desde</span>
              <input
                className={input}
                type="date"
                value={fechaInicioProd}
                onChange={(evento) => setFechaInicioProd(evento.target.value)}
                aria-label="Fecha de inicio"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-[var(--color-texto-suave)]">Hasta</span>
              <input
                className={input}
                type="date"
                value={fechaFinProd}
                onChange={(evento) => setFechaFinProd(evento.target.value)}
                aria-label="Fecha de fin"
                min={fechaInicioProd}
              />
            </label>
          </div>

          <button type="submit" className={botonCrear}>
            Crear promo
          </button>
        </form>
      </div>

      {aviso && <p className="text-[13px] text-[var(--color-texto-suave)]">{aviso}</p>}

      {cargando ? (
        <p className="text-[14px] text-[var(--color-texto-suave)]">Cargando promos…</p>
      ) : promos.length === 0 ? (
        <p className="text-[14px] text-[var(--color-texto-suave)]">Todavía no hay promos. Creá la primera arriba.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {promos.map((promo) => (
            <article key={promo.id} className={`flex flex-col gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-l-[3px] border-l-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4 ${promo.activa ? '' : 'opacity-55'}`}>
              <div className="flex items-start gap-3">
                {promo.esDeProducto && promo.productoImagen && (
                  <img className="h-14 w-14 shrink-0 rounded-[var(--radius-sm)] bg-[#eeece6] object-cover" src={promo.productoImagen} alt="" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-[16px] font-bold">{promo.titulo}</h3>
                  <p className="mt-1 text-[13px] text-[var(--color-texto-suave)]">
                    {promo.esDeProducto ? `Producto: ${promo.productoNombre ?? '—'}` : `Tienda: ${tiendaNombre(promo.tiendaSlug)}`} · {formatearPromoFechas(promo.fechaInicio, promo.fechaFin)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: 'color-mix(in srgb, var(--gestion-color, var(--color-marca)) 12%, transparent)', color: 'var(--gestion-color, var(--color-marca))' }}>
                  {etiquetaTipo(promo)}{promo.valor != null && (promo.tipo === 'PORCENTAJE' || promo.tipo === 'MONTO') ? ` · ${promo.tipo === 'PORCENTAJE' ? promo.valor + '%' : formatearPrecio(promo.valor)}` : ''}
                </span>
                <span className={`text-[12px] font-bold ${promo.activa ? 'text-[#1faa52]' : 'text-[var(--color-texto-suave)]'}`}>
                  {promo.activa ? 'Vigente' : 'Desactivada'}
                </span>
              </div>
              <div className="flex gap-2">
                <button type="button" className="min-h-[38px] rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--color-texto)] transition-colors duration-200 hover:border-[var(--color-marca)] hover:text-[var(--color-marca)]" onClick={() => alternar(promo.id, !promo.activa)}>
                  {promo.activa ? 'Desactivar' : 'Activar'}
                </button>
                <button type="button" className={botonPeligro} onClick={() => eliminar(promo.id)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default PromosView