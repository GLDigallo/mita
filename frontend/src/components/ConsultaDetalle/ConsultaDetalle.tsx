import { useEffect, useState } from 'react'
import {
  actualizarNotaInterna,
  fetchProductos,
  formatearFecha,
  formatearPrecio,
  MOTIVOS_MODIFICACION,
  modificarConsulta,
} from '../../services/api'
import type {
  FormaPago,
  MetodoPago,
  Producto,
  VarianteProducto,
  ConsultaDetalle as ConsultaDetalleTipo,
} from '../../types'
import EstadoBadge from '../EstadoBadge/EstadoBadge'

interface PropsConsultaDetalle {
  consulta: ConsultaDetalleTipo
  onCerrar: () => void
  cambiandoEstado: boolean
  onCambiarFormaPago: (forma: FormaPago) => void
  onArmarVenta: (consulta: ConsultaDetalleTipo) => void
  onModificada: (consulta: ConsultaDetalleTipo) => void
  onConfirmarVenta: (metodo: MetodoPago) => void
  onEntregarVenta: () => void
  onCancelarVenta: () => void
}

interface LineaEdicion {
  clave: string
  productoId: number
  varianteId: number | ''
  talle: string
  color: string
  cantidad: number
  productoNombre: string
  productoImagen: string
  precioUnitario: number
  observaciones: string
  variantes: VarianteProducto[]
}

const inputBase =
  'min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3 py-2 text-[14px] text-[var(--color-texto)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--gestion-color,var(--color-marca))] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--gestion-color,var(--color-marca))_15%,transparent)] focus:outline-none'

const tituloSeccion =
  'mb-3 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--color-texto-suave)]'

const whatsappBtnGrande =
  'mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] bg-[#25d366] px-[18px] py-2.5 text-[15px] font-bold text-white no-underline transition-[background,transform] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-px hover:bg-[#1ebe57]'

const btnConfirmar =
  'min-h-12 rounded-[var(--radius-pill)] border-0 bg-[#25d366] px-5 py-3 text-[15px] font-bold text-white transition-[background,transform] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-px hover:bg-[#1ebe57] disabled:cursor-not-allowed disabled:opacity-60'

const btnCancelar =
  'min-h-11 rounded-[var(--radius-pill)] border border-[#dc2626] bg-transparent px-[18px] py-2.5 text-[14px] font-semibold text-[#dc2626] transition-all duration-200 hover:bg-[#dc2626] hover:text-white disabled:cursor-not-allowed disabled:opacity-50'

const btnSecundario =
  'min-h-11 rounded-[var(--radius-pill)] border border-[var(--color-marca)] bg-[var(--color-marca)] px-[18px] py-2.5 text-[14px] font-bold text-white transition-[background,transform] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-px hover:bg-[var(--color-marca-oscuro)] disabled:cursor-not-allowed disabled:opacity-60'

function varianteActual(item: ConsultaDetalleTipo['productos'][number]): number | '' {
  const variante = (item.variantes ?? []).find(
    (v) => v.color === item.color && v.talle === item.talle,
  )
  return variante ? variante.id : ''
}

