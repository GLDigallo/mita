import { useEffect, useState } from 'react'
import styles from './PromosView.module.css'

const CLAVE_STORAGE = 'agrandaditostienda_promos_prototipo'

const TIPOS_PROMO = [
  { valor: 'PORCENTAJE', etiqueta: 'Descuento %' },
  { valor: 'MONTO', etiqueta: 'Descuento en $' },
  { valor: '2X1', etiqueta: '2x1' },
  { valor: 'ENVIO_GRATIS', etiqueta: 'Envío gratis' },
]

const PROMOS_INICIALES = [
  {
    id: 1,
    titulo: 'Semana del bebé',
    tipo: 'PORCENTAJE',
    valor: 20,
    tiendaSlug: 'mokositos-bebes',
    vigencia: 'agosto 2026',
    activa: true,
  },
  {
    id: 2,
    titulo: 'Vuelta a clases',
    tipo: 'MONTO',
    valor: 1500,
    tiendaSlug: 'mokositos-ninos',
    vigencia: 'agosto 2026',
    activa: true,
  },
  {
    id: 3,
    titulo: 'Moda preadolescente',
    tipo: '2X1',
    valor: null,
    tiendaSlug: 'agrandaditos',
    vigencia: 'todo el mes',
    activa: false,
  },
]

function cargarIniciales() {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE_STORAGE))
    if (Array.isArray(guardadas)) return guardadas
  } catch {
    // se usan las de ejemplo
  }
  return PROMOS_INICIALES
}

function PromosView({ tiendas }) {
  const [promos, setPromos] = useState(cargarIniciales)
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('PORCENTAJE')
  const [valor, setValor] = useState('')
  const [tiendaSlug, setTiendaSlug] = useState('')
  const [vigencia, setVigencia] = useState('')
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(promos))
  }, [promos])

  function agregar(evento) {
    evento.preventDefault()
    if (!titulo.trim()) {
      setAviso('Poné un nombre para la promo.')
      return
    }
    const nueva = {
      id: Date.now(),
      titulo: titulo.trim(),
      tipo,
      valor: tipo === 'PORCENTAJE' || tipo === 'MONTO' ? Number(valor) || 0 : null,
      tiendaSlug,
      vigencia: vigencia.trim() || 'sin vigencia definida',
      activa: true,
    }
    setPromos((actuales) => [nueva, ...actuales])
    setTitulo('')
    setValor('')
    setVigencia('')
    setAviso('Promo creada (prototipo: se guarda solo en este navegador).')
  }

  function alternar(id) {
    setPromos((actuales) => actuales.map((p) => (p.id === id ? { ...p, activa: !p.activa } : p)))
  }

  function eliminar(id) {
    setPromos((actuales) => actuales.filter((p) => p.id !== id))
  }

  function etiquetaTipo(promo) {
    return TIPOS_PROMO.find((t) => t.valor === promo.tipo)?.etiqueta ?? promo.tipo
  }

  function descripcion(promo) {
    if (promo.tipo === 'PORCENTAJE') return `${promo.valor}% de descuento`
    if (promo.tipo === 'MONTO') return `$${promo.valor} de descuento`
    if (promo.tipo === '2X1') return 'Llevás 2, pagás 1'
    if (promo.tipo === 'ENVIO_GRATIS') return 'Envío gratis'
    return ''
  }

  function tiendaNombre(slug) {
    if (!slug) return 'Todas las tiendas'
    return tiendas.find((t) => t.slug === slug)?.nombre ?? slug
  }

  return (
    <section className={styles.contenido}>
      <div className={styles.cabecera}>
        <h2 className={styles.titulo}>Promociones</h2>
        <p className={styles.subtitulo}>Prototipo: las promos se guardan solo en este navegador.</p>
      </div>

      <form className={styles.formulario} onSubmit={agregar}>
        <input
          className={styles.input}
          type="text"
          value={titulo}
          onChange={(evento) => setTitulo(evento.target.value)}
          placeholder="Nombre de la promo (ej: Semana del bebé)"
          aria-label="Nombre de la promo"
        />
        <div className={styles.fila}>
          <select
            className={styles.input}
            value={tipo}
            onChange={(evento) => setTipo(evento.target.value)}
            aria-label="Tipo de promo"
          >
            {TIPOS_PROMO.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.etiqueta}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            type="number"
            min="0"
            value={valor}
            onChange={(evento) => setValor(evento.target.value)}
            placeholder={tipo === 'PORCENTAJE' ? 'Porcentaje' : 'Monto en $'}
            aria-label="Valor de la promo"
            disabled={tipo === '2X1' || tipo === 'ENVIO_GRATIS'}
          />
          <select
            className={styles.input}
            value={tiendaSlug}
            onChange={(evento) => setTiendaSlug(evento.target.value)}
            aria-label="Tienda de la promo"
          >
            <option value="">Todas las tiendas</option>
            {tiendas.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.fila}>
          <input
            className={styles.input}
            type="text"
            value={vigencia}
            onChange={(evento) => setVigencia(evento.target.value)}
            placeholder="Vigencia (ej: agosto 2026)"
            aria-label="Vigencia de la promo"
          />
          <button type="submit" className={styles.botonPrimario}>
            Crear promo
          </button>
        </div>
      </form>

      {aviso && <p className={styles.aviso}>{aviso}</p>}

      {promos.length === 0 ? (
        <p className={styles.vacio}>Todavía no hay promos. Creá la primera arriba.</p>
      ) : (
        <div className={styles.lista}>
          {promos.map((promo) => (
            <article key={promo.id} className={`${styles.promo} ${promo.activa ? '' : styles.promoInactiva}`}>
              <div className={styles.promoInfo}>
                <h3 className={styles.promoNombre}>{promo.titulo}</h3>
                <p className={styles.promoDetalle}>
                  {descripcion(promo)} · {tiendaNombre(promo.tiendaSlug)} · {promo.vigencia}
                </p>
              </div>
              <span className={styles.promoEtiqueta}>{etiquetaTipo(promo)}</span>
              <div className={styles.promoAcciones}>
                <button type="button" className={styles.botonSecundario} onClick={() => alternar(promo.id)}>
                  {promo.activa ? 'Desactivar' : 'Activar'}
                </button>
                <button type="button" className={styles.botonPeligro} onClick={() => eliminar(promo.id)}>
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default PromosView
