import { useEffect, useState } from 'react'
import {
  fetchHistorialConsulta,
  fetchProductos,
  formatearPrecio,
  MOTIVOS_MODIFICACION,
  modificarConsulta,
  ESTADOS_CONSULTA,
  etiquetaEstado,
} from '../../services/api'
import EstadoBadge from '../EstadoBadge/EstadoBadge'
import styles from './ConsultaDetalle.module.css'

const TIPO_CAMBIO_ETIQUETA = {
  PRODUCTO_AGREGADO: 'Producto agregado',
  PRODUCTO_QUITADO: 'Producto quitado',
  CAMBIO_TALLE: 'Cambio de talle',
  CAMBIO_COLOR: 'Cambio de color',
  CAMBIO_CANTIDAD: 'Cambio de cantidad',
  CAMBIO_OBSERVACIONES: 'Cambio de nota',
}

const TIPO_CAMBIO_TONO = {
  PRODUCTO_AGREGADO: 'agregado',
  PRODUCTO_QUITADO: 'quitado',
}

function ConsultaDetalle({
  consulta,
  onCerrar,
  onCambiarEstado,
  cambiandoEstado,
  onArmarVenta,
  onVerVenta,
  onModificada,
}) {
  const [vista, setVista] = useState('actual')
  const [versionAbierta, setVersionAbierta] = useState(null)
  const [historial, setHistorial] = useState(null)
  const [cargandoHistorial, setCargandoHistorial] = useState(false)

  const [edicion, setEdicion] = useState([])
  const [productos, setProductos] = useState([])
  const [motivo, setMotivo] = useState('')
  const [observacionesEdicion, setObservacionesEdicion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [agregarAbierto, setAgregarAbierto] = useState(false)
  const [busquedaNuevo, setBusquedaNuevo] = useState('')
  const [nuevoProductoId, setNuevoProductoId] = useState('')
  const [nuevoVarianteId, setNuevoVarianteId] = useState('')
  const [nuevoCantidad, setNuevoCantidad] = useState(1)

  const estadosDisponibles = ESTADOS_CONSULTA.filter((e) => e.valor !== consulta.estado)
  const puedeArmarVenta = ['PENDIENTE', 'EN_REVISION', 'ESPERANDO_CLIENTE'].includes(consulta.estado)
  const tieneVentaConfirmada = consulta.estado === 'CONFIRMADA'
  const cantidadVersiones = consulta.version + 1

  useEffect(() => {
    if (vista !== 'editar') return
    setEdicion(
      consulta.productos.map((item) => ({
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

  async function cargarHistorial() {
    if (historial) {
      setVista('historial')
      return
    }
    setCargandoHistorial(true)
    setError('')
    try {
      const datos = await fetchHistorialConsulta(consulta.id)
      setHistorial(datos)
      setVista('historial')
    } catch (err) {
      setError(err.message)
    } finally {
      setCargandoHistorial(false)
    }
  }

  function abrirVersion(version) {
    setVersionAbierta(version)
    setVista('version')
  }

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
    if (!nuevoProductoId || !nuevoVarianteId) {
      setError('Seleccioná producto y variante para agregar')
      return
    }
    const producto = productos.find((p) => p.id === Number(nuevoProductoId))
    const variante = producto?.variantes.find((v) => v.id === Number(nuevoVarianteId))
    if (!producto || !variante) {
      setError('Producto o variante inválidos')
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
    setAgregarAbierto(false)
    setBusquedaNuevo('')
    setNuevoProductoId('')
    setNuevoVarianteId('')
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
      setHistorial(null)
      setVista('actual')
      onModificada(actualizada)
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busquedaNuevo.trim().toLowerCase()),
  )
  const productoSeleccionado = productos.find((p) => p.id === Number(nuevoProductoId))
  const variantesDisponibles = (productoSeleccionado?.variantes ?? []).filter((v) => v.stock > 0)

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

        {vista !== 'actual' && (
          <header className={styles.encabezado}>
            <div>
              <button type="button" className={styles.volver} onClick={() => setVista('actual')}>
                ← Volver
              </button>
              <h2 className={styles.numero}>
                {vista === 'version' ? `Versión ${versionAbierta?.numero ?? ''}` : 'Historial de versiones'}
              </h2>
              <p className={styles.fecha}>{consulta.numero}</p>
            </div>
          </header>
        )}

        {vista === 'actual' && (
          <>
            <VistaActual
              consulta={consulta}
              puedeArmarVenta={puedeArmarVenta}
              tieneVentaConfirmada={tieneVentaConfirmada}
              estadosDisponibles={estadosDisponibles}
              cambiandoEstado={cambiandoEstado}
              cantidadVersiones={cantidadVersiones}
              onCambiarEstado={onCambiarEstado}
              onArmarVenta={onArmarVenta}
              onVerVenta={onVerVenta}
              onEditar={() => {
                setError('')
                setVista('editar')
              }}
              onVerHistorial={cargarHistorial}
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
            agregarAbierto={agregarAbierto}
            setAgregarAbierto={setAgregarAbierto}
            busquedaNuevo={busquedaNuevo}
            setBusquedaNuevo={setBusquedaNuevo}
            nuevoProductoId={nuevoProductoId}
            setNuevoProductoId={setNuevoProductoId}
            nuevoVarianteId={nuevoVarianteId}
            setNuevoVarianteId={setNuevoVarianteId}
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

        {vista === 'historial' && (
          <VistaHistorial
            cargando={cargandoHistorial}
            historial={historial}
            error={error}
            onAbrirVersion={abrirVersion}
          />
        )}

        {vista === 'version' && versionAbierta && <VistaVersion version={versionAbierta} />}
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
  puedeArmarVenta,
  tieneVentaConfirmada,
  estadosDisponibles,
  cambiandoEstado,
  cantidadVersiones,
  onCambiarEstado,
  onArmarVenta,
  onVerVenta,
  onEditar,
  onVerHistorial,
}) {
  return (
    <>
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
        <div className={styles.accionesTitulo}>
          <p className={styles.tituloSeccion}>Versiones e historial</p>
          <span className={styles.badgeCuenta}>{cantidadVersiones}</span>
        </div>
        <div className={styles.acciones}>
          <button type="button" className={styles.botonSecundario} onClick={onVerHistorial}>
            Ver historial de versiones
          </button>
          {consulta.editable && (
            <button type="button" className={styles.armarVenta} onClick={onEditar}>
              Editar consulta
            </button>
          )}
        </div>
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
  agregarAbierto,
  setAgregarAbierto,
  busquedaNuevo,
  setBusquedaNuevo,
  nuevoProductoId,
  setNuevoProductoId,
  nuevoVarianteId,
  setNuevoVarianteId,
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
              onChange={(evento) => setBusquedaNuevo(evento.target.value)}
              placeholder="Buscar producto de la tienda…"
              aria-label="Buscar producto para agregar"
            />
            <div className={styles.agregadorFila}>
              <select
                className={styles.select}
                value={nuevoProductoId}
                onChange={(evento) => {
                  setNuevoProductoId(evento.target.value)
                  setNuevoVarianteId('')
                }}
                aria-label="Producto"
              >
                <option value="">Producto…</option>
                {productosFiltrados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              <select
                className={styles.select}
                value={nuevoVarianteId}
                onChange={(evento) => setNuevoVarianteId(evento.target.value)}
                disabled={!productoSeleccionado || variantesDisponibles.length === 0}
                aria-label="Variante"
              >
                <option value="">
                  {variantesDisponibles.length === 0 ? 'Sin stock' : 'Color · Talle…'}
                </option>
                {variantesDisponibles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.color} · {v.talle} ({v.stock})
                  </option>
                ))}
              </select>
              <input
                className={styles.inputCantidad}
                type="number"
                min="1"
                max={productoSeleccionado ? variantesDisponibles.find((v) => v.id === Number(nuevoVarianteId))?.stock ?? 1 : 1}
                value={nuevoCantidad}
                onChange={(evento) => setNuevoCantidad(evento.target.value)}
                aria-label="Cantidad"
              />
              <button
                type="button"
                className={styles.botonPrimario}
                onClick={onAgregarProducto}
                disabled={!nuevoProductoId || !nuevoVarianteId}
              >
                Agregar
              </button>
            </div>
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

function VistaHistorial({ cargando, historial, error, onAbrirVersion }) {
  return (
    <>
      <section className={styles.seccion}>
        {cargando ? (
          <p className={styles.texto}>Cargando historial…</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : (
          <div className={styles.versionLista}>
            {historial.map((version) => (
              <button
                key={version.id}
                type="button"
                className={styles.versionFila}
                onClick={() => onAbrirVersion(version)}
              >
                <div className={styles.versionFilaPrincipal}>
                  <span className={styles.versionEtiqueta}>{version.numero}</span>
                  <EstadoBadge estado={version.estado} />
                </div>
                <p className={styles.versionDetalle}>
                  {formatearFecha(version.fecha)}
                  {version.motivoEtiqueta ? ` · ${version.motivoEtiqueta}` : ' · Creación inicial'}
                  {version.empleado ? ` · ${version.empleado}` : ''}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function VistaVersion({ version }) {
  return (
    <>
      <section className={styles.seccion}>
        <div className={styles.versionInfo}>
          <EstadoBadge estado={version.estado} />
          <p className={styles.versionDetalle}>
            {formatearFecha(version.fecha)}
            {version.motivoEtiqueta ? ` · ${version.motivoEtiqueta}` : ' · Creación inicial'}
            {version.empleado ? ` · ${version.empleado}` : ''}
          </p>
        </div>
      </section>

      {version.observaciones && (
        <section className={styles.seccion}>
          <p className={styles.tituloSeccion}>Observaciones de la consulta</p>
          <p className={styles.texto}>{version.observaciones}</p>
        </section>
      )}

      <section className={styles.seccion}>
        <p className={styles.tituloSeccion}>Cambios de esta versión</p>
        {version.cambios.length === 0 ? (
          <p className={styles.texto}>Sin cambios registrados (versión inicial).</p>
        ) : (
          <div className={styles.cambios}>
            {version.cambios.map((cambio, indice) => (
              <div key={indice} className={`${styles.cambio} ${styles[`cambio${TIPO_CAMBIO_TONO[cambio.tipo]}`] ?? ''}`}>
                <span className={styles.cambioEtiqueta}>
                  {TIPO_CAMBIO_ETIQUETA[cambio.tipo] ?? cambio.tipo}
                </span>
                <span className={styles.cambioDescripcion}>{cambio.descripcion}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.seccion}>
        <p className={styles.tituloSeccion}>
          Productos ({version.items.reduce((acc, i) => acc + i.cantidad, 0)} unidad
          {version.items.reduce((acc, i) => acc + i.cantidad, 0) === 1 ? '' : 'es'})
        </p>
        <div className={styles.items}>
          {version.items.map((item) => (
            <article key={item.productoId + item.talle + (item.color ?? '')} className={styles.item}>
              <img className={styles.itemImagen} src={item.productoImagen} alt={item.productoNombre} />
              <div className={styles.itemCuerpo}>
                <p className={styles.itemNombre}>{item.productoNombre}</p>
                <p className={styles.itemDetalle}>
                  Talle {item.talle}
                  {item.color ? ` · ${item.color}` : ''} · Cant. {item.cantidad}
                </p>
                <p className={styles.itemPrecio}>{formatearPrecio(item.precioUnitario)}</p>
                {item.observaciones && <p className={styles.itemNota}>{item.observaciones}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
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