function ConsultaDetalle({
  consulta,
  onCerrar,
  cambiandoEstado,
  onCambiarFormaPago,
  onArmarVenta,
  onModificada,
  onConfirmarVenta,
  onEntregarVenta,
  onCancelarVenta,
}: PropsConsultaDetalle) {
  const [vista, setVista] = useState<'actual' | 'editar'>('actual')

  const [edicion, setEdicion] = useState<LineaEdicion[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
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
      })) ?? [],
    )
    setObservacionesEdicion(consulta.observaciones ?? '')
    let activo = true
    fetchProductos(consulta.tiendaSlug)
      .then((catalogo) => {
        if (activo) setProductos(catalogo)
      })
      .catch((err: Error) => {
        if (activo) setError(err.message)
      })
    return () => {
      activo = false
    }
  }, [vista, consulta])

  function cambiarVariante(linea: LineaEdicion, varianteId: number) {
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

  function cambiarCantidad(linea: LineaEdicion, cantidad: string) {
    const valor = Math.min(Math.max(1, Number(cantidad) || 1), 99)
    setEdicion((actuales) => actuales.map((l) => (l.clave === linea.clave ? { ...l, cantidad: valor } : l)))
  }

  function cambiarNota(linea: LineaEdicion, observaciones: string) {
    setEdicion((actuales) =>
      actuales.map((l) => (l.clave === linea.clave ? { ...l, observaciones } : l)),
    )
  }

  function quitar(linea: LineaEdicion) {
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
    const linea: LineaEdicion = {
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
      setError((err as Error).message)
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
      setError((err as Error).message)
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
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-[rgba(15,15,25,0.6)] p-3 backdrop-blur-[6px] animate-aparecer md:p-5" onClick={onCerrar} role="presentation">
      <div
        className="flex max-h-[92vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-superficie)] shadow-[var(--shadow-lg)] animate-subir"
        role="dialog"
        aria-modal="true"
        aria-label={`Consulta ${consulta.numero}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="sticky top-0 z-[3] flex h-0 justify-end">
          <button
            type="button"
            className="absolute right-3.5 top-3.5 z-[2] flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/90 text-[16px] text-[var(--color-texto)] shadow-[var(--shadow-sm)] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:rotate-90 hover:scale-105"
            onClick={onCerrar}
            aria-label="Cerrar detalle"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {vista !== 'actual' && (
            <header className="sticky top-0 z-[1] flex items-start justify-between gap-3 border-b-2 border-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] px-5 pb-4 pr-16 pt-4">
              <div>
                <button type="button" className="mb-1.5 border-0 bg-transparent p-0 text-[13px] font-semibold text-[var(--color-marca)]" onClick={() => setVista('actual')}>
                  ← Volver
                </button>
                <h2 className="text-[26px] tracking-[-0.02em] text-[var(--gestion-color,inherit)]">Editar consulta</h2>
                <p className="mt-1 text-[14px] text-[var(--color-texto-suave)]">{consulta.numero}</p>
              </div>
            </header>
          )}

          {vista === 'actual' && (
            <VistaActual
              consulta={consulta}
              cambiandoEstado={cambiandoEstado}
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
              onConfirmarVenta={onConfirmarVenta}
              onEntregarVenta={onEntregarVenta}
              onCancelarVenta={onCancelarVenta}
            />
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
    </div>
  )
}

interface PropsVistaActual {
  consulta: ConsultaDetalleTipo
  cambiandoEstado: boolean
  onCambiarFormaPago: (forma: FormaPago) => void
  onArmarVenta: (consulta: ConsultaDetalleTipo) => void
  onEditar: () => void
  notaInterna: string
  onNotaInternaChange: (valor: string) => void
  onGuardarNota: () => void
  guardandoNota: boolean
  onConfirmarVenta: (metodo: MetodoPago) => void
  onEntregarVenta: () => void
  onCancelarVenta: () => void
}

function VistaActual({
  consulta,
  cambiandoEstado,
  onCambiarFormaPago,
  onArmarVenta,
  onEditar,
  notaInterna,
  onNotaInternaChange,
  onGuardarNota,
  guardandoNota,
  onConfirmarVenta,
  onEntregarVenta,
  onCancelarVenta,
}: PropsVistaActual) {
  const [itemsExpandidos, setItemsExpandidos] = useState<Set<number>>(new Set())

  const esCerrada = ['CONFIRMADA', 'CANCELADA', 'FINALIZADA'].includes(consulta?.estado)
  const esCanceladaReciente = consulta?.estado === 'CANCELADA' && !!consulta?.editable && !!consulta?.fechaLimite

  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  function textoRestante(limite: string | null | undefined): string {
    if (!limite) return ''
    const ms = new Date(limite).getTime() - ahora
    if (ms <= 0) return 'menos de 1 minuto'
    const totalMin = Math.ceil(ms / 60_000)
    const horas = Math.floor(totalMin / 60)
    const minutos = totalMin % 60
    return horas > 0 ? `${horas} h ${minutos} min` : `${minutos} min`
  }

  const telefonoDigits = (consulta.clienteTelefono ?? '').replace(/\D/g, '')
  const productosResumen = (consulta.productos ?? [])
    .map((p) => `• ${p.productoNombre} (${p.color}, talle ${p.talle}) x${p.cantidad}`)
    .join('\n')
  const mensajeWhatsApp = encodeURIComponent(
    `Hola! Somos ${consulta.tiendaNombre}. Vi tu consulta ${consulta.numero} y estoy aquí para ayudarte.\n\n${productosResumen}${consulta.observaciones ? `\n\n${consulta.observaciones}` : ''}`,
  )
  const urlWhatsApp = `https://wa.me/${telefonoDigits}?text=${mensajeWhatsApp}`

  const totalEstimado = (consulta.productos ?? []).reduce(
    (s, p) => s + (p.precioUnitario ?? 0) * (p.cantidad ?? 0),
    0,
  )

  function toggleItem(id: number) {
    setItemsExpandidos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <header className="sticky top-0 z-[1] flex items-start justify-between gap-3 border-b-2 border-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] px-5 pb-4 pr-16 pt-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[26px] tracking-[-0.02em] text-[var(--gestion-color,inherit)]">{consulta.numero}</h2>
            {consulta.version > 0 && (
              <span className="rounded-full px-2.5 py-0.5 text-[12px] font-bold" style={{ background: 'color-mix(in srgb, var(--gestion-color, var(--color-marca)) 12%, transparent)', color: 'var(--gestion-color, var(--color-marca))' }}>
                v{consulta.version + 1}
              </span>
            )}
          </div>
          <p className="mt-1 text-[14px] text-[var(--color-texto-suave)]">{formatearFecha(consulta.fechaConsulta)}</p>
        </div>
        <EstadoBadge estado={consulta.estado} />
      </header>

      {(consulta.estado === 'PENDIENTE' || esCanceladaReciente) && consulta.fechaLimite && (
        <div
          className="flex min-h-[38px] items-center gap-2 border-b border-[var(--color-borde)] px-5 py-2 text-[13px] font-semibold"
          style={{
            background: 'color-mix(in srgb, var(--gestion-color, var(--color-marca)) 10%, transparent)',
            color: 'var(--gestion-color, var(--color-marca))',
          }}
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {consulta.estado === 'PENDIENTE'
            ? `Se cancela automáticamente en ${textoRestante(consulta.fechaLimite)}`
            : `Podés editarla todavía · quedan ${textoRestante(consulta.fechaLimite)}`}
        </div>
      )}

      <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
        <p className={tituloSeccion}>Contacto</p>
        <p className="font-semibold text-[var(--color-marca)]">{consulta.clienteTelefono}</p>
        <p className="mt-2.5 text-[14px] text-[var(--color-texto-suave)]">
          Tienda: <strong>{consulta.tiendaNombre}</strong>
        </p>
        <a className={whatsappBtnGrande} href={urlWhatsApp} target="_blank" rel="noopener noreferrer">
          Abrir conversación en WhatsApp
        </a>
      </section>

      {consulta.observaciones && (
        <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
          <p className={tituloSeccion}>Observaciones</p>
          <p className="whitespace-pre-wrap leading-[1.6]">{consulta.observaciones}</p>
        </section>
      )}

      {!esCerrada && (
        <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
          <p className={tituloSeccion}>Nota interna</p>
          <p className="mb-2 text-[12px] italic text-[var(--color-texto-suave)]">
            Solo la ves vos. No se envía al cliente por WhatsApp.
          </p>
          <textarea
            className="min-h-[60px] w-full resize-y rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[#fef9ec] p-2.5 text-[14px] transition-[border-color] duration-200 focus:border-[#f59e0b] focus:outline-none"
            value={notaInterna}
            onChange={(e) => onNotaInternaChange(e.target.value)}
            placeholder="Ej: Cliente pidió que lo llamen después de las 18hs..."
            rows={3}
          />
          {(notaInterna ?? '') !== (consulta.notaInterna ?? '') && (
            <button
              type="button"
              className="mt-2 min-h-[34px] rounded-[var(--radius-sm)] border border-[#f59e0b] bg-[#f59e0b] px-3.5 text-[13px] font-semibold text-white transition-opacity duration-200 hover:opacity-85 disabled:opacity-50"
              onClick={onGuardarNota}
              disabled={guardandoNota}
            >
              {guardandoNota ? 'Guardando…' : 'Guardar nota'}
            </button>
          )}
        </section>
      )}

      <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
        <p className={tituloSeccion}>
          Productos ({consulta.totalItems} unidad{consulta.totalItems === 1 ? '' : 'es'})
        </p>
        <div className="flex flex-col gap-2">
          {(consulta.productos ?? []).map((item) => {
            const expandido = itemsExpandidos.has(item.id)
            return (
              <article key={item.id} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-borde)] bg-[var(--color-fondo)]">
                <div
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 select-none transition-colors duration-150"
                  style={{ background: 'color-mix(in srgb, var(--color-marca) 0%, transparent)' }}
                  onClick={() => toggleItem(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') toggleItem(item.id)
                  }}
                >
                  <img className="h-10 w-10 shrink-0 rounded-[var(--radius-sm)] object-cover" src={item.productoImagen} alt="" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold">{item.productoNombre}</p>
                    <p className="truncate text-[12px] text-[var(--color-texto-suave)]">
                      {item.color} · Talle {item.talle} · x{item.cantidad} · {formatearPrecio(item.precioUnitario)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[14px] font-bold">{formatearPrecio(item.precioUnitario * item.cantidad)}</span>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center text-[12px] text-[var(--color-texto-suave)] transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}>▼</span>
                </div>

                {expandido && (
                  <div className="border-t border-[var(--color-borde)] px-3 pb-3 pt-2">
                    {item.observaciones && <p className="mb-1.5 text-[13px] italic text-[var(--color-texto-suave)]">{item.observaciones}</p>}

                    {(item.variantes ?? []).length > 0 && (
                      <div className="mt-2.5">
                        <p className="mb-1.5 text-[12px] font-bold text-[var(--color-texto-suave)]">Stock disponible</p>
                        <div className="max-w-[360px] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-borde)]" role="table" aria-label="Stock de variantes">
                          <div className="grid grid-cols-3 text-[13px]">
                            <div className="flex flex-col">
                              <span className="border-b border-[var(--color-borde)] px-2.5 py-1.5 font-bold text-[var(--color-texto-suave)]" role="columnheader">Color</span>
                              {(item.variantes ?? []).map((v, i, arr) => (
                                <span key={v.id} className={`px-2.5 py-1.5 ${i < arr.length - 1 ? 'border-b border-[var(--color-borde)]' : ''}`} role="cell">
                                  {v.color}
                                </span>
                              ))}
                            </div>
                            <div className="flex flex-col">
                              <span className="border-b border-[var(--color-borde)] px-2.5 py-1.5 font-bold text-[var(--color-texto-suave)]" role="columnheader">Talle</span>
                              {(item.variantes ?? []).map((v, i, arr) => (
                                <span key={v.id} className={`px-2.5 py-1.5 ${i < arr.length - 1 ? 'border-b border-[var(--color-borde)]' : ''}`} role="cell">
                                  {v.talle}
                                </span>
                              ))}
                            </div>
                            <div className="flex flex-col">
                              <span className="border-b border-[var(--color-borde)] px-2.5 py-1.5 font-bold text-[var(--color-texto-suave)]" role="columnheader">Stock</span>
                              {(item.variantes ?? []).map((v, i, arr) => (
                                <span key={v.id} className={`px-2.5 py-1.5 ${i < arr.length - 1 ? 'border-b border-[var(--color-borde)]' : ''} ${v.stock <= 0 ? 'font-bold text-[#c0392b]' : ''}`} role="cell">
                                  {v.stock}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            )
          })}
        </div>

        <div className="mt-1 flex items-center justify-between border-t-2 border-[var(--color-borde)] py-3">
          <span className="text-[14px] font-semibold text-[var(--color-texto-suave)]">Total estimado</span>
          <span className="text-[18px] font-bold">{formatearPrecio(totalEstimado)}</span>
        </div>
      </section>

      {!esCerrada && (
        <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
          <div className="flex flex-col gap-2 border-t border-[var(--color-borde)] py-3">
            <span className="text-[12px] font-bold uppercase tracking-[0.04em] text-[var(--color-texto-suave)]">Forma de pago</span>
            <div className="flex gap-1.5">
              {(['EFECTIVO', 'TARJETA', 'DIGITAL'] as FormaPago[]).map((forma) => (
                <button
                  key={forma}
                  type="button"
                  className={`min-h-10 flex-1 rounded-[var(--radius-sm)] border px-3 py-2 text-center text-[13px] font-semibold transition-all duration-150 disabled:cursor-not-allowed ${
                    consulta.formaPago === forma
                      ? 'border-[var(--color-marca)] bg-[var(--color-marca)] text-white'
                      : 'border-[var(--color-borde)] bg-[var(--color-superficie)] text-[var(--color-texto)] hover:border-[var(--color-marca)]'
                  }`}
                  onClick={() => onCambiarFormaPago(forma)}
                  disabled={cambiandoEstado}
                >
                  {forma === 'EFECTIVO' ? 'Efectivo' : forma === 'TARJETA' ? 'Tarjeta' : 'Digital'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-[var(--color-borde)] py-3 pb-1">
            {!consulta?.ventaAsociada && consulta?.editable && (
              <>
                <button type="button" className={`${btnSecundario} w-full`} onClick={onEditar} disabled={cambiandoEstado}>
                  Editar consulta
                </button>
                <button type="button" className={`${btnConfirmar} w-full`} onClick={() => onArmarVenta(consulta)} disabled={cambiandoEstado}>
                  Armar venta
                </button>
              </>
            )}

            {consulta?.ventaAsociada === 'EN_PREPARACION' && (
              <>
                <button type="button" className={`${btnConfirmar} w-full`} onClick={() => onConfirmarVenta?.('EFECTIVO')} disabled={cambiandoEstado || !consulta?.ventaId}>
                  Confirmar compra
                </button>
                <button type="button" className={`${btnCancelar} w-full`} onClick={onCancelarVenta} disabled={cambiandoEstado || !consulta?.ventaId}>
                  Cancelar compra
                </button>
              </>
            )}

            {consulta?.ventaAsociada === 'CONFIRMADA' && (
              <>
                <button type="button" className={`${btnConfirmar} w-full`} onClick={onEntregarVenta} disabled={cambiandoEstado || !consulta?.ventaId}>
                  Marcar como entregado
                </button>
                <button type="button" className={`${btnCancelar} w-full`} onClick={onCancelarVenta} disabled={cambiandoEstado || !consulta?.ventaId}>
                  Cancelar
                </button>
              </>
            )}

            {esCanceladaReciente && consulta?.editable && (
              <button type="button" className={`${btnSecundario} w-full`} onClick={onEditar} disabled={cambiandoEstado}>
                Editar consulta
              </button>
            )}
          </div>
        </section>
      )}

      {esCerrada && !esCanceladaReciente && (
        <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
          <span className="text-[13px] font-semibold text-[var(--color-texto-suave)] opacity-70">
            {consulta?.estado === 'CONFIRMADA' ? 'Compra finalizada' : 'Consulta cerrada'}
          </span>
        </section>
      )}
    </>
  )
}

interface PropsVistaEditar {
  edicion: LineaEdicion[]
  motivo: string
  setMotivo: (valor: string) => void
  observacionesEdicion: string
  setObservacionesEdicion: (valor: string) => void
  productosFiltrados: Producto[]
  productoSeleccionado?: Producto
  variantesDisponibles: VarianteProducto[]
  coloresDisponibles: string[]
  tallesDisponibles: string[]
  agregarAbierto: boolean
  setAgregarAbierto: React.Dispatch<React.SetStateAction<boolean>>
  busquedaNuevo: string
  setBusquedaNuevo: (valor: string) => void
  nuevoProductoId: string
  setNuevoProductoId: (valor: string) => void
  nuevoColor: string
  setNuevoColor: (valor: string) => void
  nuevoTalle: string
  setNuevoTalle: (valor: string) => void
  nuevoCantidad: number
  setNuevoCantidad: (valor: number | ((prev: number) => number)) => void
  guardando: boolean
  error: string
  onCambiarVariante: (linea: LineaEdicion, varianteId: number) => void
  onCambiarCantidad: (linea: LineaEdicion, cantidad: string) => void
  onCambiarNota: (linea: LineaEdicion, observaciones: string) => void
  onQuitar: (linea: LineaEdicion) => void
  onAgregarProducto: () => void
  onGuardar: () => void
  onCancelar: () => void
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
}: PropsVistaEditar) {
  return (
    <>
      <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
        <p className={tituloSeccion}>Motivo de la modificación</p>
        <select className={`${inputBase} w-full`} value={motivo} onChange={(evento) => setMotivo(evento.target.value)} aria-label="Motivo de la modificación">
          <option value="">Seleccioná el motivo…</option>
          {MOTIVOS_MODIFICACION.map((m) => (
            <option key={m.valor} value={m.valor}>
              {m.etiqueta}
            </option>
          ))}
        </select>
      </section>

      <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <p className={tituloSeccion}>Productos</p>
          <button
            type="button"
            className="min-h-10 rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3.5 py-2 text-[13px] font-semibold text-[var(--color-marca)] transition-colors duration-200 hover:border-[var(--color-marca)] hover:bg-[var(--color-marca)] hover:text-white"
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
              <div className="grid max-h-[220px] grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2 overflow-y-auto">
                {productosFiltrados.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="flex flex-col items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-borde)] bg-[var(--color-superficie)] p-2 text-center transition-colors duration-150 hover:-translate-y-px hover:border-[var(--color-marca)]"
                    onClick={() => {
                      setNuevoProductoId(String(p.id))
                      setNuevoColor('')
                      setNuevoTalle('')
                    }}
                  >
                    <img className="h-14 w-14 rounded-[var(--radius-sm)] object-cover" src={p.imagen} alt={p.nombre} />
                    <span className="max-w-full truncate text-[12px] font-semibold leading-[1.2]">{p.nombre}</span>
                    <span className="text-[11px] text-[var(--color-texto-suave)]">{formatearPrecio(p.precio)}</span>
                  </button>
                ))}
              </div>
            )}

            {!nuevoProductoId && productosFiltrados.length === 0 && busquedaNuevo && (
              <p className="leading-[1.6]">No se encontraron productos.</p>
            )}

            {productoSeleccionado && (
              <>
                <div className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-marca)] bg-[var(--color-fondo)] p-2">
                  <img className="h-12 w-12 rounded-[var(--radius-sm)] object-cover" src={productoSeleccionado.imagen} alt={productoSeleccionado.nombre} />
                  <div>
                    <p className="text-[14px] font-semibold">{productoSeleccionado.nombre}</p>
                    <p className="text-[13px] text-[var(--color-texto-suave)]">{formatearPrecio(productoSeleccionado.precio)}</p>
                  </div>
                  <button
                    type="button"
                    className="ml-auto flex h-7 w-7 items-center justify-center rounded-full border-0 bg-transparent text-[16px] text-[var(--color-texto-suave)] transition-colors duration-200 hover:bg-[var(--color-borde)] hover:text-[var(--color-texto)]"
                    onClick={() => {
                      setNuevoProductoId('')
                      setNuevoColor('')
                      setNuevoTalle('')
                    }}
                  >
                    ✕
                  </button>
                </div>

                {coloresDisponibles.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-[var(--color-texto-suave)]">Color</p>
                    <div className="flex flex-wrap gap-1.5">
                      {coloresDisponibles.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`min-h-[34px] rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through ${
                            nuevoColor === c
                              ? 'border-[var(--color-marca)] bg-[var(--color-marca)] text-white'
                              : 'hover:border-[var(--color-marca)]'
                          }`}
                          onClick={() => {
                            setNuevoColor(c)
                            setNuevoTalle('')
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {nuevoColor && tallesDisponibles.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-[var(--color-texto-suave)]">Talle</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tallesDisponibles.map((t) => {
                        const variante = variantesDisponibles.find((v) => v.color === nuevoColor && v.talle === t)
                        const poco = variante && variante.stock <= 3
                        return (
                          <button
                            key={t}
                            type="button"
                            className={`min-h-[34px] rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through ${
                              nuevoTalle === t
                                ? 'border-[var(--color-marca)] bg-[var(--color-marca)] text-white'
                                : poco
                                  ? 'border-[#f59e0b] hover:border-[var(--color-marca)]'
                                  : 'hover:border-[var(--color-marca)]'
                            }`}
                            onClick={() => setNuevoTalle(t)}
                            disabled={!variante || variante.stock <= 0}
                          >
                            {t}
                            {poco && variante!.stock > 0 && (
                              <span className="ml-1 text-[10px] font-bold text-[#f59e0b]">{variante!.stock}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {nuevoColor && nuevoTalle && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] text-[18px] font-semibold transition-colors duration-200 hover:border-[var(--color-marca)] hover:bg-[var(--color-marca)] hover:text-white"
                        onClick={() => setNuevoCantidad((c) => Math.max(1, c - 1))}
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-[16px] font-bold">{nuevoCantidad}</span>
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] text-[18px] font-semibold transition-colors duration-200 hover:border-[var(--color-marca)] hover:bg-[var(--color-marca)] hover:text-white"
                        onClick={() => {
                          const max = variantesDisponibles.find((v) => v.color === nuevoColor && v.talle === nuevoTalle)?.stock ?? 10
                          setNuevoCantidad((c) => Math.min(max, c + 1))
                        }}
                      >
                        +
                      </button>
                      <button type="button" className="min-h-11 rounded-full border-0 bg-[var(--color-marca)] px-[18px] py-2 text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[var(--color-marca-oscuro)]" onClick={onAgregarProducto}>
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
          <p className="text-[14px] text-[var(--color-texto-suave)]">La consulta no tiene productos todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {edicion.map((linea) => (
              <article key={linea.clave} className="flex items-center gap-2.5 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-borde)] bg-[var(--color-fondo)] p-2">
                <img className="h-24 w-[72px] shrink-0 rounded-[var(--radius-sm)] object-cover" src={linea.productoImagen} alt={linea.productoNombre} />
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[15px] font-bold">{linea.productoNombre}</p>
                  <div className="mb-2 flex flex-wrap items-end gap-2.5">
                    <select
                      className={`${inputBase} min-w-0 flex-1`}
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
                    <label className="flex items-center gap-2 text-[13px] text-[var(--color-texto-suave)]">
                      Cant.
                      <input
                        className={`${inputBase} max-w-[90px]`}
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
                    className={`${inputBase} w-full`}
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
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] text-[14px] text-[#c0392b] transition-colors duration-200 hover:border-[#c0392b] hover:bg-[#fee2e2] disabled:cursor-not-allowed disabled:opacity-50"
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

      <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
        <p className={tituloSeccion}>Observaciones de la consulta</p>
        <textarea
          className={`${inputBase} min-h-[88px] w-full resize-y leading-[1.5]`}
          value={observacionesEdicion}
          onChange={(evento) => setObservacionesEdicion(evento.target.value)}
          rows={3}
          maxLength={1000}
          disabled={guardando}
          placeholder="Notas generales de la consulta…"
          aria-label="Observaciones de la consulta"
        />
      </section>

      <section className="border-b border-[var(--color-borde)] px-5 py-3.5">
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            className="min-h-11 rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-[18px] py-2 text-[14px] font-semibold transition-colors duration-200 hover:border-[var(--color-marca)] hover:bg-[var(--color-marca)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onCancelar}
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="min-h-11 rounded-full border-0 bg-[var(--color-marca)] px-[18px] py-2 text-[14px] font-bold text-white transition-colors duration-200 hover:bg-[var(--color-marca-oscuro)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onGuardar}
            disabled={guardando || edicion.length === 0}
          >
            {guardando ? 'Guardando…' : 'Guardar modificación'}
          </button>
        </div>
        {error && <p className="mt-2.5 text-[14px] text-[#c0392b]">{error}</p>}
      </section>
    </>
  )
}

export default ConsultaDetalle