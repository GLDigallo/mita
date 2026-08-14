import { useEffect, useState } from 'react'
import { crearConsulta, formatearPrecio } from '../../services/api'
import styles from './CartModal.module.css'

function CartModal({ items, tienda, onCerrar, onQuitar, onLimpiar }) {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState(null)

  const total = items.reduce((suma, item) => suma + item.precio * item.cantidad, 0)
  const puedeEnviar = telefono.trim() && items.length > 0 && !enviando

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

  async function manejarEnvio(evento) {
    evento.preventDefault()
    if (!puedeEnviar) return
    setEnviando(true)
    setError('')
    try {
      const creada = await crearConsulta({
        tiendaSlug: tienda.slug,
        nombre: nombre.trim() || undefined,
        telefono: telefono.trim(),
        observaciones: observaciones.trim() || undefined,
        items: items.map((item) => ({
          productoId: item.productoId,
          color: item.color,
          talle: item.talle,
          cantidad: item.cantidad,
        })),
      })
      setResultado(creada)
      onLimpiar()
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
        aria-label="Carrito de compras"
        onClick={(evento) => evento.stopPropagation()}
      >
        <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar carrito">
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
            <div className={styles.lista}>
              <h3 className={styles.tituloSeccion}>
                Tu selección
                {items.length > 0 && <span className={styles.contador}>{items.length}</span>}
              </h3>

              {items.length === 0 ? (
                <p className={styles.vacio}>Todavía no elegiste productos.</p>
              ) : (
                <ul className={styles.items}>
                  {items.map((item, indice) => (
                    <li key={`${item.productoId}-${item.color}-${item.talle}`} className={styles.item}>
                      <img className={styles.itemImagen} src={item.imagen} alt={item.nombre} />
                      <div className={styles.itemInfo}>
                        <p className={styles.itemNombre}>{item.nombre}</p>
                        <p className={styles.itemDetalle}>
                          {item.color} · Talle {item.talle} · x{item.cantidad}
                        </p>
                        <p className={styles.itemPrecio}>{formatearPrecio(item.precio * item.cantidad)}</p>
                      </div>
                      <button
                        type="button"
                        className={styles.itemQuitar}
                        onClick={() => onQuitar(indice)}
                        aria-label={`Quitar ${item.nombre}`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {items.length > 0 && (
                <div className={styles.totalFila}>
                  <span className={styles.totalEtiqueta}>Total estimado</span>
                  <strong className={styles.totalValor}>{formatearPrecio(total)}</strong>
                </div>
              )}
            </div>

            <form className={styles.formulario} onSubmit={manejarEnvio}>
              <h3 className={styles.tituloSeccion}>Tus datos</h3>
              <p className={styles.nota}>
                Tu consulta queda registrada con un número. La enviamos por WhatsApp a la tienda {tienda.nombre}.
              </p>

              <div className={styles.grupo}>
                <label className={styles.titulo} htmlFor="carrito-nombre">
                  Tu nombre (opcional)
                </label>
                <input
                  id="carrito-nombre"
                  className={styles.input}
                  type="text"
                  value={nombre}
                  onChange={(evento) => setNombre(evento.target.value)}
                  maxLength={120}
                  placeholder="¿Cómo te llamás?"
                />
              </div>

              <div className={styles.grupo}>
                <label className={styles.titulo} htmlFor="carrito-telefono">
                  Tu teléfono (WhatsApp)
                </label>
                <input
                  id="carrito-telefono"
                  className={styles.input}
                  type="tel"
                  value={telefono}
                  onChange={(evento) => setTelefono(evento.target.value)}
                  placeholder="+54 9 379 4 000000"
                  required
                />
              </div>

              <div className={styles.grupo}>
                <label className={styles.titulo} htmlFor="carrito-observaciones">
                  Observaciones (opcional)
                </label>
                <textarea
                  id="carrito-observaciones"
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
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartModal
