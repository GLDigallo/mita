import { useEffect, useState } from 'react'
import {
  cancelarVenta,
  entregarVenta,
  etiquetaMetodoPago,
  fetchVenta,
  formatearFecha,
  formatearPrecio,
} from '../../services/api'
import type { VentaDetalle as VentaDetalleTipo } from '../../types'
import EstadoBadge from '../EstadoBadge/EstadoBadge'

interface PropsVentaDetalle {
  ventaId: number
  onCerrar: () => void
  onActualizada: (venta: VentaDetalleTipo) => void
}

const titulo =
  'text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--color-texto-suave)]'

function VentaDetalle({ ventaId, onCerrar, onActualizada }: PropsVentaDetalle) {
  const [venta, setVenta] = useState<VentaDetalleTipo | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [accionando, setAccionando] = useState(false)

  useEffect(() => {
    let activo = true
    setCargando(true)
    fetchVenta(ventaId)
      .then((datos) => {
        if (activo) setVenta(datos)
      })
      .catch(() => {})
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [ventaId])

  async function ejecutar(operacion: () => Promise<VentaDetalleTipo>, mensajeError: string) {
    setAccionando(true)
    setError('')
    try {
      const actualizada = await operacion()
      setVenta(actualizada)
      onActualizada(actualizada)
    } catch (err) {
      setError((err as Error).message ?? mensajeError)
    } finally {
      setAccionando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-[rgba(15,15,25,0.6)] p-3 backdrop-blur-[6px] animate-aparecer md:p-5" onClick={onCerrar} role="presentation">
      <div
        className="flex max-h-[92vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-superficie)] shadow-[var(--shadow-lg)] animate-subir"
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de venta"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="sticky top-0 z-[3] flex h-0 justify-end">
          <button
            type="button"
            className="absolute right-3.5 top-3.5 z-[2] flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/90 text-[16px] text-[var(--color-texto)] shadow-[var(--shadow-sm)] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:rotate-90 hover:scale-105"
            onClick={onCerrar}
            aria-label="Cerrar detalle de venta"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cargando && !venta ? (
            <div className="p-12 text-center text-[var(--color-texto-suave)]">Cargando venta…</div>
          ) : (
            venta && (
              <>
                <header className="sticky top-0 z-[1] flex items-start justify-between gap-3 border-b-2 border-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] px-5 pb-4 pr-16 pt-4">
                  <div>
                    <h2 className="text-[26px] tracking-[-0.02em] text-[var(--gestion-color,inherit)]">{venta.numero}</h2>
                    <p className="mt-1 text-[14px] text-[var(--color-texto-suave)]">
                      {venta.fechaVenta ? formatearFecha(venta.fechaVenta) : 'Venta en preparación'}
                    </p>
                  </div>
                  <EstadoBadge estado={venta.estado} />
                </header>

                <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className={`${titulo} mb-1`}>Cliente</p>
                      <p className="text-[15px] font-semibold">{venta.clienteNombre ?? 'Sin nombre'}</p>
                      <a className="text-[14px] font-semibold text-[var(--color-marca)]" href={`tel:${venta.clienteTelefono}`}>
                        {venta.clienteTelefono}
                      </a>
                    </div>
                    <div>
                      <p className={`${titulo} mb-1`}>Sucursal</p>
                      <p className="text-[15px] font-semibold">{venta.tiendaNombre}</p>
                    </div>
                    <div>
                      <p className={`${titulo} mb-1`}>Empleado</p>
                      <p className="text-[15px] font-semibold">{venta.empleado}</p>
                    </div>
                    <div>
                      <p className={`${titulo} mb-1`}>Consulta</p>
                      <p className="text-[15px] font-semibold">{venta.consultaNumero}</p>
                    </div>
                  </div>
                </section>

                <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
                  <p className={`${titulo} mb-3`}>
                    Productos ({venta.totalItems} unidad{venta.totalItems === 1 ? '' : 'es'})
                  </p>
                  <div className="flex flex-col gap-3">
                    {venta.items.map((item) => (
                      <article key={item.id} className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-borde)] bg-[var(--color-fondo)] p-3">
                        <img className="h-20 w-[60px] shrink-0 rounded-[var(--radius-sm)] object-cover" src={item.productoImagen} alt={item.productoNombre} />
                        <div className="min-w-0">
                          <p className="mb-1 text-[15px] font-bold">{item.productoNombre}</p>
                          <p className="mb-1 text-[14px] text-[var(--color-texto-suave)]">
                            {item.color} · Talle {item.talle} · Cant. {item.cantidad}
                          </p>
                          <p className="text-[14px]">
                            {formatearPrecio(item.precioUnitario)} × {item.cantidad} ={' '}
                            <strong>{formatearPrecio(item.subtotal)}</strong>
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`${titulo} mb-1`}>Método de pago</p>
                      <p className="text-[15px] font-semibold">{venta.metodoPago ? etiquetaMetodoPago(venta.metodoPago) : '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`${titulo} mb-1`}>Total</p>
                      <p className="text-[26px] font-bold tracking-[-0.02em]">
                        {venta.importeTotal ? formatearPrecio(venta.importeTotal) : '—'}
                      </p>
                    </div>
                  </div>
                </section>

                {error && <p className="px-5 py-3 text-[14px] text-[#c0392b]">{error}</p>}

                {(venta.estado === 'CONFIRMADA') && (
                  <footer className="flex flex-wrap justify-end gap-2.5 px-5 py-4">
                    <button
                      type="button"
                      className="min-h-[42px] rounded-full border-0 bg-[var(--color-marca)] px-4 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[var(--color-marca-oscuro)] disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => ejecutar(() => entregarVenta(venta.id), 'No se pudo entregar la venta')}
                      disabled={accionando}
                    >
                      {accionando ? 'Procesando…' : 'Marcar como entregada'}
                    </button>
                    <button
                      type="button"
                      className="min-h-[42px] rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-4 text-[14px] font-semibold text-[#c0392b] transition-colors duration-200 hover:border-[#c0392b] hover:bg-[#fee2e2] disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => ejecutar(() => cancelarVenta(venta.id), 'No se pudo cancelar la venta')}
                      disabled={accionando}
                    >
                      {accionando ? 'Procesando…' : 'Cancelar venta'}
                    </button>
                  </footer>
                )}
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default VentaDetalle