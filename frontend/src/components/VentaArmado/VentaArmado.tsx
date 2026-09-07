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
import type { FormaPago, MetodoPago, Producto, VarianteProducto, VentaDetalle } from '../../types'

interface ConsultaParaArmar {
  id: number
  numero: string
  tiendaSlug: string
  clienteNombre: string
  clienteTelefono: string
  formaPago: FormaPago
}

interface PropsVentaArmado {
  consulta: ConsultaParaArmar
  ventaInicial: VentaDetalle | null
  onCerrar: () => void
  onConfirmada: (venta: VentaDetalle) => void
  onCancelada: () => void
}

interface LineaEdicion {
  id: number | string
  productoId: number
  varianteId: number
  talle: string
  color: string
  cantidad: number
  productoNombre: string
  productoImagen: string
  precioUnitario: number
  stock: number
  variantes: VarianteProducto[]
}

const inputBase =
  'min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3 py-2 text-[14px] text-[var(--color-texto)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--gestion-color,var(--color-marca))] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--gestion-color,var(--color-marca))_15%,transparent)] focus:outline-none'

const titulo =
  'text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--color-texto-suave)]'

const rutaConfirmarCerrar =
  'Si cerrás sin confirmar la venta, los productos que agregaste no se guardan. ¿Querés cerrar?'

