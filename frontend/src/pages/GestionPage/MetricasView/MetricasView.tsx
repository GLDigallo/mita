import { useState } from 'react'
import { ESTADOS_CONSULTA, ESTADOS_VENTA, formatearPrecio } from '../../../services/api'
import type { ConsultaLista, Tienda, VentaLista } from '../../../types'

interface PropsMetricasView {
  tiendas: Tienda[]
  consultas: ConsultaLista[]
  ventas: VentaLista[]
}

const RANGOS = [
  { valor: 'TODO', etiqueta: 'Todo' },
  { valor: 'HOY', etiqueta: 'Hoy' },
  { valor: 'SEMANA', etiqueta: 'Esta semana' },
  { valor: 'MES', etiqueta: 'Este mes' },
]

function dentroDeRango(fechaIso: string, rango: string): boolean {
  if (!fechaIso || rango === 'TODO') return true
  const fecha = new Date(fechaIso)
  const ahora = new Date()
  if (rango === 'HOY') return fecha.toDateString() === ahora.toDateString()
  if (rango === 'SEMANA') {
    const limite = new Date(ahora)
    limite.setDate(ahora.getDate() - 7)
    return fecha >= limite
  }
  if (rango === 'MES') {
    const limite = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    return fecha >= limite
  }
  return true
}

const titulo =
  'text-[22px] tracking-[-0.02em]'
const subtitulo =
  'text-[13px] text-[var(--color-texto-suave)]'

function MetricasView({ tiendas, consultas, ventas }: PropsMetricasView) {
  const [rango, setRango] = useState('TODO')

  const consultasFiltradas = consultas.filter((c) => dentroDeRango(c.fechaConsulta, rango))
  const ventasFiltradas = ventas.filter((v) => dentroDeRango(v.fechaVenta, rango))

  const pendientes = consultasFiltradas.filter((c) => c.estado === 'EN_PREPARACION').length
  const importeTotal = ventasFiltradas.reduce((suma, v) => suma + (v.importeTotal ?? 0), 0)

  const porTienda = tiendas.map((tienda) => {
    const ventasTienda = ventasFiltradas.filter((v) => v.tiendaNombre === tienda.nombre)
    return {
      tienda,
      consultas: consultasFiltradas.filter((c) => c.tiendaNombre === tienda.nombre).length,
      ventas: ventasTienda.length,
      importe: ventasTienda.reduce((suma, v) => suma + (v.importeTotal ?? 0), 0),
    }
  })

  const porEstadoConsulta = ESTADOS_CONSULTA.map((e) => ({
    ...e,
    cantidad: consultasFiltradas.filter((c) => c.estado === e.valor).length,
  }))

  const porEstadoVenta = ESTADOS_VENTA.map((e) => ({
    ...e,
    cantidad: ventasFiltradas.filter((v) => v.estado === e.valor).length,
  }))

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h2 className={titulo}>Métricas de tiendas</h2>
        <p className={subtitulo}>Prototipo: números en vivo de consultas y ventas.</p>
        <div className="mt-1.5 flex gap-1.5 self-start rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] p-1" role="group" aria-label="Rango de fechas">
          {RANGOS.map((r) => (
            <button
              key={r.valor}
              type="button"
              className={`min-h-[34px] rounded-full border-0 px-3.5 py-1 text-[13px] font-semibold transition-colors duration-200 ${
                rango === r.valor
                  ? 'bg-[var(--gestion-color,var(--color-marca))] text-[var(--gestion-texto,#fff)]'
                  : 'bg-transparent text-[var(--color-texto-suave)] hover:text-[var(--color-texto)]'
              }`}
              onClick={() => setRango(r.valor)}
            >
              {r.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-t-[3px] border-t-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4">
          <span className="font-[var(--font-display)] text-2xl font-bold text-[var(--gestion-color,var(--color-marca))]">{consultasFiltradas.length}</span>
          <span className="text-[13px] text-[var(--color-texto-suave)]">Consultas</span>
        </div>
        <div className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-t-[3px] border-t-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4">
          <span className="font-[var(--font-display)] text-2xl font-bold text-[var(--gestion-color,var(--color-marca))]">{pendientes}</span>
          <span className="text-[13px] text-[var(--color-texto-suave)]">En preparación</span>
        </div>
        <div className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-t-[3px] border-t-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4">
          <span className="font-[var(--font-display)] text-2xl font-bold text-[var(--gestion-color,var(--color-marca))]">{ventasFiltradas.length}</span>
          <span className="text-[13px] text-[var(--color-texto-suave)]">Ventas</span>
        </div>
        <div className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-t-[3px] border-t-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4">
          <span className="font-[var(--font-display)] text-2xl font-bold text-[var(--gestion-color,var(--color-marca))]">
            {importeTotal > 0 ? formatearPrecio(importeTotal) : '$0'}
          </span>
          <span className="text-[13px] text-[var(--color-texto-suave)]">Importe acumulado</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <h3 className="text-[16px] font-bold">Por tienda</h3>
        {porTienda.length === 0 ? (
          <p className="text-[14px] text-[var(--color-texto-suave)]">No hay tiendas cargadas.</p>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-borde)]">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-2 bg-[var(--color-superficie)] px-3.5 py-2.5 text-[12px] font-bold uppercase tracking-[0.04em] text-[var(--color-texto-suave)]">
              <span>Tienda</span>
              <span>Consultas</span>
              <span>Ventas</span>
              <span>Importe</span>
            </div>
            {porTienda.map((fila) => (
              <div key={fila.tienda.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-2 border-t border-[var(--color-borde)] px-3.5 py-2.5 text-[14px]">
                <span className="font-semibold">{fila.tienda.nombre}</span>
                <span>{fila.consultas}</span>
                <span>{fila.ventas}</span>
                <span>{fila.importe > 0 ? formatearPrecio(fila.importe) : '$0'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[16px] font-bold">Consultas por estado</h3>
          <div className="flex flex-col gap-1.5">
            {porEstadoConsulta.map((e) => (
              <div key={e.valor} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3.5 py-2.5 text-[14px]">
                <span className="text-[var(--color-texto-suave)]">{e.etiqueta}</span>
                <span className="font-bold">{e.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <h3 className="text-[16px] font-bold">Ventas por estado</h3>
          <div className="flex flex-col gap-1.5">
            {porEstadoVenta.map((e) => (
              <div key={e.valor} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3.5 py-2.5 text-[14px]">
                <span className="text-[var(--color-texto-suave)]">{e.etiqueta}</span>
                <span className="font-bold">{e.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MetricasView