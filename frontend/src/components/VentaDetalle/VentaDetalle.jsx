import { useEffect, useState } from 'react'
import {
  cancelarVenta,
  entregarVenta,
  etiquetaMetodoPago,
  fetchVenta,
  formatearFecha,
  formatearPrecio,
} from '../../services/api'
import EstadoBadge from '../EstadoBadge/EstadoBadge'
import styles from './VentaDetalle.module.css'

function VentaDetalle({ ventaId, onCerrar, onActualizada, onEditar }) {
  const [venta, setVenta] = useState(null)
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

  async function ejecutar(operacion, mensajeError) {
    setAccionando(true)
    setError('')
    try {
      const actualizada = await operacion()
      setVenta(actualizada)
      onActualizada(actualizada)
    } catch (err) {
      setError(err.message ?? mensajeError)
    } finally {
      setAccionando(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onCerrar} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de venta"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className={styles.cerrarZona}>
          <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar detalle de venta">
            ✕
          </button>
        </div>

        {cargando && !venta ? (
          <div className={styles.cargando}>Cargando venta…</div>
        ) : (
          venta && (
            <>
              <header className={styles.encabezado}>
                <div>
                  <h2 className={styles.numero}>{venta.numero}</h2>
                  <p className={styles.fecha}>{venta.fechaVenta ? formatearFecha(venta.fechaVenta) : 'Venta en preparación'}</p>
                </div>
                <EstadoBadge estado={venta.estado} />
              </header>

              <section className={styles.seccion}>
                <div className={styles.grilla}>
                  <div>
                    <p className={styles.etiqueta}>Cliente</p>
                    <p className={styles.valor}>{venta.clienteNombre ?? 'Sin nombre'}</p>
                    <a className={styles.telefono} href={`tel:${venta.clienteTelefono}`}>
                      {venta.clienteTelefono}
                    </a>
                  </div>
                  <div>
                    <p className={styles.etiqueta}>Sucursal</p>
                    <p className={styles.valor}>{venta.tiendaNombre}</p>
                  </div>
                  <div>
                    <p className={styles.etiqueta}>Empleado</p>
                    <p className={styles.valor}>{venta.empleado}</p>
                  </div>
                  <div>
                    <p className={styles.etiqueta}>Consulta</p>
                    <p className={styles.valor}>{venta.consultaNumero}</p>
                  </div>
                </div>
              </section>

              <section className={styles.seccion}>
                <p className={styles.titulo}>
                  Productos ({venta.totalItems} unidad{venta.totalItems === 1 ? '' : 'es'})
                </p>
                <div className={styles.items}>
                  {venta.items.map((item) => (
                    <article key={item.id} className={styles.item}>
                      <img className={styles.itemImagen} src={item.productoImagen} alt={item.productoNombre} />
                      <div className={styles.itemCuerpo}>
                        <p className={styles.itemNombre}>{item.productoNombre}</p>
                        <p className={styles.itemDetalle}>
                          {item.color} · Talle {item.talle} · Cant. {item.cantidad}
                        </p>
                        <p className={styles.itemPrecio}>
                          {formatearPrecio(item.precioUnitario)} × {item.cantidad} ={' '}
                          <strong>{formatearPrecio(item.subtotal)}</strong>
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.seccion}>
                <div className={styles.totalFila}>
                  <div>
                    <p className={styles.etiqueta}>Método de pago</p>
                    <p className={styles.valor}>{venta.metodoPago ? etiquetaMetodoPago(venta.metodoPago) : '—'}</p>
                  </div>
                  <div className={styles.totalCaja}>
                    <p className={styles.etiqueta}>Total</p>
                    <p className={styles.totalImporte}>
                      {venta.importeTotal ? formatearPrecio(venta.importeTotal) : '—'}
                    </p>
                  </div>
                </div>
              </section>

              {error && <p className={styles.error}>{error}</p>}

              {(venta.estado === 'EN_PREPARACION' || venta.estado === 'CONFIRMADA') && (
                <footer className={styles.pie}>
                  {venta.estado === 'EN_PREPARACION' && (
                    <button
                      type="button"
                      className={styles.botonEditar}
                      onClick={() => onEditar(venta)}
                      disabled={accionando}
                    >
                      Editar venta
                    </button>
                  )}
                  {venta.estado === 'CONFIRMADA' && (
                    <button
                      type="button"
                      className={styles.botonEntregar}
                      onClick={() => ejecutar(() => entregarVenta(venta.id), 'No se pudo entregar la venta')}
                      disabled={accionando}
                    >
                      {accionando ? 'Procesando…' : 'Marcar como entregada'}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.botonCancelar}
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
  )
}

export default VentaDetalle