function VentaArmado({ consulta, ventaInicial, onCerrar, onConfirmada, onCancelada }: PropsVentaArmado) {
  const [venta, setVenta] = useState<VentaDetalle | null>(ventaInicial ?? null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [edicion, setEdicion] = useState<LineaEdicion[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState('')
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(
    consulta.formaPago === 'DIGITAL' ? 'MERCADO_PAGO' : 'EFECTIVO',
  )
  const [agregarAbierto, setAgregarAbierto] = useState(false)
  const [busquedaNuevo, setBusquedaNuevo] = useState('')
  const [nuevoProductoId, setNuevoProductoId] = useState('')
  const [nuevoVarianteId, setNuevoVarianteId] = useState('')
  const [nuevoCantidad, setNuevoCantidad] = useState('1')
  const pendienteRef = useRef<LineaEdicion[] | null>(null)
  const guardandoRef = useRef(false)
  const errorRef = useRef<string | null>(null)

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
      .catch((err: Error) => {
        if (!activo) return
        setError(err.message)
        setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [consulta.id, consulta.tiendaSlug, ventaInicial])

  const variantesPorProducto = useMemo(() => {
    const mapa = new Map<number, VarianteProducto[]>()
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

  async function persistir(lineas: LineaEdicion[]) {
    pendienteRef.current = lineas
    if (guardandoRef.current) return
    guardandoRef.current = true
    setGuardando(true)
    const ventaId = venta?.id
    if (!ventaId) return
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
      setError((err as Error).message)
      errorRef.current = (err as Error).message
    } finally {
      guardandoRef.current = false
      setGuardando(false)
    }
  }

  function cambiarVariante(linea: LineaEdicion, varianteId: number) {
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

  function cambiarCantidad(linea: LineaEdicion, cantidad: string) {
    const valor = Math.min(Math.max(1, Number(cantidad) || 1), linea.stock || 1)
    const actualizada = edicion.map((l) => (l.id === linea.id ? { ...l, cantidad: valor } : l))
    setEdicion(actualizada)
    persistir(actualizada)
  }

  function quitar(linea: LineaEdicion) {
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
    const linea: LineaEdicion = {
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
    setNuevoCantidad('1')
    persistir(actualizada)
  }

  async function esperarGuardados() {
    while (guardandoRef.current || pendienteRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 80))
    }
  }

  async function confirmar() {
    if (!venta) return
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
      setError((err as Error).message)
      setConfirmando(false)
    }
  }

  async function cancelar() {
    if (!venta) return
    setCancelando(true)
    setError('')
    try {
      await cancelarVenta(venta.id)
      onCancelada()
    } catch (err) {
      setError((err as Error).message)
      setCancelando(false)
    }
  }

  function cerrar() {
    if (edicion.length > 0 && venta?.estado === 'EN_PREPARACION' && !window.confirm(rutaConfirmarCerrar)) return
    onCerrar()
  }

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busquedaNuevo.trim().toLowerCase()),
  )
  const productoSeleccionado = productos.find((p) => p.id === Number(nuevoProductoId))
  const variantesDisponibles = (productoSeleccionado?.variantes ?? []).filter((v) => v.stock > 0)

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-[rgba(15,15,25,0.6)] p-3 backdrop-blur-[6px] animate-aparecer md:p-5" onClick={cerrar} role="presentation">
      <div
        className="flex max-h-[94vh] w-full max-w-[860px] flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-superficie)] shadow-[var(--shadow-lg)] animate-subir"
        role="dialog"
        aria-modal="true"
        aria-label="Armar venta"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="sticky top-0 z-[3] flex h-0 justify-end">
          <button
            type="button"
            className="absolute right-3.5 top-3.5 z-[2] flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/90 text-[16px] text-[var(--color-texto)] shadow-[var(--shadow-sm)] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:rotate-90 hover:scale-105"
            onClick={cerrar}
            aria-label="Cerrar armado de venta"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cargando ? (
            <div className="p-12 text-center text-[var(--color-texto-suave)]">Cargando venta…</div>
          ) : (
            venta && (
              <>
                <header className="sticky top-0 z-[1] flex items-start justify-between gap-3 border-b-2 border-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] px-5 pb-4 pr-16 pt-4">
                  <div>
                    <h2 className="text-2xl tracking-[-0.02em] text-[var(--gestion-color,inherit)]">{venta.numero}</h2>
                    <p className="mt-1 text-[14px] text-[var(--color-texto-suave)]">
                      Consulta {venta.consultaNumero} · {consulta.clienteNombre ?? 'Sin nombre'} ·{' '}
                      {consulta.clienteTelefono}
                    </p>
                  </div>
                </header>

                <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
                  <div className="mb-3.5 flex items-center justify-between gap-3">
                    <p className={titulo}>Productos ({totalItems})</p>
                    <button
                      type="button"
                      className="min-h-10 rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3.5 py-2 text-[13px] font-semibold text-[var(--gestion-color,var(--color-marca))] transition-colors duration-200 hover:border-[var(--gestion-color,var(--color-marca))] hover:bg-[var(--gestion-color,var(--color-marca))] hover:text-white"
                      onClick={() => setAgregarAbierto((v) => !v)}
                    >
                      {agregarAbierto ? 'Cerrar búsqueda' : 'Agregar producto'}
                    </button>
                  </div>

                  {agregarAbierto && (
                    <div className="mb-3.5 flex flex-col gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-borde)] bg-[var(--color-fondo)] p-3.5">
                      <input
                        className={`${inputBase} w-full`}
                        type="search"
                        value={busquedaNuevo}
                        onChange={(e) => {
                          setBusquedaNuevo(e.target.value)
                          setNuevoProductoId('')
                          setNuevoVarianteId('')
                        }}
                        placeholder="Buscar producto de la tienda…"
                        aria-label="Buscar producto para agregar"
                      />
                      <div className="flex flex-col gap-2.5 md:grid md:grid-cols-[1.4fr_1fr_90px_auto]">
                        <select
                          className={`${inputBase} w-full md:w-auto`}
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
                          className={`${inputBase} w-full md:w-auto`}
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
                          className={`${inputBase} max-w-[90px]`}
                          type="number"
                          min="1"
                          max={productoSeleccionado ? variantesDisponibles.find((v) => v.id === Number(nuevoVarianteId))?.stock ?? 1 : 1}
                          value={nuevoCantidad}
                          onChange={(e) => setNuevoCantidad(e.target.value)}
                          aria-label="Cantidad"
                        />
                        <button
                          type="button"
                          className="min-h-11 rounded-[var(--radius-sm)] border-0 bg-[var(--color-marca)] px-4 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={agregarProducto}
                          disabled={!nuevoProductoId || !nuevoVarianteId}
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  )}

                  {edicion.length === 0 ? (
                    <p className="text-[14px] text-[var(--color-texto-suave)]">La venta no tiene productos todavía.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {edicion.map((linea) => (
                        <article key={linea.id} className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-borde)] bg-[var(--color-fondo)] p-3">
                          <img className="h-20 w-[60px] shrink-0 rounded-[var(--radius-sm)] object-cover" src={linea.productoImagen} alt={linea.productoNombre} />
                          <div className="min-w-0 flex-1">
                            <p className="mb-2 text-[15px] font-bold">{linea.productoNombre}</p>
                            <div className="flex flex-wrap items-end gap-2.5">
                              <select
                                className={`${inputBase} min-w-0 flex-1`}
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
                              <label className="flex items-center gap-2 text-[13px] text-[var(--color-texto-suave)]">
                                Cant.
                                <input
                                  className={`${inputBase} max-w-[90px]`}
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
                            <p className="mt-2 text-[13px] text-[var(--color-texto-suave)]">
                              {formatearPrecio(linea.precioUnitario)} × {linea.cantidad} ={' '}
                              <strong className="text-[var(--color-texto)]">{formatearPrecio(linea.precioUnitario * linea.cantidad)}</strong>
                              <span className={linea.stock <= 0 ? 'font-bold text-[#c0392b]' : 'text-[var(--color-texto-suave)]'}>
                                {' '}
                                · stock {linea.stock}
                              </span>
                            </p>
                          </div>
                          <button
                            type="button"
                            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] text-[14px] text-[#c0392b] transition-colors duration-200 hover:border-[#c0392b] hover:bg-[#fee2e2] disabled:cursor-not-allowed disabled:opacity-50"
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

                <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
                  <div className="mb-3.5 flex items-baseline justify-between gap-3">
                    <p className="text-[14px] text-[var(--color-texto-suave)]">
                      Total {totalItems} unidad{totalItems === 1 ? '' : 'es'}
                    </p>
                    <p className="text-[26px] font-bold tracking-[-0.02em]">{formatearPrecio(total)}</p>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="flex min-w-[200px] flex-1 flex-col gap-1.5 text-[13px] font-semibold text-[var(--color-texto-suave)]">
                      Método de pago
                      <select
                        className={`${inputBase} w-full`}
                        value={metodoPago}
                        onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
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
                      className="min-h-[46px] rounded-full border-0 bg-[var(--color-marca)] px-[22px] text-[15px] font-bold text-white transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-px hover:bg-[var(--color-marca-oscuro)] disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={confirmar}
                      disabled={confirmando || guardando || edicion.length === 0}
                    >
                      {confirmando ? 'Confirmando…' : 'Confirmar venta'}
                    </button>
                  </div>
                  {guardando && <p className="mt-2.5 text-[13px] text-[var(--color-texto-suave)]">Guardando cambios…</p>}
                  {error && <p className="mt-2.5 text-[14px] text-[#c0392b]">{error}</p>}
                </section>

                <footer className="flex justify-end px-5 py-4">
                  <button
                    type="button"
                    className="min-h-[42px] rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-4 text-[14px] font-semibold text-[#c0392b] transition-colors duration-200 hover:border-[#c0392b] hover:bg-[#fee2e2] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={cancelar}
                    disabled={cancelando || confirmando}
                  >
                    {cancelando ? 'Cancelando…' : 'El cliente no compró — cancelar consulta'}
                  </button>
                </footer>
              </>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default VentaArmado