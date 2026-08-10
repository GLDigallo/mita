import { useState } from 'react'
import { ESTADOS_CONSULTA, ESTADOS_VENTA, formatearPrecio } from '../../../services/api'
import styles from './MetricasView.module.css'

const RANGOS = [
  { valor: 'TODO', etiqueta: 'Todo' },
  { valor: 'HOY', etiqueta: 'Hoy' },
  { valor: 'SEMANA', etiqueta: 'Esta semana' },
  { valor: 'MES', etiqueta: 'Este mes' },
]

function dentroDeRango(fechaIso, rango) {
  if (!fechaIso || rango === 'TODO') return true
  const fecha = new Date(fechaIso)
  const ahora = new Date()
  if (rango === 'HOY') return fecha.toDateString() === ahora.toDateString()
  if (rango === 'SEMANA') {
    const limite = new Date(ahora)
    limite.setDate(ahora.getDate() - 7)
    return fecha >= limite
  }
  if (rango === 'MES') {
    const limite = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    return fecha >= limite
  }
  return true
}

function MetricasView({ tiendas, consultas, ventas }) {
  const [rango, setRango] = useState('TODO')

  const consultasFiltradas = consultas.filter((c) => dentroDeRango(c.fechaConsulta, rango))
  const ventasFiltradas = ventas.filter((v) => dentroDeRango(v.fechaVenta, rango))

  const pendientes = consultasFiltradas.filter((c) => c.estado === 'PENDIENTE').length
  const importeTotal = ventasFiltradas.reduce((suma, v) => suma + (v.importeTotal ?? 0), 0)
  const consultasConVenta = ventasFiltradas.filter(
    (v) => v.estado !== 'CANCELADA' && v.importeTotal != null
  ).length

  const porTienda = tiendas.map((tienda) => {
    const ventasTienda = ventasFiltradas.filter((v) => v.tiendaNombre === tienda.nombre)
    return {
      tienda,
      consultas: consultasFiltradas.filter((c) => c.tiendaNombre === tienda.nombre).length,
      ventas: ventasTienda.length,
      importe: ventasTienda.reduce((suma, v) => suma + (v.importeTotal ?? 0), 0),
    }
  })

  const porEstadoConsulta = ESTADOS_CONSULTA.map((e) => ({
    ...e,
    cantidad: consultasFiltradas.filter((c) => c.estado === e.valor).length,
  }))

  const porEstadoVenta = ESTADOS_VENTA.map((e) => ({
    ...e,
    cantidad: ventasFiltradas.filter((v) => v.estado === e.valor).length,
  }))

  return (
    <section className={styles.contenido}>
      <div className={styles.cabecera}>
        <h2 className={styles.titulo}>Métricas de tiendas</h2>
        <p className={styles.subtitulo}>Prototipo: números en vivo de consultas y ventas.</p>
        <div className={styles.rangos} role="group" aria-label="Rango de fechas">
          {RANGOS.map((r) => (
            <button
              key={r.valor}
              type="button"
              className={`${styles.rango} ${rango === r.valor ? styles.rangoActivo : ''}`}
              onClick={() => setRango(r.valor)}
            >
              {r.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tarjetas}>
        <div className={styles.tarjetaNumero}>
          <span className={styles.tarjetaNumeroValor}>{consultasFiltradas.length}</span>
          <span className={styles.tarjetaNumeroEtiqueta}>Consultas</span>
        </div>
        <div className={styles.tarjetaNumero}>
          <span className={styles.tarjetaNumeroValor}>{pendientes}</span>
          <span className={styles.tarjetaNumeroEtiqueta}>Pendientes</span>
        </div>
        <div className={styles.tarjetaNumero}>
          <span className={styles.tarjetaNumeroValor}>{ventasFiltradas.length}</span>
          <span className={styles.tarjetaNumeroEtiqueta}>Ventas</span>
        </div>
        <div className={styles.tarjetaNumero}>
          <span className={styles.tarjetaNumeroValor}>
            {importeTotal > 0 ? formatearPrecio(importeTotal) : '$0'}
          </span>
          <span className={styles.tarjetaNumeroEtiqueta}>Importe acumulado</span>
        </div>
      </div>

      <div className={styles.bloque}>
        <h3 className={styles.bloqueTitulo}>Por tienda</h3>
        {porTienda.length === 0 ? (
          <p className={styles.vacio}>No hay tiendas cargadas.</p>
        ) : (
          <div className={styles.tabla}>
            <div className={styles.tablaEncabezado}>
              <span>Tienda</span>
              <span>Consultas</span>
              <span>Ventas</span>
              <span>Importe</span>
            </div>
            {porTienda.map((fila) => (
              <div key={fila.tienda.id} className={styles.tablaFila}>
                <span className={styles.tablaTienda}>{fila.tienda.nombre}</span>
                <span>{fila.consultas}</span>
                <span>{fila.ventas}</span>
                <span>{fila.importe > 0 ? formatearPrecio(fila.importe) : '$0'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.bloquesDoble}>
        <div className={styles.bloque}>
          <h3 className={styles.bloqueTitulo}>Consultas por estado</h3>
          <div className={styles.estados}>
            {porEstadoConsulta.map((e) => (
              <div key={e.valor} className={styles.estado}>
                <span className={styles.estadoEtiqueta}>{e.etiqueta}</span>
                <span className={styles.estadoCantidad}>{e.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.bloque}>
          <h3 className={styles.bloqueTitulo}>Ventas por estado</h3>
          <div className={styles.estados}>
            {porEstadoVenta.map((e) => (
              <div key={e.valor} className={styles.estado}>
                <span className={styles.estadoEtiqueta}>{e.etiqueta}</span>
                <span className={styles.estadoCantidad}>{e.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MetricasView
