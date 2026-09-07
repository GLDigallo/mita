import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Tienda, Usuario } from '../../../types'

interface PropsPromosView {
  tiendas: Tienda[]
  usuario: Usuario | null
}

interface Promo {
  id: number
  titulo: string
  tipo: string
  valor: number | null
  tiendaSlug: string
  vigencia: string
  activa: boolean
}

const CLAVE_STORAGE = 'agrandaditostienda_promos_prototipo'

const TIPOS_PROMO = [
  { valor: 'PORCENTAJE', etiqueta: 'Descuento %' },
  { valor: 'MONTO', etiqueta: 'Descuento en $' },
  { valor: '2X1', etiqueta: '2x1' },
  { valor: 'ENVIO_GRATIS', etiqueta: 'Envío gratis' },
]

const PROMOS_INICIALES: Promo[] = [
  {
    id: 1,
    titulo: 'Semana del bebé',
    tipo: 'PORCENTAJE',
    valor: 20,
    tiendaSlug: 'mokositos-bebes',
    vigencia: 'agosto 2026',
    activa: true,
  },
  {
    id: 2,
    titulo: 'Vuelta a clases',
    tipo: 'MONTO',
    valor: 1500,
    tiendaSlug: 'mokositos-ninos',
    vigencia: 'agosto 2026',
    activa: true,
  },
  {
    id: 3,
    titulo: 'Moda preadolescente',
    tipo: '2X1',
    valor: null,
    tiendaSlug: 'agrandaditos',
    vigencia: 'todo el mes',
    activa: false,
  },
]

function cargarIniciales(): Promo[] {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE_STORAGE) ?? 'null') as Promo[] | null
    if (Array.isArray(guardadas)) return guardadas
  } catch {
    // se usan las de ejemplo
  }
  return PROMOS_INICIALES
}

const input =
  'w-full min-h-12 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3.5 py-2.5 text-[15px] text-[var(--color-texto)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--gestion-color,var(--color-marca))] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--gestion-color,var(--color-marca))_15%,transparent)] focus:outline-none disabled:opacity-50'

const botonPeligro =
  'min-h-[38px] rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3.5 py-1.5 text-[13px] font-semibold text-[#c0392b] transition-colors duration-200 hover:border-[#c0392b]'

function PromosView({ tiendas, usuario }: PropsPromosView) {
  const esEncargada = usuario?.rol === 'ENCARGADA'
  const miTiendaSlug = usuario?.tiendaSlug ?? ''
  const [promos, setPromos] = useState<Promo[]>(cargarIniciales)
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('PORCENTAJE')
  const [valor, setValor] = useState('')
  const [tiendaSlug, setTiendaSlug] = useState(esEncargada ? miTiendaSlug : '')
  const [vigencia, setVigencia] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(promos))
  }, [promos])

  function agregar(evento: FormEvent) {
    evento.preventDefault()
    if (!titulo.trim()) {
      setAviso('Poné un nombre para la promo.')
      return
    }
    const nueva: Promo = {
      id: Date.now(),
      titulo: titulo.trim(),
      tipo,
      valor: tipo === 'PORCENTAJE' || tipo === 'MONTO' ? Number(valor) || 0 : null,
      tiendaSlug,
      vigencia: vigencia.trim() || 'sin vigencia definida',
      activa: true,
    }
    setPromos((actuales) => [nueva, ...actuales])
    setTitulo('')
    setValor('')
    setVigencia('')
    setAviso('Promo creada (prototipo: se guarda solo en este navegador).')
  }

  function alternar(id: number) {
    setPromos((actuales) => actuales.map((p) => (p.id === id ? { ...p, activa: !p.activa } : p)))
  }

  function eliminar(id: number) {
    setPromos((actuales) => actuales.filter((p) => p.id !== id))
  }

  function etiquetaTipo(promo: Promo): string {
    return TIPOS_PROMO.find((t) => t.valor === promo.tipo)?.etiqueta ?? promo.tipo
  }

  function descripcion(promo: Promo): string {
    if (promo.tipo === 'PORCENTAJE') return `${promo.valor}% de descuento`
    if (promo.tipo === 'MONTO') return `$${promo.valor} de descuento`
    if (promo.tipo === '2X1') return 'Llevás 2, pagás 1'
    if (promo.tipo === 'ENVIO_GRATIS') return 'Envío gratis'
    return ''
  }

  function tiendaNombre(slug: string): string {
    if (!slug) return 'Todas las tiendas'
    return tiendas.find((t) => t.slug === slug)?.nombre ?? slug
  }

  return (
    <section className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-1">
        <h2 className="text-[22px] tracking-[-0.02em]">Promociones</h2>
        <p className="text-[13px] text-[var(--color-texto-suave)]">Prototipo: las promos se guardan solo en este navegador.</p>
      </div>

      <form className="flex flex-col gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-t-[3px] border-t-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4" onSubmit={agregar}>
        <input
          className={input}
          type="text"
          value={titulo}
          onChange={(evento) => setTitulo(evento.target.value)}
          placeholder="Nombre de la promo (ej: Semana del bebé)"
          aria-label="Nombre de la promo"
        />
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          <select
            className={input}
            value={tipo}
            onChange={(evento) => setTipo(evento.target.value)}
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
            disabled={tipo === '2X1' || tipo === 'ENVIO_GRATIS'}
          />
          <select
            className={input}
            value={tiendaSlug}
            onChange={(evento) => setTiendaSlug(evento.target.value)}
            aria-label="Tienda de la promo"
            disabled={esEncargada}
          >
            {!esEncargada && <option value="">Todas las tiendas</option>}
            {tiendas
              .filter((t) => !esEncargada || t.slug === miTiendaSlug)
              .map((t) => (
                <option key={t.id} value={t.slug}>
                  {t.nombre}
                </option>
              ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          <input
            className={input}
            type="text"
            value={vigencia}
            onChange={(evento) => setVigencia(evento.target.value)}
            placeholder="Vigencia (ej: agosto 2026)"
            aria-label="Vigencia de la promo"
          />
          <button type="submit" className="min-h-12 rounded-[var(--radius-sm)] border-0 bg-[var(--gestion-color,var(--color-marca))] px-5 text-[15px] font-bold text-white transition-opacity duration-200 hover:opacity-90">
            Crear promo
          </button>
        </div>
      </form>

      {aviso && <p className="text-[13px] text-[var(--color-texto-suave)]">{aviso}</p>}

      {promos.length === 0 ? (
        <p className="text-[14px] text-[var(--color-texto-suave)]">Todavía no hay promos. Creá la primera arriba.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {promos
            .filter((p) => !esEncargada || p.tiendaSlug === miTiendaSlug)
            .map((promo) => (
              <article key={promo.id} className={`flex flex-col gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-l-[3px] border-l-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4 ${promo.activa ? '' : 'opacity-55'}`}>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold">{promo.titulo}</h3>
                  <p className="mt-1 text-[13px] text-[var(--color-texto-suave)]">
                    {descripcion(promo)} · {tiendaNombre(promo.tiendaSlug)} · {promo.vigencia}
                  </p>
                </div>
                <span className="self-start rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: 'color-mix(in srgb, var(--gestion-color, var(--color-marca)) 12%, transparent)', color: 'var(--gestion-color, var(--color-marca))' }}>
                  {etiquetaTipo(promo)}
                </span>
                <div className="flex gap-2">
                  <button type="button" className="min-h-[38px] rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3.5 py-1.5 text-[13px] font-semibold text-[var(--color-texto)] transition-colors duration-200 hover:border-[var(--color-marca)] hover:text-[var(--color-marca)]" onClick={() => alternar(promo.id)}>
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