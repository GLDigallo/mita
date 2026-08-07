import { formatearPrecio, ESTADOS_CONSULTA, etiquetaEstado } from '../../services/api'
import EstadoBadge from '../EstadoBadge/EstadoBadge'
import styles from './ConsultaDetalle.module.css'

function ConsultaDetalle({ consulta, onCerrar, onCambiarEstado, cambiandoEstado, onArmarVenta, onVerVenta }) {
  const estadosDisponibles = ESTADOS_CONSULTA.filter((e) => e.valor !== consulta.estado)
  const puedeArmarVenta = ['PENDIENTE', 'EN_REVISION', 'ESPERANDO_CLIENTE'].includes(consulta.estado)
  const tieneVentaConfirmada = consulta.estado === 'CONFIRMADA'

  return (
    <div className={styles.overlay} onClick={onCerrar} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={`Consulta ${consulta.numero}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar detalle">
          ✕
        </button>

        <header className={styles.encabezado}>
          <div>
            <h2 className={styles.numero}>{consulta.numero}</h2>
            <p className={styles.fecha}>{formatearFecha(consulta.fechaConsulta)}</p>
          </div>
          <EstadoBadge estado={consulta.estado} />
        </header>

        <section className={styles.seccion}>
          <p className={styles.tituloSeccion}>Cliente</p>
          <p className={styles.clienteNombre}>{consulta.clienteNombre ?? 'Sin nombre'}</p>
          <a className={styles.clienteTelefono} href={`tel:${consulta.clienteTelefono}`}>
            {consulta.clienteTelefono}
          </a>
          <p className={styles.tienda}>
            Tienda: <strong>{consulta.tiendaNombre}</strong>
          </p>
        </section>

        {consulta.observaciones && (
          <section className={styles.seccion}>
            <p className={styles.tituloSeccion}>Observaciones de la consulta</p>
            <p className={styles.texto}>{consulta.observaciones}</p>
          </section>
        )}

        <section className={styles.seccion}>
          <p className={styles.tituloSeccion}>
            Productos ({consulta.totalItems} unidad{consulta.totalItems === 1 ? '' : 'es'})
          </p>
          <div className={styles.items}>
            {consulta.productos.map((item) => (
              <article key={item.id} className={styles.item}>
                <img className={styles.itemImagen} src={item.productoImagen} alt={item.productoNombre} />
                <div className={styles.itemCuerpo}>
                  <p className={styles.itemNombre}>{item.productoNombre}</p>
                  <p className={styles.itemDetalle}>
                    Talle {item.talle}
                    {item.color ? ` · ${item.color}` : ''} · Cant. {item.cantidad}
                  </p>
                  <p className={styles.itemPrecio}>{formatearPrecio(item.precioUnitario)}</p>
                  {item.observaciones && <p className={styles.itemNota}>{item.observaciones}</p>}

                  {item.variantes.length > 0 && (
                    <div className={styles.stock}>
                      <p className={styles.stockTitulo}>Stock disponible</p>
                      <div className={styles.stockTabla} role="table" aria-label="Stock de variantes">
                        <div className={styles.stockFila} role="row">
                          <span role="columnheader">Color</span>
                          <span role="columnheader">Talle</span>
                          <span role="columnheader">Stock</span>
                        </div>
                        {item.variantes.map((variante) => (
                          <div className={styles.stockFila} role="row" key={variante.id}>
                            <span role="cell">{variante.color}</span>
                            <span role="cell">{variante.talle}</span>
                            <span role="cell" className={variante.stock <= 0 ? styles.stockAgotado : undefined}>
                              {variante.stock}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.seccion}>
          <p className={styles.tituloSeccion}>Venta</p>
          {puedeArmarVenta ? (
            <button type="button" className={styles.armarVenta} onClick={() => onArmarVenta(consulta)}>
              Armar venta
            </button>
          ) : tieneVentaConfirmada ? (
            <button type="button" className={styles.armarVenta} onClick={() => onVerVenta(consulta)}>
              Ver venta
            </button>
          ) : (
            <p className={styles.texto}>Esta consulta no admite generar una venta.</p>
          )}
        </section>

        <section className={styles.seccion}>
          <p className={styles.tituloSeccion}>Actualizar estado</p>
          <div className={styles.estados}>
            {estadosDisponibles.map((e) => (
              <button
                key={e.valor}
                type="button"
                className={styles.estadoBoton}
                onClick={() => onCambiarEstado(e.valor)}
                disabled={cambiandoEstado}
              >
                {etiquetaEstado(e.valor)}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function formatearFecha(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fechaIso))
}

export default ConsultaDetalle
