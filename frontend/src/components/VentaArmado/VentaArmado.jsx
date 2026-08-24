import { useEffect, useMemo, useRef, useState } from 'react'
import {
  actualizarItemsVenta,
  cancelarVenta,
  confirmarVenta,
  crearVenta,
  fetchProductos,
  formatearPrecio,
  METODOS_PAGO,
} from '../../services/api'
import styles from './VentaArmado.module.css'

function VentaArmado({ consulta, ventaInicial, onCerrar, onConfirmada, onCancelada }) {
  const [venta, setVenta] = useState(ventaInicial ?? null)
  const [productos, setProductos] = useState([])
  const [edicion, setEdicion] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState('')
  const [metodoPago, setMetodoPago] = useState(consulta.formaPago === 'DIGITAL' ? 'MERCADO_PAGO' : 'EFECTIVO')
  const [agregarAbierto, setAgregarAbierto] = useState(false)
  const [busquedaNuevo, setBusquedaNuevo] = useState('')
  const [nuevoProductoId, setNuevoProductoId] = useState('')
  const [nuevoVarianteId, setNuevoVarianteId] = useState('')
  const [nuevoCantidad, setNuevoCantidad] = useState(1)
  const pendienteRef = useRef(null)
  const guardandoRef = useRef(false)
  const errorRef = useRef(null)

  useEffect(() => {
    let activo = true
    setCargando(true)
    Promise.all([
      ventaInicial ? Promise.resolve(ventaInicial) : crearVenta(consulta.id),
      fetchProductos(consulta.tiendaSlug),
    ])
      .then(([nuevaVenta, catalogo]) => {
        if (!activo) return
        setVenta(nuevaVenta)
        setProductos(catalogo)
        setCargando(false)
      })
      .catch((err) => {
        if (!activo) return
        setError(err.message)
        setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  const variantesPorProducto = useMemo(() => {
    const mapa = new Map()
    for (const producto of productos) {
      mapa.set(producto.id, producto.variantes)
    }
    return mapa
  }, [productos])

  useEffect(() => {
    if (!venta) return
    setEdicion(
      venta.items.map((item) => ({
        id: item.id,
        productoId: item.productoId,
        varianteId: item.varianteId,
        talle: item.talle,
        color: item.color,
        cantidad: item.cantidad,
        productoNombre: item.productoNombre,
        productoImagen: item.productoImagen,
        precioUnitario: item.precioUnitario,
        stock: item.stockDisponible,
        variantes: variantesPorProducto.get(item.productoId) ?? [],
      })),
    )
  }, [venta, variantesPorProducto])

  const total = edicion.reduce((acc, linea) => acc + linea.precioUnitario * linea.cantidad, 0)
  const totalItems = edicion.reduce((acc, linea) => acc + linea.cantidad, 0)

  async function persistir(lineas) {
    pendienteRef.current = lineas
    if (guardandoRef.current) return
    guardandoRef.current = true
    setGuardando(true)
    const ventaId = venta.id
    try {
      while (pendienteRef.current) {
        const pendientes = pendienteRef.current
        pendienteRef.current = null
        const payload = pendientes.map((l) => ({
          productoId: l.productoId,
          varianteId: l.varianteId,
          cantidad: l.cantidad,
        }))
        const nueva = await actualizarItemsVenta(ventaId, payload)
        if (!pendienteRef.current) setVenta(nueva)
      }
      setError('')
      errorRef.current = null
    } catch (err) {
      setError(err.message)
      errorRef.current = err.message
    } finally {
      guardandoRef.current = false
      setGuardando(false)
    }
  }

  function cambiarVariante(linea, varianteId) {
    const variante = linea.variantes.find((v) => v.id === varianteId)
    if (!variante) return
    const actualizada = edicion.map((l) =>
      l.id === linea.id
        ? { ...l, varianteId: variante.id, color: variante.color, talle: variante.talle, stock: variante.stock }
        : l,
    )
    setEdicion(actualizada)
    persistir(actualizada)
  }

  function cambiarCantidad(linea, cantidad) {
    const valor = Math.min(Math.max(1, Number(cantidad) || 1), linea.stock || 1)
    const actualizada = edicion.map((l) => (l.id === linea.id ? { ...l, cantidad: valor } : l))
    setEdicion(actualizada)
    persistir(actualizada)
  }

  function quitar(linea) {
    const actualizada = edicion.filter((l) => l.id !== linea.id)
    setEdicion(actualizada)
    persistir(actualizada)
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
      id: `nuevo-${Date.now()}-${variante.id}`,
      productoId: producto.id,
      varianteId: variante.id,
      talle: variante.talle,
      color: variante.color,
      cantidad,
      productoNombre: producto.nombre,
      productoImagen: producto.imagen,
      precioUnitario: producto.precio,
      stock: variante.stock,
      variantes: producto.variantes,
    }
    const actualizada = [...edicion, linea]
    setEdicion(actualizada)
    setAgregarAbierto(false)
    setBusquedaNuevo('')
    setNuevoProductoId('')
    setNuevoVarianteId('')
    setNuevoCantidad(1)
    persistir(actualizada)
  }

  async function esperarGuardados() {
    while (guardandoRef.current || pendienteRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 80))
    }
  }

  async function confirmar() {
    setConfirmando(true)
    setError('')
    try {
      await esperarGuardados()
      if (errorRef.current) {
        setConfirmando(false)
        return
      }
      const confirmada = await confirmarVenta(venta.id, metodoPago)
      onConfirmada(confirmada)
    } catch (err) {
      setError(err.message)
      setConfirmando(false)
    }
  }

  async function cancelar() {
    setCancelando(true)
    setError('')
    try {
      await cancelarVenta(venta.id)
      onCancelada()
    } catch (err) {
      setError(err.message)
      setCancelando(false)
    }
  }

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busquedaNuevo.trim().toLowerCase()),
  )
  const productoSeleccionado = productos.find((p) => p.id === Number(nuevoProductoId))
  const variantesDisponibles = (productoSeleccionado?.variantes ?? []).filter((v) => v.stock > 0)

  return (
    <div className={styles.overlay} onClick={() => {
      if (edicion.length > 0 && venta?.estado === 'EN_PREPARACION' && !window.confirm('Si cerrás sin confirmar la venta, los productos que agregaste no se guardan. ¿Querés cerrar?')) return
      onCerrar()
    }} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Armar venta"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className={styles.cerrarZona}>
          <button type="button" className={styles.cerrar} onClick={() => {
            if (edicion.length > 0 && venta?.estado === 'EN_PREPARACION' && !window.confirm('Si cerrás sin confirmar la venta, los productos que agregaste no se guardan. ¿Querés cerrar?')) return
            onCerrar()
          }} aria-label="Cerrar armado de venta">
            ✕
          </button>
        </div>

        {cargando ? (
          <div className={styles.cargando}>Cargando venta…</div>
        ) : (
          <>
            <header className={styles.encabezado}>
              <div>
                <h2 className={styles.numero}>{venta.numero}</h2>
                <p className={styles.fecha}>
                  Consulta {venta.consultaNumero} · {consulta.clienteNombre ?? 'Sin nombre'} ·{' '}
                  {consulta.clienteTelefono}
                </p>
              </div>
            </header>

            <section className={styles.seccion}>
              <div className={styles.seccionTitulo}>
                <p className={styles.titulo}>Productos ({totalItems})</p>
                <button
                  type="button"
                  className={styles.agregarBoton}
                  onClick={() => setAgregarAbierto((v) => !v)}
                >
                  {agregarAbierto ? 'Cerrar búsqueda' : 'Agregar producto'}
                </button>
              </div>

              {agregarAbierto && (
                <div className={styles.agregador}>
                  <input
                    className={styles.input}
                    type="search"
                    value={busquedaNuevo}
                    onChange={(e) => setBusquedaNuevo(e.target.value)}
                    placeholder="Buscar producto de la tienda…"
                    aria-label="Buscar producto para agregar"
                  />
                  <div className={styles.agregadorFila}>
                    <select
                      className={styles.select}
                      value={nuevoProductoId}
                      onChange={(e) => {
                        setNuevoProductoId(e.target.value)
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
                      onChange={(e) => setNuevoVarianteId(e.target.value)}
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
                      onChange={(e) => setNuevoCantidad(e.target.value)}
                      aria-label="Cantidad"
                    />
                    <button
                      type="button"
                      className={styles.botonPrimario}
                      onClick={agregarProducto}
                      disabled={!nuevoProductoId || !nuevoVarianteId}
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              )}

              {edicion.length === 0 ? (
                <p className={styles.sinItems}>La venta no tiene productos todavía.</p>
              ) : (
                <div className={styles.items}>
                  {edicion.map((linea) => (
                    <article key={linea.id} className={styles.item}>
                      <img className={styles.itemImagen} src={linea.productoImagen} alt={linea.productoNombre} />
                      <div className={styles.itemCuerpo}>
                        <p className={styles.itemNombre}>{linea.productoNombre}</p>
                        <div className={styles.itemControles}>
                          <select
                            className={styles.select}
                            value={linea.varianteId}
                            onChange={(e) => cambiarVariante(linea, Number(e.target.value))}
                            disabled={guardando || linea.variantes.length === 0}
                            aria-label="Color y talle"
                          >
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
                              max={linea.stock}
                              value={linea.cantidad}
                              onChange={(e) => cambiarCantidad(linea, e.target.value)}
                              disabled={guardando}
                              aria-label="Cantidad"
                            />
                          </label>
                        </div>
                        <p className={styles.itemPie}>
                          {formatearPrecio(linea.precioUnitario)} × {linea.cantidad} ={' '}
                          <strong>{formatearPrecio(linea.precioUnitario * linea.cantidad)}</strong>
                          <span className={linea.stock <= 0 ? styles.stockAgotado : styles.stock}>
                            {' '}
                            · stock {linea.stock}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        className={styles.quitar}
                        onClick={() => quitar(linea)}
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
              <div className={styles.totalFila}>
                <p className={styles.totalTexto}>
                  Total {totalItems} unidad{totalItems === 1 ? '' : 'es'}
                </p>
                <p className={styles.totalImporte}>{formatearPrecio(total)}</p>
              </div>
              <div className={styles.confirmarFila}>
                <label className={styles.metodoLabel}>
                  Método de pago
                  <select
                    className={styles.select}
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    aria-label="Método de pago"
                  >
                    {METODOS_PAGO.map((m) => (
                      <option key={m.valor} value={m.valor}>
                        {m.etiqueta}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className={styles.botonConfirmar}
                  onClick={confirmar}
                  disabled={confirmando || guardando || edicion.length === 0}
                >
                  {confirmando ? 'Confirmando…' : 'Confirmar venta'}
                </button>
              </div>
              {guardando && <p className={styles.nota}>Guardando cambios…</p>}
              {error && <p className={styles.error}>{error}</p>}
            </section>

            <footer className={styles.pie}>
              <button
                type="button"
                className={styles.botonCancelar}
                onClick={cancelar}
                disabled={cancelando || confirmando}
              >
                {cancelando ? 'Cancelando…' : 'El cliente no compró — cancelar consulta'}
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}

export default VentaArmado
