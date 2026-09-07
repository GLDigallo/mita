import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import LoginForm from '../../components/LoginForm/LoginForm'
import EstadoBadge from '../../components/EstadoBadge/EstadoBadge'
import ConsultaDetalle from '../../components/ConsultaDetalle/ConsultaDetalle'
import ErrorBoundary from '../../components/ErrorBoundary/ErrorBoundary'
import VentaArmado from '../../components/VentaArmado/VentaArmado'
import VentaDetalle from '../../components/VentaDetalle/VentaDetalle'
import EmptyState from '../../components/EmptyState/EmptyState'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import PromosView from './PromosView/PromosView'
import MetricasView from './MetricasView/MetricasView'
import ProductosView from './ProductosView/ProductosView'
import {
  cancelarVenta,
  cambiarEstadoConsulta,
  cambiarFormaPagoConsulta,
  confirmarVenta,
  entregarVenta,
  fetchConsulta,
  fetchConsultas,
  fetchMe,
  fetchTiendas,
  fetchVentas,
  login,
  logout,
  formatearFecha,
  formatearPrecio,
  ESTADOS_CONSULTA,
  ESTADOS_VENTA,
} from '../../services/api'
import type {
  ConsultaDetalle as ConsultaDetalleTipo,
  ConsultaLista,
  EstadoConsulta,
  FormaPago,
  MetodoPago,
  Tienda,
  Usuario,
  VentaDetalle as VentaDetalleTipo,
  VentaLista,
} from '../../types'

type Sesion = 'cargando' | 'anonimo' | 'autenticado'

interface ConsultaParaArmar {
  id: number
  numero: string
  tiendaSlug: string
  clienteNombre: string
  clienteTelefono: string
  formaPago: FormaPago
}

const brilloFila =
  'animate-brillar h-[92px] border-0 bg-[linear-gradient(90deg,#eeece6_25%,#f6f4ef_50%,#eeece6_75%)] bg-[length:200%_100%]'

const estiloInput =
  'w-full min-h-12 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] p-3 text-[15px] text-[var(--color-texto)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--gestion-color,var(--color-marca))] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--gestion-color,var(--color-marca))_15%,transparent)] focus:outline-none'

const estiloFila =
  'w-full rounded-[var(--radius-md)] border border-[var(--color-borde)] border-l-[3px] border-l-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4 text-left font-[inherit] transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:border-[var(--gestion-color,var(--color-marca))] hover:shadow-[var(--shadow-md)]'

function GestionPage() {
  const [sesion, setSesion] = useState<Sesion>('cargando')
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  const { pathname } = useLocation()
  const seccion = pathname.replace(/\/+$/, '').split('/')[2] ?? 'inicio'

  const [tiendas, setTiendas] = useState<Tienda[]>([])

  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [tiendaIdFiltro, setTiendaIdFiltro] = useState('')
  const [busquedaInput, setBusquedaInput] = useState('')
  const [busquedaAplicada, setBusquedaAplicada] = useState('')
  const [consultas, setConsultas] = useState<ConsultaLista[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [ventaEstadoFiltro, setVentaEstadoFiltro] = useState('')
  const [ventaTiendaIdFiltro, setVentaTiendaIdFiltro] = useState('')
  const [ventaBusquedaInput, setVentaBusquedaInput] = useState('')
  const [ventaBusquedaAplicada, setVentaBusquedaAplicada] = useState('')
  const [ventas, setVentas] = useState<VentaLista[]>([])
  const [cargandoVentas, setCargandoVentas] = useState(true)
  const [errorVentas, setErrorVentas] = useState('')

  const [consultasTodas, setConsultasTodas] = useState<ConsultaLista[]>([])
  const [ventasTodas, setVentasTodas] = useState<VentaLista[]>([])

  const [detalleId, setDetalleId] = useState<number | null>(null)
  const [detalle, setDetalle] = useState<ConsultaDetalleTipo | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState('')
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  const [armando, setArmando] = useState<{ consulta: ConsultaParaArmar; ventaInicial: VentaDetalleTipo | null } | null>(null)
  const [ventaDetalleId, setVentaDetalleId] = useState<number | null>(null)
  const [notificacion, setNotificacion] = useState<string | null>(null)
  const consultasSnapshot = useRef(0)

  const esDueno = usuario?.rol === 'DUENO'
  const esEncargada = usuario?.rol === 'ENCARGADA'
  const miTiendaId = usuario?.tiendaId != null ? String(usuario.tiendaId) : ''
  const tiendaUsuario = tiendas.find((t) => t.slug === usuario?.tiendaSlug) ?? tiendas[0] ?? null
  const colorTienda = tiendaUsuario?.colorPrimario ?? null
  const colorTiendaSec = tiendaUsuario?.colorSecundario ?? null

  const estiloTienda = colorTienda
    ? ({ '--gestion-color': colorTienda, '--gestion-color-sec': colorTiendaSec } as CSSProperties)
    : undefined

  useEffect(() => {
    if (sesion !== 'autenticado') return
    if (esEncargada && miTiendaId) {
      setTiendaIdFiltro(String(miTiendaId))
      setVentaTiendaIdFiltro(String(miTiendaId))
    }
  }, [sesion, esEncargada, miTiendaId])

  useEffect(() => {
    let activo = true
    fetchMe()
      .then((me) => {
        if (!activo) return
        setUsuario(me)
        setSesion('autenticado')
      })
      .catch(() => {
        if (activo) setSesion('anonimo')
      })
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    function onAuthExpired() {
      setSesion('anonimo')
      setUsuario(null)
      setConsultas([])
      setVentas([])
      setDetalleId(null)
      setDetalle(null)
      setArmando(null)
    }
    window.addEventListener('auth:expired', onAuthExpired)
    return () => window.removeEventListener('auth:expired', onAuthExpired)
  }, [])

  useEffect(() => {
    if (sesion !== 'autenticado') return
    let activo = true
    fetchTiendas()
      .then((datos) => {
        if (activo) setTiendas(datos)
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [sesion])

  const cargarConsultas = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const datos = await fetchConsultas({
        estado: estadoFiltro,
        tiendaId: tiendaIdFiltro,
        busqueda: busquedaAplicada,
      })
      setConsultas(datos)
      if (consultasSnapshot.current === 0) {
        consultasSnapshot.current = datos.filter((c) => c.estado === 'PENDIENTE').length
      }
    } catch (err) {
      setError((err as Error).message)
      setConsultas([])
    } finally {
      setCargando(false)
    }
    try {
      const todas = await fetchConsultas({
        estado: '',
        tiendaId: esDueno ? '' : String(usuario?.tiendaId ?? ''),
        busqueda: '',
      })
      setConsultasTodas(todas)
    } catch {}
  }, [estadoFiltro, tiendaIdFiltro, busquedaAplicada, esDueno, usuario])

  const cargarVentas = useCallback(async () => {
    setCargandoVentas(true)
    setErrorVentas('')
    try {
      const datos = await fetchVentas({
        estado: ventaEstadoFiltro,
        tiendaId: ventaTiendaIdFiltro,
        busqueda: ventaBusquedaAplicada,
      })
      setVentas(datos)
    } catch (err) {
      setErrorVentas((err as Error).message)
      setVentas([])
    } finally {
      setCargandoVentas(false)
    }
    try {
      const todas = await fetchVentas({
        estado: '',
        tiendaId: esDueno ? '' : String(usuario?.tiendaId ?? ''),
        busqueda: '',
      })
      setVentasTodas(todas)
    } catch {}
  }, [ventaEstadoFiltro, ventaTiendaIdFiltro, ventaBusquedaAplicada, esDueno, usuario])

  useEffect(() => {
    if (sesion === 'autenticado' && (seccion === 'consultas' || seccion === 'inicio')) {
      cargarConsultas().catch(() => {})
    }
  }, [sesion, seccion, cargarConsultas])

  useEffect(() => {
    if (sesion !== 'autenticado') return
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    let audioCtx: AudioContext | null = null
    function playBeep() {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.frequency.value = 880
        osc.type = 'sine'
        gain.gain.value = 0.15
        osc.start()
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3)
        osc.stop(audioCtx.currentTime + 0.3)
      } catch {}
    }
    const intervalo = setInterval(() => {
      fetchConsultas({ estado: '', tiendaId: esDueno ? '' : String(usuario?.tiendaId ?? ''), busqueda: '' })
        .then((datos) => {
          const pendientes = datos.filter((c) => c.estado === 'PENDIENTE').length
          const snapshot = consultasSnapshot.current
          if (snapshot > 0 && pendientes > snapshot) {
            const nuevas = pendientes - snapshot
            setNotificacion(`${nuevas} nueva${nuevas > 1 ? 's' : ''} consulta${nuevas > 1 ? 's' : ''} pendiente${nuevas > 1 ? 's' : ''}`)
            try {
              playBeep()
            } catch {}
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => setNotificacion(null), 6000)
          }
          consultasSnapshot.current = pendientes
        })
        .catch(() => {})
    }, 30000)
    return () => {
      clearInterval(intervalo)
      clearTimeout(timeoutId)
      if (audioCtx) audioCtx.close().catch(() => {})
    }
  }, [sesion, esDueno, usuario])

  useEffect(() => {
    if (sesion === 'autenticado' && (seccion === 'ventas' || seccion === 'inicio')) {
      cargarVentas().catch(() => {})
    }
  }, [sesion, seccion, cargarVentas])

  useEffect(() => {
    if (sesion !== 'autenticado' || seccion !== 'metricas') return
    Promise.all([cargarConsultas(), cargarVentas()]).catch(() => {})
  }, [sesion, seccion, cargarConsultas, cargarVentas])

  useEffect(() => {
    if (!detalleId) {
      setDetalle(null)
      setErrorDetalle('')
      return
    }
    let activo = true
    setCargandoDetalle(true)
    setDetalle(null)
    setErrorDetalle('')
    fetchConsulta(detalleId)
      .then((datos) => {
        if (activo) setDetalle(datos)
      })
      .catch((err: Error) => {
        if (activo) setErrorDetalle(err.message || 'No se pudo cargar el detalle')
      })
      .finally(() => {
        if (activo) setCargandoDetalle(false)
      })
    return () => {
      activo = false
    }
  }, [detalleId])

  async function manejarLogin(nombreUsuario: string, clave: string) {
    const autenticado = await login(nombreUsuario, clave)
    setUsuario(autenticado)
    setSesion('autenticado')
  }

  async function manejarLogout() {
    try {
      await logout()
    } catch {
      // aún así se limpia la sesión local
    }
    setSesion('anonimo')
    setUsuario(null)
    setConsultas([])
    setVentas([])
    setConsultasTodas([])
    setVentasTodas([])
    setDetalleId(null)
    setDetalle(null)
    setErrorDetalle('')
    setArmando(null)
    setVentaDetalleId(null)
    setNotificacion(null)
    setEstadoFiltro('')
    setTiendaIdFiltro('')
    setBusquedaInput('')
    setBusquedaAplicada('')
    setVentaEstadoFiltro('')
    setVentaTiendaIdFiltro('')
    setVentaBusquedaInput('')
    setVentaBusquedaAplicada('')
    consultasSnapshot.current = 0
  }

  function manejarBusqueda(evento: React.FormEvent) {
    evento.preventDefault()
    setBusquedaAplicada(busquedaInput.trim())
  }

  function manejarBusquedaVentas(evento: React.FormEvent) {
    evento.preventDefault()
    setVentaBusquedaAplicada(ventaBusquedaInput.trim())
  }

  async function manejarCambioEstado(estado: EstadoConsulta) {
    if (!detalle) return
    setCambiandoEstado(true)
    try {
      const actualizada = await cambiarEstadoConsulta(detalle.id, estado)
      const indices = consultas
        .map((c, i) => (c.id === actualizada.id ? i : -1))
        .filter((i) => i !== -1)
      if (indices.length > 0) {
        setConsultas((actuales) => {
          const copia = [...actuales]
          copia[indices[0]] = { ...copia[indices[0]], estado: actualizada.estado }
          return copia
        })
      }
      if (estado === 'CANCELADA' || estado === 'FINALIZADA') {
        setDetalleId(null)
        setDetalle(null)
      } else {
        setDetalle(actualizada)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCambiandoEstado(false)
    }
  }

  async function manejarConfirmarVenta(metodoPago: MetodoPago) {
    if (!detalle?.ventaId) return
    setCambiandoEstado(true)
    try {
      await confirmarVenta(detalle.ventaId, metodoPago)
      const actualizada = await fetchConsulta(detalle.id)
      setDetalle(actualizada)
      const indices = consultas
        .map((c, i) => (c.id === actualizada.id ? i : -1))
        .filter((i) => i !== -1)
      if (indices.length > 0) {
        setConsultas((actuales) => {
          const copia = [...actuales]
          copia[indices[0]] = { ...copia[indices[0]], estado: actualizada.estado }
          return copia
        })
      }
      cargarVentas()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCambiandoEstado(false)
    }
  }

  async function manejarEntregarVenta() {
    if (!detalle?.ventaId) return
    setCambiandoEstado(true)
    try {
      await entregarVenta(detalle.ventaId)
      const actualizada = await fetchConsulta(detalle.id)
      setDetalle(actualizada)
      const indices = consultas
        .map((c, i) => (c.id === actualizada.id ? i : -1))
        .filter((i) => i !== -1)
      if (indices.length > 0) {
        setConsultas((actuales) => {
          const copia = [...actuales]
          copia[indices[0]] = { ...copia[indices[0]], estado: actualizada.estado }
          return copia
        })
      }
      cargarVentas()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCambiandoEstado(false)
    }
  }

  async function manejarCancelarVenta() {
    if (!detalle?.ventaId) return
    setCambiandoEstado(true)
    try {
      await cancelarVenta(detalle.ventaId)
      const actualizada = await fetchConsulta(detalle.id)
      setDetalle(actualizada)
      const indices = consultas
        .map((c, i) => (c.id === actualizada.id ? i : -1))
        .filter((i) => i !== -1)
      if (indices.length > 0) {
        setConsultas((actuales) => {
          const copia = [...actuales]
          copia[indices[0]] = { ...copia[indices[0]], estado: actualizada.estado }
          return copia
        })
      }
      cargarVentas()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCambiandoEstado(false)
    }
  }

  async function manejarCambioFormaPago(formaPago: FormaPago) {
    if (!detalle) return
    setCambiandoEstado(true)
    try {
      const actualizada = await cambiarFormaPagoConsulta(detalle.id, formaPago)
      setDetalle(actualizada)
      const indices = consultas
        .map((c, i) => (c.id === actualizada.id ? i : -1))
        .filter((i) => i !== -1)
      if (indices.length > 0) {
        setConsultas((actuales) => {
          const copia = [...actuales]
          copia[indices[0]] = { ...copia[indices[0]] }
          return copia
        })
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCambiandoEstado(false)
    }
  }

  function manejarModificada(actualizada: ConsultaDetalleTipo) {
    setDetalle(actualizada)
    const indices = consultas
      .map((c, i) => (c.id === actualizada.id ? i : -1))
      .filter((i) => i !== -1)
    if (indices.length > 0) {
      setConsultas((actuales) => {
        const copia = [...actuales]
        copia[indices[0]] = {
          ...copia[indices[0]],
          numero: actualizada.numero,
          totalItems: actualizada.totalItems,
        }
        return copia
      })
    }
  }

  function manejarArmarVenta(consulta: ConsultaDetalleTipo) {
    setDetalleId(null)
    setArmando({ consulta, ventaInicial: null })
  }

  function manejarEditarVenta(venta: VentaDetalleTipo) {
    setVentaDetalleId(null)
    setArmando({
      consulta: {
        id: venta.consultaId,
        numero: venta.consultaNumero,
        tiendaSlug: venta.tiendaSlug,
        clienteNombre: venta.clienteNombre,
        clienteTelefono: venta.clienteTelefono,
        formaPago: 'EFECTIVO',
      },
      ventaInicial: venta,
    })
  }

  function refrescar() {
    if (seccion === 'consultas') cargarConsultas()
    cargarVentas()
  }

  if (sesion === 'cargando') {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-12 md:px-6 md:py-8 md:pb-14">
        Cargando…
      </div>
    )
  }

  if (sesion === 'anonimo') {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--color-gestion-fondo,#f5f5f0)]">
        <header className="flex items-center justify-between border-b border-[var(--color-borde)] bg-[var(--gestion-color,var(--color-superficie))] px-5 text-white md:px-6">
          <Link to="/" className="font-[var(--font-display)] text-[20px] font-bold tracking-[-0.02em] text-white">
            AgrandaditosTienda
            <span className="ml-2 text-[13px] text-white/70">home</span>
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-6">
          <LoginForm onLogin={manejarLogin} />
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'color-mix(in srgb, var(--gestion-color, #f5f5f0) 6%, #f5f5f0)', ...estiloTienda } as CSSProperties}>
      <header className="flex items-center justify-between gap-3 border-b border-[var(--color-borde)] bg-[var(--gestion-color,var(--color-superficie))] px-5 py-4 text-white md:px-6">
        <Link to="/" className="font-[var(--font-display)] text-[20px] font-bold tracking-[-0.02em] text-white">
          AgrandaditosTienda
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-[14px] font-semibold text-white">
            {usuario?.nombre ?? usuario?.usuario}
            {esDueno ? ' · Dueño' : usuario?.tiendaNombre ? ` · ${usuario.tiendaNombre}` : ''}
          </span>
          <button type="button" className="rounded-full border border-white/40 bg-transparent px-4 font-semibold text-white transition-colors duration-200 hover:border-white hover:bg-white/15" onClick={manejarLogout}>
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-12 md:px-6 md:py-8 md:pb-14">
        {notificacion && (
          <div className="sticky top-0 z-10 mb-4 rounded-[var(--radius-sm)] bg-[var(--gestion-color,#059669)] px-4 py-2.5 text-center text-[14px] font-semibold text-white animate-abrir-notif">
            {notificacion}
          </div>
        )}

        {seccion !== 'inicio' && (
          <Link to="/home" className="mb-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--color-texto-suave)] transition-colors duration-200 hover:text-[var(--gestion-color,var(--color-marca))]">
            ← Volver al inicio
          </Link>
        )}

        {seccion === 'inicio' ? (
          <section className="flex flex-col gap-5">
            <h2 className="text-[22px] tracking-[-0.02em] text-[var(--gestion-color,inherit)]">
              Hola, {usuario?.nombre ?? usuario?.usuario}
            </h2>
            <p className="mt-1 text-[15px] text-[var(--color-texto-suave)]">¿Qué necesitás hacer hoy?</p>

            {esEncargada &&
              (consultas.filter((c) => c.estado === 'PENDIENTE').length > 0 ||
                consultas.filter((c) => c.estado === 'EN_REVISION').length > 0) && (
                <div className="rounded-[var(--radius-md)] border border-[var(--color-borde)] border-t-[3px] border-t-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4">
                  <h3 className="mb-3 text-[14px] font-bold uppercase tracking-[0.04em] text-[var(--color-texto-suave)]">
                    Lo que tengo que hacer hoy
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {consultas.filter((c) => c.estado === 'PENDIENTE').length > 0 && (
                      <Link to="/home/consultas" className="flex flex-col items-center rounded-[var(--radius-sm)] border border-[var(--color-borde)] p-3 transition-colors duration-200 hover:-translate-y-px hover:border-[var(--gestion-color,var(--color-marca))]">
                        <span className="text-[24px] font-extrabold leading-none text-[var(--gestion-color,var(--color-marca))]">
                          {consultas.filter((c) => c.estado === 'PENDIENTE').length}
                        </span>
                        <span className="mt-1 text-center text-[12px] text-[var(--color-texto-suave)]">consultas pendientes</span>
                      </Link>
                    )}
                    {consultas.filter((c) => c.estado === 'EN_REVISION').length > 0 && (
                      <Link to="/home/consultas" className="flex flex-col items-center rounded-[var(--radius-sm)] border border-[var(--color-borde)] p-3 transition-colors duration-200 hover:-translate-y-px hover:border-[var(--gestion-color,var(--color-marca))]">
                        <span className="text-[24px] font-extrabold leading-none text-[var(--gestion-color,var(--color-marca))]">
                          {consultas.filter((c) => c.estado === 'EN_REVISION').length}
                        </span>
                        <span className="mt-1 text-center text-[12px] text-[var(--color-texto-suave)]">en revisión</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}

            <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
              {esEncargada && (
                <Link to="/home/consultas" className="flex aspect-square flex-col items-center justify-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-t-[3px] border-t-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:border-[var(--gestion-color,var(--color-marca))] hover:shadow-[var(--shadow-md)]">
                  <svg className="h-8 w-8 text-[var(--gestion-color,var(--color-marca))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="text-[16px] font-bold">Consultas</span>
                  <span className="text-center text-[13px] text-[var(--color-texto-suave)]">
                    {tiendaUsuario ? `${tiendaUsuario.nombre}: ` : ''}
                    {consultas.filter((c) => c.estado === 'PENDIENTE').length} pendientes
                  </span>
                </Link>
              )}

              {esDueno && (
                <Link to="/home/ventas" className="flex aspect-square flex-col items-center justify-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-t-[3px] border-t-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:border-[var(--gestion-color,var(--color-marca))] hover:shadow-[var(--shadow-md)]">
                  <svg className="h-8 w-8 text-[var(--gestion-color,var(--color-marca))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span className="text-[16px] font-bold">Ventas</span>
                  <span className="text-center text-[13px] text-[var(--color-texto-suave)]">{ventas.length} registradas</span>
                </Link>
              )}

              {esEncargada && (
                <Link to="/home/productos" className="flex aspect-square flex-col items-center justify-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-t-[3px] border-t-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:border-[var(--gestion-color,var(--color-marca))] hover:shadow-[var(--shadow-md)]">
                  <svg className="h-8 w-8 text-[var(--gestion-color,var(--color-marca))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span className="text-[16px] font-bold">Productos</span>
                  <span className="text-center text-[13px] text-[var(--color-texto-suave)]">Mi catálogo</span>
                </Link>
              )}

              {esDueno && (
                <Link to="/home/promos" className="flex aspect-square flex-col items-center justify-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-t-[3px] border-t-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:border-[var(--gestion-color,var(--color-marca))] hover:shadow-[var(--shadow-md)]">
                  <svg className="h-8 w-8 text-[var(--gestion-color,var(--color-marca))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.59 13.41 12 22 2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <circle cx="7.5" cy="7.5" r="0.5" fill="currentColor" />
                  </svg>
                  <span className="text-[16px] font-bold">Promos</span>
                  <span className="text-center text-[13px] text-[var(--color-texto-suave)]">Organizá promociones</span>
                </Link>
              )}

              {esDueno && (
                <Link to="/home/metricas" className="flex aspect-square flex-col items-center justify-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-t-[3px] border-t-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-4 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:border-[var(--gestion-color,var(--color-marca))] hover:shadow-[var(--shadow-md)]">
                  <svg className="h-8 w-8 text-[var(--gestion-color,var(--color-marca))]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 20v-6" />
                    <path d="M6 20V10" />
                    <path d="M18 20V4" />
                  </svg>
                  <span className="text-[16px] font-bold">Métricas</span>
                  <span className="text-center text-[13px] text-[var(--color-texto-suave)]">Resultados por tienda</span>
                </Link>
              )}
            </div>
          </section>
        ) : seccion === 'consultas' && esEncargada ? (
          <>
            <form className="mb-5 grid grid-cols-1 gap-2.5 md:grid-cols-[1fr_220px_220px]" onSubmit={manejarBusqueda}>
              <input
                className={estiloInput}
                type="search"
                value={busquedaInput}
                onChange={(evento) => setBusquedaInput(evento.target.value)}
                placeholder="Buscar por número, nombre o teléfono"
                aria-label="Buscar consultas"
              />
              <select
                className={estiloInput}
                value={estadoFiltro}
                onChange={(evento) => setEstadoFiltro(evento.target.value)}
                aria-label="Filtrar por estado"
              >
                <option value="">Todos los estados</option>
                {ESTADOS_CONSULTA.map((e) => (
                  <option key={e.valor} value={e.valor}>
                    {e.etiqueta}
                  </option>
                ))}
              </select>
              {esDueno && (
                <select
                  className={estiloInput}
                  value={tiendaIdFiltro}
                  onChange={(evento) => setTiendaIdFiltro(evento.target.value)}
                  aria-label="Filtrar por tienda"
                >
                  <option value="">Todas las tiendas</option>
                  {tiendas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              )}
            </form>

            {error && <ErrorMessage message={error} />}

            {cargando ? (
              <div className="flex flex-col gap-2.5">
                {Array.from({ length: 6 }).map((_, indice) => (
                  <div key={indice} className={`${estiloFila} ${brilloFila}`} />
                ))}
              </div>
            ) : consultas.length === 0 ? (
              <EmptyState titulo="Sin consultas" texto="No hay consultas que coincidan con la búsqueda." />
            ) : (
              <div className="flex flex-col gap-2.5">
                {consultas.map((consulta) => (
                  <button
                    key={consulta.id}
                    type="button"
                    className={estiloFila}
                    onClick={() => setDetalleId(consulta.id)}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2.5">
                      <span className="font-[var(--font-display)] text-[18px] font-bold">{consulta.numero}</span>
                      <EstadoBadge estado={consulta.estado} />
                    </div>
                    <p className="mb-1 text-[15px] font-semibold">
                      {consulta.clienteNombre ?? 'Sin nombre'} · {consulta.clienteTelefono}
                    </p>
                    <p className="text-[13px] text-[var(--color-texto-suave)]">
                      {consulta.tiendaNombre} · {consulta.totalItems} unidad{consulta.totalItems === 1 ? '' : 'es'} ·{' '}
                      {formatearFecha(consulta.fechaConsulta)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : esDueno && seccion === 'ventas' ? (
          <>
            <form className="mb-5 grid grid-cols-1 gap-2.5 md:grid-cols-[1fr_220px_220px]" onSubmit={manejarBusquedaVentas}>
              <input
                className={estiloInput}
                type="search"
                value={ventaBusquedaInput}
                onChange={(evento) => setVentaBusquedaInput(evento.target.value)}
                placeholder="Buscar por número, nombre o teléfono"
                aria-label="Buscar ventas"
              />
              <select
                className={estiloInput}
                value={ventaEstadoFiltro}
                onChange={(evento) => setVentaEstadoFiltro(evento.target.value)}
                aria-label="Filtrar ventas por estado"
              >
                <option value="">Todos los estados</option>
                {ESTADOS_VENTA.map((e) => (
                  <option key={e.valor} value={e.valor}>
                    {e.etiqueta}
                  </option>
                ))}
              </select>
              {esDueno && (
                <select
                  className={estiloInput}
                  value={ventaTiendaIdFiltro}
                  onChange={(evento) => setVentaTiendaIdFiltro(evento.target.value)}
                  aria-label="Filtrar ventas por tienda"
                >
                  <option value="">Todas las tiendas</option>
                  {tiendas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              )}
            </form>

            {errorVentas && <ErrorMessage message={errorVentas} />}

            {cargandoVentas ? (
              <div className="flex flex-col gap-2.5">
                {Array.from({ length: 6 }).map((_, indice) => (
                  <div key={indice} className={`${estiloFila} ${brilloFila}`} />
                ))}
              </div>
            ) : ventas.length === 0 ? (
              <EmptyState titulo="Sin ventas" texto="No hay ventas que coincidan con la búsqueda." />
            ) : (
              <div className="flex flex-col gap-2.5">
                {ventas.map((venta) => (
                  <button
                    key={venta.id}
                    type="button"
                    className={estiloFila}
                    onClick={() => setVentaDetalleId(venta.id)}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2.5">
                      <span className="font-[var(--font-display)] text-[18px] font-bold">{venta.numero}</span>
                      <EstadoBadge estado={venta.estado} />
                    </div>
                    <p className="mb-1 text-[15px] font-semibold">
                      {venta.clienteNombre ?? 'Sin nombre'} · {venta.clienteTelefono}
                    </p>
                    <p className="text-[13px] text-[var(--color-texto-suave)]">
                      {venta.tiendaNombre} · {venta.consultaNumero}
                      {venta.fechaVenta ? ` · ${formatearFecha(venta.fechaVenta)}` : ' · en preparación'} ·{' '}
                      {venta.importeTotal ? formatearPrecio(venta.importeTotal) : 'sin importe'}
                      {venta.empleado ? ` · ${venta.empleado}` : ''}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : esDueno && seccion === 'promos' ? (
          <PromosView tiendas={tiendas} usuario={usuario} />
        ) : seccion === 'productos' && esEncargada ? (
          <ProductosView tienda={tiendaUsuario} esDueno={esDueno} tiendas={tiendas} />
        ) : esDueno && seccion === 'metricas' ? (
          <MetricasView tiendas={tiendas} consultas={consultasTodas} ventas={ventasTodas} />
        ) : (
          <Navigate to="/home" replace />
        )}
      </main>

      {detalleId && cargandoDetalle && !detalle && (
        <div className="fixed inset-0 z-[calc(var(--z-modal)-1)] flex items-center justify-center text-[15px] text-[var(--color-texto-suave)]">
          Cargando detalle…
        </div>
      )}
      {detalleId && errorDetalle && !cargandoDetalle && (
        <div className="fixed inset-0 z-[calc(var(--z-modal)-1)] flex items-center justify-center text-[15px] text-[var(--color-texto-suave)]">
          <div className="text-center">
            <p className="mb-3">{errorDetalle}</p>
            <button
              type="button"
              onClick={() => {
                setDetalleId(null)
                setErrorDetalle('')
              }}
              className="cursor-pointer rounded-lg border-0 bg-[var(--color-marca)] px-5 py-2 font-semibold text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {detalleId && detalle && (
        <ErrorBoundary onCerrar={() => { setDetalleId(null); setErrorDetalle('') }}>
          <ConsultaDetalle
            consulta={detalle}
            onCerrar={() => { setDetalleId(null); setErrorDetalle('') }}
            onCambiarEstado={manejarCambioEstado}
            cambiandoEstado={cambiandoEstado}
            onCambiarFormaPago={manejarCambioFormaPago}
            onArmarVenta={manejarArmarVenta}
            onModificada={manejarModificada}
            onConfirmarVenta={manejarConfirmarVenta}
            onEntregarVenta={manejarEntregarVenta}
            onCancelarVenta={manejarCancelarVenta}
          />
        </ErrorBoundary>
      )}

      {armando && (
        <VentaArmado
          consulta={armando.consulta}
          ventaInicial={armando.ventaInicial}
          onCerrar={() => setArmando(null)}
          onConfirmada={() => {
            setArmando(null)
            refrescar()
          }}
          onCancelada={() => {
            setArmando(null)
            refrescar()
          }}
        />
      )}

      {ventaDetalleId && (
        <VentaDetalle
          ventaId={ventaDetalleId}
          onCerrar={() => setVentaDetalleId(null)}
          onActualizada={() => refrescar()}
          onEditar={manejarEditarVenta}
        />
      )}
    </div>
  )
}

export default GestionPage