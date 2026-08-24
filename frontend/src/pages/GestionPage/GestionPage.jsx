import { useCallback, useEffect, useRef, useState } from 'react'
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
import styles from './GestionPage.module.css'

function GestionPage() {
  const [sesion, setSesion] = useState('cargando')
  const [usuario, setUsuario] = useState(null)

  const { pathname } = useLocation()
  const seccion = pathname.replace(/\/+$/, '').split('/')[2] ?? 'inicio'

  const [tiendas, setTiendas] = useState([])

  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [tiendaIdFiltro, setTiendaIdFiltro] = useState('')
  const [busquedaInput, setBusquedaInput] = useState('')
  const [busquedaAplicada, setBusquedaAplicada] = useState('')
  const [consultas, setConsultas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [ventaEstadoFiltro, setVentaEstadoFiltro] = useState('')
  const [ventaTiendaIdFiltro, setVentaTiendaIdFiltro] = useState('')
  const [ventaBusquedaInput, setVentaBusquedaInput] = useState('')
  const [ventaBusquedaAplicada, setVentaBusquedaAplicada] = useState('')
  const [ventas, setVentas] = useState([])
  const [cargandoVentas, setCargandoVentas] = useState(true)
  const [errorVentas, setErrorVentas] = useState('')

  const [consultasTodas, setConsultasTodas] = useState([])
  const [ventasTodas, setVentasTodas] = useState([])

  const [detalleId, setDetalleId] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState('')
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  const [armando, setArmando] = useState(null)
  const [ventaDetalleId, setVentaDetalleId] = useState(null)
  const [notificacion, setNotificacion] = useState(null)
  const consultasSnapshot = useRef(0)

  const esDueño = usuario?.rol === 'DUENO'
  const esEncargada = usuario?.rol === 'ENCARGADA'
  const miTiendaId = usuario?.tiendaId ?? ''
  const tiendaUsuario = tiendas.find((t) => t.slug === usuario?.tiendaSlug) ?? tiendas[0] ?? null
  const colorTienda = tiendaUsuario?.colorPrimario ?? null
  const colorTiendaSec = tiendaUsuario?.colorSecundario ?? null

  const estiloTienda = colorTienda
    ? { '--gestion-color': colorTienda, '--gestion-color-sec': colorTiendaSec }
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
      .then((datos) => { if (activo) setTiendas(datos) })
      .catch(() => {})
    return () => { activo = false }
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
      setError(err.message)
      setConsultas([])
    } finally {
      setCargando(false)
    }
    try {
      const todas = await fetchConsultas({
        estado: '',
        tiendaId: esDueño ? '' : (usuario?.tiendaId ?? ''),
        busqueda: '',
      })
      setConsultasTodas(todas)
    } catch {}
  }, [estadoFiltro, tiendaIdFiltro, busquedaAplicada, esDueño, usuario])

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
      setErrorVentas(err.message)
      setVentas([])
    } finally {
      setCargandoVentas(false)
    }
    try {
      const todas = await fetchVentas({
        estado: '',
        tiendaId: esDueño ? '' : (usuario?.tiendaId ?? ''),
        busqueda: '',
      })
      setVentasTodas(todas)
    } catch {}
  }, [ventaEstadoFiltro, ventaTiendaIdFiltro, ventaBusquedaAplicada, esDueño, usuario])

  useEffect(() => {
    if (sesion === 'autenticado' && (seccion === 'consultas' || seccion === 'inicio')) {
      cargarConsultas().catch(() => {})
    }
  }, [sesion, seccion, cargarConsultas])

  useEffect(() => {
    if (sesion !== 'autenticado') return
    let timeoutId
    let audioCtx = null
    function playBeep() {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
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
      fetchConsultas({ estado: '', tiendaId: esDueño ? '' : (usuario?.tiendaId ?? ''), busqueda: '' })
        .then((datos) => {
          const pendientes = datos.filter((c) => c.estado === 'PENDIENTE').length
          const snapshot = consultasSnapshot.current
          if (snapshot > 0 && pendientes > snapshot) {
            const nuevas = pendientes - snapshot
            setNotificacion(`${nuevas} nueva${nuevas > 1 ? 's' : ''} consulta${nuevas > 1 ? 's' : ''} pendiente${nuevas > 1 ? 's' : ''}`)
            try { playBeep() } catch {}
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
  }, [sesion, esDueño, usuario])

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
      .catch((err) => {
        if (activo) setErrorDetalle(err.message || 'No se pudo cargar el detalle')
      })
      .finally(() => {
        if (activo) setCargandoDetalle(false)
      })
    return () => {
      activo = false
    }
  }, [detalleId])

  async function manejarLogin(nombreUsuario, clave) {
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

  function manejarBusqueda(evento) {
    evento.preventDefault()
    setBusquedaAplicada(busquedaInput.trim())
  }

  function manejarBusquedaVentas(evento) {
    evento.preventDefault()
    setVentaBusquedaAplicada(ventaBusquedaInput.trim())
  }

  async function manejarCambioEstado(estado) {
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
      setError(err.message)
    } finally {
      setCambiandoEstado(false)
    }
  }

  async function manejarConfirmarVenta(metodoPago) {
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
      setError(err.message)
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
      setError(err.message)
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
      setError(err.message)
    } finally {
      setCambiandoEstado(false)
    }
  }

  async function manejarCambioFormaPago(formaPago) {
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
          copia[indices[0]] = { ...copia[indices[0]], formaPago: actualizada.formaPago }
          return copia
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setCambiandoEstado(false)
    }
  }

  function manejarModificada(actualizada) {
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

  function manejarArmarVenta(consulta) {
    setDetalleId(null)
    setArmando({ consulta, ventaInicial: null })
  }

  function manejarEditarVenta(venta) {
    setVentaDetalleId(null)
    setArmando({
      consulta: {
        id: venta.consultaId,
        numero: venta.consultaNumero,
        tiendaSlug: venta.tiendaSlug,
        clienteNombre: venta.clienteNombre,
        clienteTelefono: venta.clienteTelefono,
      },
      ventaInicial: venta,
    })
  }

  function refrescar() {
    if (seccion === 'consultas') cargarConsultas()
    cargarVentas()
  }

  if (sesion === 'cargando') {
    return <div className={styles.contenedor}>Cargando…</div>
  }

  if (sesion === 'anonimo') {
    return (
      <div className={styles.fondo}>
        <header className={styles.barra}>
          <Link to="/" className={styles.marca}>
            AgrandaditosTienda
          </Link>
          <span className={styles.marcaEtiqueta}>home</span>
        </header>
        <main className={styles.centrado}>
          <LoginForm onLogin={manejarLogin} />
        </main>
      </div>
    )
  }

  return (
    <div className={styles.fondo} style={estiloTienda}>
      <header className={styles.barra}>
        <Link to="/" className={styles.marca}>
            AgrandaditosTienda
        </Link>
        <div className={styles.usuario}>
          <span className={styles.usuarioNombre}>
            {usuario?.nombre ?? usuario?.usuario}
            {esDueño ? ' · Dueño' : usuario?.tiendaNombre ? ` · ${usuario.tiendaNombre}` : ''}
          </span>
          <button type="button" className={styles.salir} onClick={manejarLogout}>
            Salir
          </button>
        </div>
      </header>

      <main className={styles.contenedor}>
        {notificacion && (
          <div className={styles.notificacion}>
            <span>{notificacion}</span>
          </div>
        )}

        {seccion !== 'inicio' && (
          <Link to="/home" className={styles.volver}>
            ← Volver al inicio
          </Link>
        )}

        {seccion === 'inicio' ? (
          <section className={styles.inicio}>
            <h2 className={styles.saludoTitulo}>Hola, {usuario?.nombre ?? usuario?.usuario}</h2>
            <p className={styles.saludoTexto}>¿Qué necesitás hacer hoy?</p>

            {esEncargada && (consultas.filter((c) => c.estado === 'PENDIENTE').length > 0 || consultas.filter((c) => c.estado === 'EN_REVISION').length > 0) && (
              <div className={styles.resumen}>
                <h3 className={styles.resumenTitulo}>Lo que tengo que hacer hoy</h3>
                <div className={styles.resumenItems}>
                  {consultas.filter((c) => c.estado === 'PENDIENTE').length > 0 && (
                    <Link to="/home/consultas" className={styles.resumenItem}>
                      <span className={styles.resumenNumero}>{consultas.filter((c) => c.estado === 'PENDIENTE').length}</span>
                      <span className={styles.resumenEtiqueta}>consultas pendientes</span>
                    </Link>
                  )}
                  {consultas.filter((c) => c.estado === 'EN_REVISION').length > 0 && (
                    <Link to="/home/consultas" className={styles.resumenItem}>
                      <span className={styles.resumenNumero}>{consultas.filter((c) => c.estado === 'EN_REVISION').length}</span>
                      <span className={styles.resumenEtiqueta}>en revisión</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className={styles.mosaico}>
              {esEncargada && (
                <Link to="/home/consultas" className={styles.tarjeta}>
                  <svg
                    className={styles.tarjetaIcono}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className={styles.tarjetaTitulo}>Consultas</span>
                  <span className={styles.tarjetaDetalle}>
                    {tiendaUsuario ? `${tiendaUsuario.nombre}: ` : ''}
                    {consultas.filter((c) => c.estado === 'PENDIENTE').length} pendientes
                  </span>
                </Link>
              )}

              {esDueño && (
                <Link to="/home/ventas" className={styles.tarjeta}>
                  <svg
                    className={styles.tarjetaIcono}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span className={styles.tarjetaTitulo}>Ventas</span>
                  <span className={styles.tarjetaDetalle}>{ventas.length} registradas</span>
                </Link>
              )}

              {esEncargada && (
                <Link to="/home/productos" className={styles.tarjeta}>
                  <svg
                    className={styles.tarjetaIcono}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  <span className={styles.tarjetaTitulo}>Productos</span>
                  <span className={styles.tarjetaDetalle}>Mi catálogo</span>
                </Link>
              )}

              {esDueño && (
                <Link to="/home/promos" className={styles.tarjeta}>
                  <svg
                    className={styles.tarjetaIcono}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20.59 13.41 12 22 2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <circle cx="7.5" cy="7.5" r="0.5" fill="currentColor" />
                  </svg>
                  <span className={styles.tarjetaTitulo}>Promos</span>
                  <span className={styles.tarjetaDetalle}>Organizá promociones</span>
                </Link>
              )}

              {esDueño && (
                <Link to="/home/metricas" className={styles.tarjeta}>
                  <svg
                    className={styles.tarjetaIcono}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 20v-6" />
                    <path d="M6 20V10" />
                    <path d="M18 20V4" />
                  </svg>
                  <span className={styles.tarjetaTitulo}>Métricas</span>
                  <span className={styles.tarjetaDetalle}>Resultados por tienda</span>
                </Link>
              )}
            </div>
          </section>
        ) : seccion === 'consultas' && esEncargada ? (
          <>
            <form className={styles.filtros} onSubmit={manejarBusqueda}>
              <input
                className={styles.busqueda}
                type="search"
                value={busquedaInput}
                onChange={(evento) => setBusquedaInput(evento.target.value)}
                placeholder="Buscar por número, nombre o teléfono"
                aria-label="Buscar consultas"
              />
              <select
                className={styles.select}
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
              {esDueño && (
                <select
                  className={styles.select}
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
              <div className={styles.lista}>
                {Array.from({ length: 6 }).map((_, indice) => (
                  <div key={indice} className={`${styles.fila} ${styles.filaSkeleton}`} />
                ))}
              </div>
            ) : consultas.length === 0 ? (
              <EmptyState titulo="Sin consultas" texto="No hay consultas que coincidan con la búsqueda." />
            ) : (
              <div className={styles.lista}>
                {consultas.map((consulta) => (
                  <button
                    key={consulta.id}
                    type="button"
                    className={styles.fila}
                    onClick={() => setDetalleId(consulta.id)}
                  >
                    <div className={styles.filaPrincipal}>
                      <span className={styles.filaNumero}>{consulta.numero}</span>
                      <EstadoBadge estado={consulta.estado} />
                    </div>
                    <p className={styles.filaCliente}>
                      {consulta.clienteNombre ?? 'Sin nombre'} · {consulta.clienteTelefono}
                    </p>
                    <p className={styles.filaSecundaria}>
                      {consulta.tiendaNombre} · {consulta.totalItems} unidad{consulta.totalItems === 1 ? '' : 'es'} ·{' '}
                      {formatearFecha(consulta.fechaConsulta)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : esDueño && seccion === 'ventas' ? (
          <>
            <form className={styles.filtros} onSubmit={manejarBusquedaVentas}>
              <input
                className={styles.busqueda}
                type="search"
                value={ventaBusquedaInput}
                onChange={(evento) => setVentaBusquedaInput(evento.target.value)}
                placeholder="Buscar por número, nombre o teléfono"
                aria-label="Buscar ventas"
              />
              <select
                className={styles.select}
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
              {esDueño && (
                <select
                  className={styles.select}
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
              <div className={styles.lista}>
                {Array.from({ length: 6 }).map((_, indice) => (
                  <div key={indice} className={`${styles.fila} ${styles.filaSkeleton}`} />
                ))}
              </div>
            ) : ventas.length === 0 ? (
              <EmptyState titulo="Sin ventas" texto="No hay ventas que coincidan con la búsqueda." />
            ) : (
              <div className={styles.lista}>
                {ventas.map((venta) => (
                  <button
                    key={venta.id}
                    type="button"
                    className={styles.fila}
                    onClick={() => setVentaDetalleId(venta.id)}
                  >
                    <div className={styles.filaPrincipal}>
                      <span className={styles.filaNumero}>{venta.numero}</span>
                      <EstadoBadge estado={venta.estado} />
                    </div>
                    <p className={styles.filaCliente}>
                      {venta.clienteNombre ?? 'Sin nombre'} · {venta.clienteTelefono}
                    </p>
                    <p className={styles.filaSecundaria}>
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
        ) : esDueño && seccion === 'promos' ? (
          <PromosView tiendas={tiendas} usuario={usuario} />
        ) : seccion === 'productos' && esEncargada ? (
          <ProductosView tienda={tiendaUsuario} esDueno={esDueño} tiendas={tiendas} />
        ) : esDueño && seccion === 'metricas' ? (
          <MetricasView tiendas={tiendas} consultas={consultasTodas} ventas={ventasTodas} />
        ) : (
          <Navigate to="/home" replace />
        )}
      </main>

      {detalleId && cargandoDetalle && !detalle && <div className={styles.cargandoDetalle}>Cargando detalle…</div>}
      {detalleId && errorDetalle && !cargandoDetalle && (
        <div className={styles.cargandoDetalle}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 12 }}>{errorDetalle}</p>
            <button
              type="button"
              onClick={() => { setDetalleId(null); setErrorDetalle('') }}
              style={{ background: 'var(--color-marca)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
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
