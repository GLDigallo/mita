const API_BASE = '/api'

export async function fetchTiendas() {
  const response = await fetch(`${API_BASE}/tiendas`)
  if (!response.ok) throw new Error('No se pudieron cargar las tiendas')
  return response.json()
}

export async function fetchTienda(slug) {
  const response = await fetch(`${API_BASE}/tiendas/${slug}`)
  if (!response.ok) throw new Error('No se pudo cargar la tienda')
  return response.json()
}

export async function fetchCategorias(slug) {
  const response = await fetch(`${API_BASE}/tiendas/${slug}/categorias`)
  if (!response.ok) throw new Error('No se pudieron cargar las categorías')
  return response.json()
}

export async function fetchGeneros(slug) {
  const response = await fetch(`${API_BASE}/tiendas/${slug}/generos`)
  if (!response.ok) throw new Error('No se pudieron cargar los géneros')
  return response.json()
}

export async function fetchProductos(slug, categoria = '', genero = '') {
  const params = new URLSearchParams()
  if (categoria) params.set('categoria', categoria)
  if (genero) params.set('genero', genero)
  const query = params.toString()
  const response = await fetch(`${API_BASE}/tiendas/${slug}/productos${query ? `?${query}` : ''}`)
  if (!response.ok) throw new Error('No se pudieron cargar los productos')
  return response.json()
}

export async function fetchDestacados() {
  const response = await fetch(`${API_BASE}/productos/destacados`)
  if (!response.ok) throw new Error('No se pudieron cargar los destacados')
  return response.json()
}

export function formatearPrecio(precio) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(precio)
}

async function enviarJson(url, opciones = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(opciones.headers ?? {}),
    },
  })
  if (!response.ok) {
    let mensaje = 'Error de servidor'
    try {
      const cuerpo = await response.json()
      if (cuerpo.message) mensaje = cuerpo.message
    } catch {
      // cuerpo vacío (p. ej. 401 sin body)
    }
    const error = new Error(mensaje)
    error.status = response.status
    throw error
  }
  if (response.status === 204) return null
  return response.json()
}

export async function crearConsulta(payload) {
  return enviarJson(`${API_BASE}/consultas`, { method: 'POST', body: JSON.stringify(payload) })
}

export async function login(usuario, clave) {
  return enviarJson(`${API_BASE}/auth/login`, { method: 'POST', body: JSON.stringify({ usuario, clave }) })
}

export async function logout() {
  return enviarJson(`${API_BASE}/auth/logout`, { method: 'POST' })
}

export async function fetchMe() {
  return enviarJson(`${API_BASE}/auth/me`)
}

export async function fetchConsultas({ estado = '', tiendaId = '', busqueda = '' } = {}) {
  const params = new URLSearchParams()
  if (estado) params.set('estado', estado)
  if (tiendaId) params.set('tiendaId', tiendaId)
  if (busqueda) params.set('busqueda', busqueda)
  const query = params.toString()
  return enviarJson(`${API_BASE}/consultas${query ? `?${query}` : ''}`)
}

export async function fetchConsulta(id) {
  return enviarJson(`${API_BASE}/consultas/${id}`)
}

export async function cambiarEstadoConsulta(id, estado) {
  return enviarJson(`${API_BASE}/consultas/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  })
}

export async function cambiarFormaPagoConsulta(id, formaPago) {
  return enviarJson(`${API_BASE}/consultas/${id}/forma-pago`, {
    method: 'PATCH',
    body: JSON.stringify({ formaPago }),
  })
}

export async function modificarConsulta(id, payload) {
  return enviarJson(`${API_BASE}/consultas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function fetchHistorialConsulta(id) {
  return enviarJson(`${API_BASE}/consultas/${id}/versiones`)
}

export const MOTIVOS_MODIFICACION = [
  { valor: 'CAMBIO_TALLE', etiqueta: 'Cambió el talle' },
  { valor: 'CAMBIO_PRODUCTO', etiqueta: 'Cambió el producto' },
  { valor: 'CAMBIO_CANTIDAD', etiqueta: 'Cambió la cantidad' },
  { valor: 'CAMBIO_COLOR', etiqueta: 'Cambió el color' },
  { valor: 'CORRECCION', etiqueta: 'Corrección de datos' },
  { valor: 'OTRO', etiqueta: 'Otro' },
]

export async function fetchVentas({ estado = '', tiendaId = '', busqueda = '' } = {}) {
  const params = new URLSearchParams()
  if (estado) params.set('estado', estado)
  if (tiendaId) params.set('tiendaId', tiendaId)
  if (busqueda) params.set('busqueda', busqueda)
  const query = params.toString()
  return enviarJson(`${API_BASE}/ventas${query ? `?${query}` : ''}`)
}

export async function fetchVenta(id) {
  return enviarJson(`${API_BASE}/ventas/${id}`)
}

export async function fetchVentaDeConsulta(consultaId) {
  return enviarJson(`${API_BASE}/consultas/${consultaId}/venta`)
}

export async function crearVenta(consultaId) {
  return enviarJson(`${API_BASE}/consultas/${consultaId}/ventas`, { method: 'POST' })
}

export async function actualizarItemsVenta(id, items) {
  return enviarJson(`${API_BASE}/ventas/${id}/items`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })
}

export async function confirmarVenta(id, metodoPago) {
  return enviarJson(`${API_BASE}/ventas/${id}/confirmar`, {
    method: 'POST',
    body: JSON.stringify({ metodoPago }),
  })
}

export async function entregarVenta(id) {
  return enviarJson(`${API_BASE}/ventas/${id}/entregar`, { method: 'POST' })
}

export async function cancelarVenta(id) {
  return enviarJson(`${API_BASE}/ventas/${id}/cancelar`, { method: 'POST' })
}

export const ESTADOS_CONSULTA = [
  { valor: 'PENDIENTE', etiqueta: 'Pendiente' },
  { valor: 'EN_REVISION', etiqueta: 'En revisión' },
  { valor: 'ESPERANDO_CLIENTE', etiqueta: 'Esperando cliente' },
  { valor: 'CONFIRMADA', etiqueta: 'Confirmada' },
  { valor: 'CANCELADA', etiqueta: 'Cancelada' },
  { valor: 'FINALIZADA', etiqueta: 'Finalizada' },
]

export const ESTADOS_VENTA = [
  { valor: 'EN_PREPARACION', etiqueta: 'En preparación' },
  { valor: 'CONFIRMADA', etiqueta: 'Confirmada' },
  { valor: 'ENTREGADA', etiqueta: 'Entregada' },
  { valor: 'CANCELADA', etiqueta: 'Cancelada' },
]

export const METODOS_PAGO = [
  { valor: 'EFECTIVO', etiqueta: 'Efectivo' },
  { valor: 'TARJETA_DEBITO', etiqueta: 'Tarjeta de débito' },
  { valor: 'TARJETA_CREDITO', etiqueta: 'Tarjeta de crédito' },
  { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia' },
  { valor: 'MERCADO_PAGO', etiqueta: 'Mercado Pago' },
]

export function etiquetaMetodoPago(valor) {
  return METODOS_PAGO.find((m) => m.valor === valor)?.etiqueta ?? valor
}

export function etiquetaEstado(estado) {
  return (
    ESTADOS_CONSULTA.find((e) => e.valor === estado)?.etiqueta ??
    ESTADOS_VENTA.find((e) => e.valor === estado)?.etiqueta ??
    estado
  )
}
