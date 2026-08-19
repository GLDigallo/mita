import { useEffect, useState } from 'react'
import {
  actualizarNotaInterna,
  fetchProductos,
  formatearFecha,
  formatearPrecio,
  MOTIVOS_MODIFICACION,
  modificarConsulta,
} from '../../services/api'
import EstadoBadge from '../EstadoBadge/EstadoBadge'
import styles from './ConsultaDetalle.module.css'

function ConsultaDetalle({
  consulta,
  onCerrar,
  onCambiarEstado,
  cambiandoEstado,
  onCambiarFormaPago,
  onArmarVenta,
  onModificada,
}) {
  const [vista, setVista] = useState('actual')

  const [edicion, setEdicion] = useState([])
  const [productos, setProductos] = useState([])
  const [motivo, setMotivo] = useState('')
  const [observacionesEdicion, setObservacionesEdicion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [agregarAbierto, setAgregarAbierto] = useState(false)
  const [busquedaNuevo, setBusquedaNuevo] = useState('')
  const [nuevoProductoId, setNuevoProductoId] = useState('')
  const [nuevoCantidad, setNuevoCantidad] = useState(1)
  const [nuevoColor, setNuevoColor] = useState('')
  const [nuevoTalle, setNuevoTalle] = useState('')
  const [notaInterna, setNotaInterna] = useState(consulta?.notaInterna ?? '')
  const [guardandoNota, setGuardandoNota] = useState(false)

  useEffect(() => {
    if (vista !== 'editar') return
    setEdicion(
      consulta.productos?.map((item) => ({
        clave: String(item.id),
        productoId: item.productoId,
        varianteId: varianteActual(item),
        talle: item.talle,
        color: item.color,
        cantidad: item.cantidad,
        productoNombre: item.productoNombre,
        productoImagen: item.productoImagen,
        precioUnitario: item.precioUnitario,
        observaciones: item.observaciones ?? '',
        variantes: item.variantes ?? [],
      })),
    )
    setObservacionesEdicion(consulta.observaciones ?? '')
    let activo = true
    fetchProductos(consulta.tiendaSlug)
      .then((catalogo) => {
        if (activo) setProductos(catalogo)
      })
      .catch((err) => {
        if (activo) setError(err.message)
      })
    return () => {
      activo = false
    }
  }, [vista, consulta])

  function cambiarVariante(linea, varianteId) {
    const variante = linea.variantes.find((v) => v.id === varianteId)
    if (!variante) return
    setEdicion((actuales) =>
      actuales.map((l) =>
        l.clave === linea.clave
          ? { ...l, varianteId: variante.id, color: variante.color, talle: variante.talle }
          : l,
      ),
    )
  }

  function cambiarCantidad(linea, cantidad) {
    const valor = Math.min(Math.max(1, Number(cantidad) || 1), 99)
    setEdicion((actuales) => actuales.map((l) => (l.clave === linea.clave ? { ...l, cantidad: valor } : l)))
  }

  function cambiarNota(linea, observaciones) {
    setEdicion((actuales) =>
      actuales.map((l) => (l.clave === linea.clave ? { ...l, observaciones } : l)),
    )
  }

  function quitar(linea) {
    setEdicion((actuales) => actuales.filter((l) => l.clave !== linea.clave))
  }

  function agregarProducto() {
    if (!nuevoProductoId) {
      setError('Seleccioná un producto para agregar')
      return
    }
    const producto = productos.find((p) => p.id === Number(nuevoProductoId))
    if (!producto) {
      setError('Producto inválido')
      return
    }
    const variante = producto.variantes.find(
      (v) => v.color === nuevoColor && v.talle === nuevoTalle && v.stock > 0,
    )
    if (!variante) {
      setError('Elegí color y talle con stock disponible')
      return
    }
    const cantidad = Math.min(Math.max(1, Number(nuevoCantidad) || 1), variante.stock || 1)
    const linea = {
      clave: `nuevo-${Date.now()}-${variante.id}`,
      productoId: producto.id,
      varianteId: variante.id,
      talle: variante.talle,
      color: variante.color,
      cantidad,
      productoNombre: producto.nombre,
      productoImagen: producto.imagen,
      precioUnitario: producto.precio,
      observaciones: '',
      variantes: producto.variantes,
    }
    setEdicion((actuales) => [...actuales, linea])
    setNuevoColor('')
    setNuevoTalle('')
    setNuevoCantidad(1)
    setError('')
  }

  async function guardar() {
    if (!motivo) {
      setError('Elegí el motivo de la modificación')
      return
    }
    if (edicion.length === 0) {
      setError('La consulta debe tener al menos un producto')
      return
    }
    setGuardando(true)
    setError('')
    try {
      const actualizada = await modificarConsulta(consulta.id, {
        motivo,
        observaciones: observacionesEdicion.trim() || null,
        items: edicion.map((l) => ({
          productoId: l.productoId,
          color: l.color,
          talle: l.talle,
          cantidad: l.cantidad,
          observaciones: l.observaciones.trim() || null,
        })),
      })
      setMotivo('')
      setVista('actual')
      onModificada(actualizada)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function guardarNotaInterna() {
    setGuardandoNota(true)
    try {
      const actualizada = await actualizarNotaInterna(consulta.id, notaInterna.trim() || null)
      onModificada(actualizada)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardandoNota(false)
    }
  }

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busquedaNuevo.trim().toLowerCase()),
  )
  const productoSeleccionado = productos.find((p) => p.id === Number(nuevoProductoId))
  const variantesDisponibles = (productoSeleccionado?.variantes ?? []).filter((v) => v.stock > 0)
  const coloresDisponibles = [...new Set(variantesDisponibles.map((v) => v.color))]
  const tallesDisponibles = nuevoColor
    ? [...new Set(variantesDisponibles.filter((v) => v.color === nuevoColor).map((v) => v.talle))]
    : [...new Set(variantesDisponibles.map((v) => v.talle))]

  return (
    <div className={styles.overlay} onClick={onCerrar} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={`Consulta ${consulta.numero}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className={styles.cerrarZona}>
          <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar detalle">
            ✕
          </button>
        </div>

        {vista !== 'actual' && (
          <header className={styles.encabezado}>
            <div>
              <button type="button" className={styles.volver} onClick={() => setVista('actual')}>
                ← Volver
              </button>
              <h2 className={styles.numero}>Editar consulta</h2>
              <p className={styles.fecha}>{consulta.numero}</p>
            </div>
          </header>
        )}

        {vista === 'actual' && (
          <>
            <VistaActual
              consulta={consulta}
              cambiandoEstado={cambiandoEstado}
              onCambiarEstado={onCambiarEstado}
              onCambiarFormaPago={onCambiarFormaPago}
              onArmarVenta={onArmarVenta}
              onEditar={() => {
                setError('')
                setVista('editar')
              }}
              notaInterna={notaInterna}
              onNotaInternaChange={setNotaInterna}
              onGuardarNota={guardarNotaInterna}
              guardandoNota={guardandoNota}
            />
          </>
        )}

        {vista === 'editar' && (
          <VistaEditar
            edicion={edicion}
            motivo={motivo}
            setMotivo={setMotivo}
            observacionesEdicion={observacionesEdicion}
            setObservacionesEdicion={setObservacionesEdicion}
            productosFiltrados={productosFiltrados}
            productoSeleccionado={productoSeleccionado}
            variantesDisponibles={variantesDisponibles}
            coloresDisponibles={coloresDisponibles}
            tallesDisponibles={tallesDisponibles}
            agregarAbierto={agregarAbierto}
            setAgregarAbierto={setAgregarAbierto}
            busquedaNuevo={busquedaNuevo}
            setBusquedaNuevo={setBusquedaNuevo}
            nuevoProductoId={nuevoProductoId}
            setNuevoProductoId={setNuevoProductoId}
            nuevoColor={nuevoColor}
            setNuevoColor={setNuevoColor}
            nuevoTalle={nuevoTalle}
            setNuevoTalle={setNuevoTalle}
            nuevoCantidad={nuevoCantidad}
            setNuevoCantidad={setNuevoCantidad}
            guardando={guardando}
            error={error}
            onCambiarVariante={cambiarVariante}
            onCambiarCantidad={cambiarCantidad}
            onCambiarNota={cambiarNota}
            onQuitar={quitar}
            onAgregarProducto={agregarProducto}
            onGuardar={guardar}
            onCancelar={() => {
              setError('')
              setVista('actual')
            }}
          />
        )}
      </div>
    </div>
  )
}

function varianteActual(item) {
  const variante = (item.variantes ?? []).find((v) => v.color === item.color && v.talle === item.talle)
  return variante ? variante.id : ''
}

function VistaActual({
  consulta,
  cambiandoEstado,
  onCambiarEstado,
  onCambiarFormaPago,
  onArmarVenta,
  onEditar,
  notaInterna,
  onNotaInternaChange,
  onGuardarNota,
  guardandoNota,
}) {
  const esCerrada = ['CONFIRMADA', 'CANCELADA', 'FINALIZADA'].includes(consulta?.estado)
  return (
    <>
      <header className={styles.encabezado}>
        <div>
          <div className={styles.numeroFila}>
            <h2 className={styles.numero}>{consulta.numero}</h2>
            {consulta.version > 0 && <span className={styles.versionMini}>v{consulta.version + 1}</span>}
          </div>
          <p className={styles.fecha}>{formatearFecha(consulta.fechaConsulta)}</p>
        </div>
        <EstadoBadge estado={consulta.estado} />
      </header>

      <section className={styles.seccion}>
        <p className={styles.tituloSeccion}>Cliente</p>
        <p className={styles.clienteNombre}>{consulta.clienteNombre ?? 'Sin nombre'}</p>
        <div className={styles.contactoFila}>
          <a className={styles.clienteTelefono} href={`tel:${consulta.clienteTelefono}`}>
            {consulta.clienteTelefono}
          </a>
          <a
            className={styles.whatsappBtn}
            href={`https://wa.me/${(consulta.clienteTelefono ?? '').replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </div>
        <p className={styles.tienda}>
          Tienda: <strong>{consulta.tiendaNombre}</strong>
        </p>
      </section>

      {consulta.observaciones && (
        <section className={styles.seccion}>
          <p className={styles.tituloSeccion}>Observaciones</p>
          <p className={styles.texto}>{consulta.observaciones}</p>
        </section>
      )}

      <section className={styles.seccion}>
        <p className={styles.tituloSeccion}>Nota interna</p>
        <p className={styles.notaInternaSub}>Solo la ves vos. No se envía al cliente por WhatsApp.</p>
        <textarea
          className={styles.notaInternaInput}
          value={notaInterna}
          onChange={(e) => onNotaInternaChange(e.target.value)}
          placeholder="Ej: Cliente pidió que lo llamen después de las 18hs..."
          rows={3}
        />
        {(notaInterna ?? '') !== (consulta.notaInterna ?? '') && (
          <button
            type="button"
            className={styles.notaInternaBtn}
            onClick={onGuardarNota}
            disabled={guardandoNota}
          >
            {guardandoNota ? 'Guardando…' : 'Guardar nota'}
          </button>
        )}
      </section>

      <section className={styles.seccion}>
        <p className={styles.tituloSeccion}>
          Productos ({consulta.totalItems} unidad{consulta.totalItems === 1 ? '' : 'es'})
        </p>
        <div className={styles.items}>
          {(consulta.productos ?? []).map((item) => (
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

                {(item.variantes ?? []).length > 0 && (
                  <div className={styles.stock}>
                    <p className={styles.stockTitulo}>Stock disponible</p>
                    <div className={styles.stockTabla} role="table" aria-label="Stock de variantes">
                      <div className={styles.stockFila} role="row">
                        <span role="columnheader">Color</span>
                        <span role="columnheader">Talle</span>
                        <span role="columnheader">Stock</span>
                      </div>
                      {(item.variantes ?? []).map((variante) => (
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

      <footer className={styles.pie}>
        {!esCerrada && (
          <div className={styles.pieFila}>
            <div className={styles.piePago}>
              <span className={styles.piePagoEtiqueta}>Pago</span>
              <div className={styles.pagoOpciones}>
                <button
                  type="button"
                  className={`${styles.pagoOpcion} ${consulta.formaPago === 'EFECTIVO' ? styles.pagoOpcionActivo : ''}`}
                  onClick={() => onCambiarFormaPago('EFECTIVO')}
                  disabled={cambiandoEstado}
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  className={`${styles.pagoOpcion} ${consulta.formaPago === 'TARJETA' ? styles.pagoOpcionActivo : ''}`}
                  onClick={() => onCambiarFormaPago('TARJETA')}
                  disabled={cambiandoEstado}
                >
                  Tarjeta
                </button>
                <button
                  type="button"
                  className={`${styles.pagoOpcion} ${consulta.formaPago === 'DIGITAL' ? styles.pagoOpcionActivo : ''}`}
                  onClick={() => onCambiarFormaPago('DIGITAL')}
                  disabled={cambiandoEstado}
                >
                  Digital
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.pieFila}>
          {!esCerrada && !consulta?.ventaAsociada && consulta?.editable && (
            <button
              type="button"
              className={`${styles.pieBoton} ${styles.pieBotonExitoso}`}
              onClick={() => onArmarVenta(consulta)}
            >
              Armar venta
            </button>
          )}

          {consulta?.ventaAsociada === 'EN_PREPARACION' && (
            <>
              <button
                type="button"
                className={`${styles.pieBoton} ${styles.pieBotonExitoso}`}
                onClick={() => onCambiarEstado('CONFIRMADA')}
                disabled={cambiandoEstado}
              >
                Confirmar venta
              </button>
              <button
                type="button"
                className={`${styles.pieBoton} ${styles.pieBotonCancelar}`}
                onClick={() => onCambiarEstado('CANCELADA')}
                disabled={cambiandoEstado}
              >
                Cancelar
              </button>
            </>
          )}

          {consulta?.ventaAsociada === 'CONFIRMADA' && (
            <>
              <button
                type="button"
                className={`${styles.pieBoton} ${styles.pieBotonExitoso}`}
                onClick={() => onCambiarEstado('FINALIZADA')}
                disabled={cambiandoEstado}
              >
                Entregado
              </button>
              <button
                type="button"
                className={`${styles.pieBoton} ${styles.pieBotonCancelar}`}
                onClick={() => onCambiarEstado('CANCELADA')}
                disabled={cambiandoEstado}
              >
                Cancelar
              </button>
              {consulta?.editable && (
                <button type="button" className={styles.pieBoton} onClick={onEditar}>
                  Editar consulta
                </button>
              )}
            </>
          )}

          {consulta?.ventaAsociada === 'CANCELADA' && consulta?.editable && (
            <button type="button" className={styles.pieBoton} onClick={onEditar}>
              Editar consulta
            </button>
          )}
        </div>
      </footer>
    </>
  )
}

function VistaEditar({
  edicion,
  motivo,
  setMotivo,
  observacionesEdicion,
  setObservacionesEdicion,
  productosFiltrados,
  productoSeleccionado,
  variantesDisponibles,
  coloresDisponibles,
  tallesDisponibles,
  agregarAbierto,
  setAgregarAbierto,
  busquedaNuevo,
  setBusquedaNuevo,
  nuevoProductoId,
  setNuevoProductoId,
  nuevoColor,
  setNuevoColor,
  nuevoTalle,
  setNuevoTalle,
  nuevoCantidad,
  setNuevoCantidad,
  guardando,
  error,
  onCambiarVariante,
  onCambiarCantidad,
  onCambiarNota,
  onQuitar,
  onAgregarProducto,
  onGuardar,
  onCancelar,
}) {
  return (
    <>
      <section className={styles.seccion}>
        <p className={styles.tituloSeccion}>Motivo de la modificación</p>
        <select
          className={styles.select}
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
          aria-label="Motivo de la modificación"
        >
          <option value="">Seleccioná el motivo…</option>
          {MOTIVOS_MODIFICACION.map((m) => (
            <option key={m.valor} value={m.valor}>
              {m.etiqueta}
            </option>
          ))}
        </select>
      </section>

      <section className={styles.seccion}>
        <div className={styles.seccionTitulo}>
          <p className={styles.tituloSeccion}>Productos</p>
          <button type="button" className={styles.agregarBoton} onClick={() => setAgregarAbierto((v) => !v)}>
            {agregarAbierto ? 'Cerrar búsqueda' : 'Agregar producto'}
          </button>
        </div>

        {agregarAbierto && (
          <div className={styles.agregador}>
            <input
              className={styles.input}
              type="search"
              value={busquedaNuevo}
              onChange={(evento) => {
                setBusquedaNuevo(evento.target.value)
                setNuevoProductoId('')
                setNuevoColor('')
                setNuevoTalle('')
              }}
              placeholder="Buscar producto de la tienda…"
              aria-label="Buscar producto para agregar"
            />

            {!nuevoProductoId && productosFiltrados.length > 0 && (
              <div className={styles.productoGrilla}>
                {productosFiltrados.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={styles.productoCard}
                    onClick={() => {
                      setNuevoProductoId(String(p.id))
                      setNuevoColor('')
                      setNuevoTalle('')
                    }}
                  >
                    <img className={styles.productoCardImg} src={p.imagen} alt={p.nombre} />
                    <span className={styles.productoCardNombre}>{p.nombre}</span>
                    <span className={styles.productoCardPrecio}>{formatearPrecio(p.precio)}</span>
                  </button>
                ))}
              </div>
            )}

            {!nuevoProductoId && productosFiltrados.length === 0 && busquedaNuevo && (
              <p className={styles.texto}>No se encontraron productos.</p>
            )}

            {productoSeleccionado && (
              <>
                <div className={styles.agregadorPreview}>
                  <img className={styles.agregadorPreviewImg} src={productoSeleccionado.imagen} alt={productoSeleccionado.nombre} />
                  <div>
                    <p className={styles.agregadorPreviewNombre}>{productoSeleccionado.nombre}</p>
                    <p className={styles.agregadorPreviewPrecio}>{formatearPrecio(productoSeleccionado.precio)}</p>
                  </div>
                  <button type="button" className={styles.agregadorPreviewLimpiar} onClick={() => { setNuevoProductoId(''); setNuevoColor(''); setNuevoTalle('') }}>
                    ✕
                  </button>
                </div>

                {coloresDisponibles.length > 0 && (
                  <div className={styles.agregadorGrupo}>
                    <p className={styles.agregadorGrupoTitulo}>Color</p>
                    <div className={styles.agregadorBotones}>
                      {coloresDisponibles.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`${styles.agregadorBtn} ${nuevoColor === c ? styles.agregadorBtnActivo : ''}`}
                          onClick={() => { setNuevoColor(c); setNuevoTalle('') }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {nuevoColor && tallesDisponibles.length > 0 && (
                  <div className={styles.agregadorGrupo}>
                    <p className={styles.agregadorGrupoTitulo}>Talle</p>
                    <div className={styles.agregadorBotones}>
                      {tallesDisponibles.map((t) => {
                        const variante = variantesDisponibles.find((v) => v.color === nuevoColor && v.talle === t)
                        return (
                          <button
                            key={t}
                            type="button"
                            className={`${styles.agregadorBtn} ${nuevoTalle === t ? styles.agregadorBtnActivo : ''} ${variante && variante.stock <= 3 ? styles.agregadorBtnPoco : ''}`}
                            onClick={() => setNuevoTalle(t)}
                            disabled={!variante || variante.stock <= 0}
                          >
                            {t}
                            {variante && variante.stock <= 3 && variante.stock > 0 && (
                              <span className={styles.agregadorBtnStock}>{variante.stock}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {nuevoColor && nuevoTalle && (
                  <div className={styles.agregadorGrupo}>
                    <div className={styles.agregadorCantidad}>
                      <button
                        type="button"
                        className={styles.agregadorCantidadBtn}
                        onClick={() => setNuevoCantidad((c) => Math.max(1, c - 1))}
                      >
                        −
                      </button>
                      <span className={styles.agregadorCantidadValor}>{nuevoCantidad}</span>
                      <button
                        type="button"
                        className={styles.agregadorCantidadBtn}
                        onClick={() => {
                          const max = variantesDisponibles.find((v) => v.color === nuevoColor && v.talle === nuevoTalle)?.stock ?? 10
                          setNuevoCantidad((c) => Math.min(max, c + 1))
                        }}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className={styles.botonPrimario}
                        onClick={onAgregarProducto}
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {edicion.length === 0 ? (
          <p className={styles.sinItems}>La consulta no tiene productos todavía.</p>
        ) : (
          <div className={styles.items}>
            {edicion.map((linea) => (
              <article key={linea.clave} className={styles.item}>
                <img className={styles.itemImagen} src={linea.productoImagen} alt={linea.productoNombre} />
                <div className={styles.itemCuerpo}>
                  <p className={styles.itemNombre}>{linea.productoNombre}</p>
                  <div className={styles.itemControles}>
                    <select
                      className={styles.select}
                      value={linea.varianteId}
                      onChange={(evento) => onCambiarVariante(linea, Number(evento.target.value))}
                      disabled={guardando || linea.variantes.length === 0}
                      aria-label="Color y talle"
                    >
                      <option value="">
                        {linea.variantes.length === 0 ? 'Sin variantes' : 'Color · Talle…'}
                      </option>
                      {linea.variantes.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.color} · {v.talle}
                        </option>
                      ))}
                    </select>
                    <label className={styles.cantidadLabel}>
                      Cant.
                      <input
                        className={styles.inputCantidad}
                        type="number"
                        min="1"
                        max="99"
                        value={linea.cantidad}
                        onChange={(evento) => onCambiarCantidad(linea, evento.target.value)}
                        disabled={guardando}
                        aria-label="Cantidad"
                      />
                    </label>
                  </div>
                  <input
                    className={styles.inputNota}
                    type="text"
                    value={linea.observaciones}
                    onChange={(evento) => onCambiarNota(linea, evento.target.value)}
                    disabled={guardando}
                    placeholder="Nota del producto (opcional)"
                    aria-label={`Nota de ${linea.productoNombre}`}
                  />
                </div>
                <button
                  type="button"
                  className={styles.quitar}
                  onClick={() => onQuitar(linea)}
                  disabled={guardando}
                  aria-label={`Quitar ${linea.productoNombre}`}
                >
                  ✕
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.seccion}>
        <p className={styles.tituloSeccion}>Observaciones de la consulta</p>
        <textarea
          className={styles.textarea}
          value={observacionesEdicion}
          onChange={(evento) => setObservacionesEdicion(evento.target.value)}
          rows="3"
          maxLength="1000"
          disabled={guardando}
          placeholder="Notas generales de la consulta…"
          aria-label="Observaciones de la consulta"
        />
      </section>

      <section className={styles.seccion}>
        <div className={styles.acciones}>
          <button type="button" className={styles.botonSecundario} onClick={onCancelar} disabled={guardando}>
            Cancelar
          </button>
          <button
            type="button"
            className={styles.armarVenta}
            onClick={onGuardar}
            disabled={guardando || edicion.length === 0}
          >
            {guardando ? 'Guardando…' : 'Guardar modificación'}
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </section>
    </>
  )
}

export default ConsultaDetalle
