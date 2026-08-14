import { useEffect, useMemo, useState } from 'react'
import { formatearPrecio } from '../../services/api'
import styles from './ProductModal.module.css'

function ProductModal({ producto, tienda, onCerrar, onAgregar }) {
  const variantes = useMemo(() => producto.variantes ?? [], [producto.variantes])
  const colores = useMemo(() => [...new Set(variantes.map((v) => v.color))], [variantes])

  const [color, setColor] = useState('')
  const [talle, setTalle] = useState('')
  const [cantidad, setCantidad] = useState(1)

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
  }, [colores])

  useEffect(() => {
    setTalle(tallesDisponibles.length === 1 ? tallesDisponibles[0] : '')
  }, [tallesDisponibles])

  const puedeAgregar = color && talle && variantes.length > 0

  function manejarAgregar() {
    if (!puedeAgregar) return
    onAgregar({
      productoId: producto.id,
      nombre: producto.nombre,
      imagen: producto.imagen,
      precio: producto.precio,
      color,
      talle,
      cantidad,
    })
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

        <div className={styles.contenido}>
          <div className={styles.imagenContenedor}>
            <img className={styles.imagen} src={producto.imagen} alt={producto.nombre} />
          </div>
          <div className={styles.detalle}>
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

                <button
                  type="button"
                  className={styles.whatsapp}
                  onClick={manejarAgregar}
                  disabled={!puedeAgregar}
                  style={!puedeAgregar ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                >
                  <span className={styles.whatsappIcon} aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 6h18" strokeLinecap="round" />
                      <path d="M16 10a4 4 0 0 1-8 0" strokeLinecap="round" />
                    </svg>
                  </span>
                  Agregar al carrito
                </button>
                <p className={styles.nota}>
                  Vas sumando prendas al carrito y al final cargás tus datos para enviar la consulta por WhatsApp.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductModal
