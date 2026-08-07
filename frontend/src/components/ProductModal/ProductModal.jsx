import { useEffect, useMemo, useState } from 'react'
import { crearConsulta, formatearPrecio } from '../../services/api'
import styles from './ProductModal.module.css'

function ProductModal({ producto, tienda, onCerrar }) {
  const variantes = useMemo(() => producto.variantes ?? [], [producto.variantes])
  const colores = useMemo(() => [...new Set(variantes.map((v) => v.color))], [variantes])

  const [color, setColor] = useState('')
  const [talle, setTalle] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState(null)

  const tallesDisponibles = useMemo(
    () => variantes.filter((v) => v.color === color).map((v) => v.talle),
    [variantes, color],
  )

  useEffect(() => {
    const manejarTecla = (evento) => {
      if (evento.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', manejarTecla)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', manejarTecla)
      document.body.style.overflow = ''
    }
  }, [onCerrar])

  useEffect(() => {
    if (colores.length === 1) setColor(colores[0])
    else setColor('')
    setTalle('')
    setCantidad(1)
    setError('')
    setResultado(null)
  }, [colores])

  useEffect(() => {
    setTalle(tallesDisponibles.length === 1 ? tallesDisponibles[0] : '')
  }, [tallesDisponibles])

  const puedeEnviar =
    color && talle && telefono.trim() && !enviando && variantes.length > 0

  async function manejarEnvio(evento) {
    evento.preventDefault()
    if (!puedeEnviar) return
    setEnviando(true)
    setError('')
    try {
      const payload = {
        tiendaSlug: tienda.slug,
        nombre: nombre.trim() || undefined,
        telefono: telefono.trim(),
        observaciones: observaciones.trim() || undefined,
        items: [
          {
            productoId: producto.id,
            color,
            talle,
            cantidad,
            observaciones: undefined,
          },
        ],
      }
      const creada = await crearConsulta(payload)
      setResultado(creada)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onCerrar} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de ${producto.nombre}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar detalle">
          ✕
        </button>

        {resultado ? (
          <div className={styles.exito}>
            <div className={styles.exitoIcono} aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className={styles.exitoTitulo}>¡Consulta registrada!</p>
            <p className={styles.exitoNumero}>N° {resultado.consulta.numero}</p>
            <p className={styles.exitoTexto}>
              Nuestra tienda ya recibió tu consulta. Abrí WhatsApp para enviarla y te respondemos en el horario del
              local.
            </p>
            <a
              className={styles.whatsapp}
              href={resultado.enlaceWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.whatsappIcon} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
              </span>
              Abrir WhatsApp
            </a>
            <button type="button" className={styles.exitoCerrar} onClick={onCerrar}>
              Cerrar
            </button>
          </div>
        ) : (
          <div className={styles.contenido}>
            <div className={styles.imagenContenedor}>
              <img className={styles.imagen} src={producto.imagen} alt={producto.nombre} />
            </div>
            <form className={styles.detalle} onSubmit={manejarEnvio}>
              <p className={styles.categoria}>{producto.categoriaNombre}</p>
              <h2 className={styles.nombre}>{producto.nombre}</h2>
              <p className={styles.precio}>{formatearPrecio(producto.precio)}</p>

              {variantes.length === 0 && (
                <p className={styles.sinStock}>
                  Este producto aún no tiene talle y color cargados. Consultanos directamente por WhatsApp.
                </p>
              )}

              {variantes.length > 0 && (
                <>
                  {colores.length > 1 && (
                    <div className={styles.grupo}>
                      <p className={styles.titulo}>Color</p>
                      <div className={styles.tallesLista} role="group" aria-label="Elegir color">
                        {colores.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={`${styles.talle} ${color === c ? styles.talleActivo : ''}`}
                            style={color === c ? { '--talle-color': tienda.colorPrimario } : undefined}
                            onClick={() => setColor(c)}
                            aria-pressed={color === c}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className={styles.grupo}>
                    <p className={styles.titulo}>Talle</p>
                    <div className={styles.tallesLista} role="group" aria-label="Elegir talle">
                      {tallesDisponibles.length === 0 ? (
                        <p className={styles.sinStock}>Elegí un color para ver los talles.</p>
                      ) : (
                        tallesDisponibles.map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`${styles.talle} ${talle === t ? styles.talleActivo : ''}`}
                            style={talle === t ? { '--talle-color': tienda.colorPrimario } : undefined}
                            onClick={() => setTalle(t)}
                            aria-pressed={talle === t}
                          >
                            {t}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className={styles.grupo}>
                    <p className={styles.titulo}>Cantidad</p>
                    <div className={styles.cantidad}>
                      <button
                        type="button"
                        className={styles.cantidadBoton}
                        onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                        aria-label="Quitar uno"
                      >
                        −
                      </button>
                      <span className={styles.cantidadValor}>{cantidad}</span>
                      <button
                        type="button"
                        className={styles.cantidadBoton}
                        onClick={() => setCantidad((c) => Math.min(10, c + 1))}
                        aria-label="Sumar uno"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className={styles.grupo}>
                    <label className={styles.titulo} htmlFor="consulta-nombre">
                      Tu nombre (opcional)
                    </label>
                    <input
                      id="consulta-nombre"
                      className={styles.input}
                      type="text"
                      value={nombre}
                      onChange={(evento) => setNombre(evento.target.value)}
                      maxLength={120}
                      placeholder="¿Cómo te llamás?"
                    />
                  </div>

                  <div className={styles.grupo}>
                    <label className={styles.titulo} htmlFor="consulta-telefono">
                      Tu teléfono (WhatsApp)
                    </label>
                    <input
                      id="consulta-telefono"
                      className={styles.input}
                      type="tel"
                      value={telefono}
                      onChange={(evento) => setTelefono(evento.target.value)}
                      placeholder="+54 9 379 4 000000"
                      required
                    />
                  </div>

                  <div className={styles.grupo}>
                    <label className={styles.titulo} htmlFor="consulta-observaciones">
                      Observaciones (opcional)
                    </label>
                    <textarea
                      id="consulta-observaciones"
                      className={styles.input}
                      value={observaciones}
                      onChange={(evento) => setObservaciones(evento.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="Ej.: para regalo, talle de descarte, etc."
                    />
                  </div>

                  {error && <p className={styles.error}>{error}</p>}

                  <button
                    type="submit"
                    className={styles.whatsapp}
                    disabled={!puedeEnviar}
                    style={!puedeEnviar ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                  >
                    <span className={styles.whatsappIcon} aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                      </svg>
                    </span>
                    {enviando ? 'Enviando…' : 'Consultar por WhatsApp'}
                  </button>
                  <p className={styles.nota}>
                    Tu consulta queda registrada con un número. La enviamos por WhatsApp a la tienda {tienda.nombre}.
                  </p>
                </>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductModal
