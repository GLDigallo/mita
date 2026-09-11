import type {
  Categoria,
  CarritoItem,
  ConsultaDetalle,
  ConsultaLista,
  EstadoConsulta,
  EstadoVenta,
  FormaPago,
  Genero,
  MetodoPago,
  Producto,
  Tienda,
  Usuario,
  VentaDetalle,
  VentaLista,
  VarianteProducto,
} from '../types'

const API_BASE = '/api'

export async function fetchTiendas(): Promise<Tienda[]> {
  const response = await fetch(`${API_BASE}/tiendas`)
  if (!response.ok) throw new Error('No se pudieron cargar las tiendas')
  return response.json()
}

export async function fetchTienda(slug: string): Promise<Tienda> {
  const response = await fetch(`${API_BASE}/tiendas/${slug}`)
  if (!response.ok) throw new Error('No se pudo cargar la tienda')
  return response.json()
}

export async function fetchCategorias(slug: string): Promise<Categoria[]> {
  const response = await fetch(`${API_BASE}/tiendas/${slug}/categorias`)
  if (!response.ok) throw new Error('No se pudieron cargar las categorías')
  return response.json()
}

export async function fetchGeneros(slug: string): Promise<Genero[]> {
  const response = await fetch(`${API_BASE}/tiendas/${slug}/generos`)
  if (!response.ok) throw new Error('No se pudieron cargar los géneros')
  return response.json()
}

export async function fetchProductos(slug: string, categoria: string = '', genero: string = ''): Promise<Producto[]> {
  const params = new URLSearchParams()
  if (categoria) params.set('categoria', categoria)
  if (genero) params.set('genero', genero)
  const query = params.toString()
  const response = await fetch(`${API_BASE}/tiendas/${slug}/productos${query ? `?${query}` : ''}`)
  if (!response.ok) throw new Error('No se pudieron cargar los productos')
  return response.json()
}

export async function fetchDestacados(): Promise<Producto[]> {
  const response = await fetch(`${API_BASE}/productos/destacados`)
  if (!response.ok) throw new Error('No se pudieron cargar los destacados')
  return response.json()
}

export async function fetchProductosGlobales(): Promise<Producto[]> {
  const response = await fetch(`${API_BASE}/productos`)
  if (!response.ok) throw new Error('No se pudieron cargar los productos')
  return response.json()
}

export interface ProductoPayload {
  nombre: string
  descripcion: string
  precio: number
  imagen: string
  talles: string
  genero: Genero
  destacado: boolean
  categoriaSlug: string
  variantes: { color: string; talle: string; stock: number }[]
}

export async function crearProducto(slug: string, payload: ProductoPayload) {
  return enviarJson(`${API_BASE}/tiendas/${slug}/productos`, { method: 'POST', body: JSON.stringify(payload) })
}

export async function actualizarProducto(id: number, payload: ProductoPayload) {
  return enviarJson(`${API_BASE}/productos/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export async function eliminarProducto(id: number) {
  return enviarJson(`${API_BASE}/productos/${id}`, { method: 'DELETE' })
}

export async function crearCategoria(slug: string, nombre: string): Promise<Categoria> {
  return enviarJson(`${API_BASE}/tiendas/${slug}/categorias`, {
    method: 'POST',
    body: JSON.stringify({ nombre }),
  })
}

export async function eliminarCategoria(id: number) {
  return enviarJson(`${API_BASE}/categorias/${id}`, { method: 'DELETE' })
}

export type TipoPromo = 'PORCENTAJE' | 'MONTO' | 'DOS_POR_UNO' | 'ENVIO_GRATIS'

export interface Promo {
  id: number
  titulo: string
  tipo: TipoPromo
  valor: number | null
  tiendaSlug: string | null
  productoId: number | null
  productoNombre: string | null
  productoImagen: string | null
  esDeProducto: boolean
  fechaInicio: string
  fechaFin: string
  activa: boolean
}

export async function fetchPromos(): Promise<Promo[]> {
  return enviarJson(`${API_BASE}/promos`)
}

export async function crearPromo(payload: {
  titulo: string
  tipo: TipoPromo
  valor: number | null
  tiendaSlug: string | null
  productoId: number | null
  fechaInicio: string
  fechaFin: string
}): Promise<Promo> {
  return enviarJson(`${API_BASE}/promos`, { method: 'POST', body: JSON.stringify(payload) })
}

export async function alternarPromo(id: number, activa: boolean): Promise<Promo> {
  return enviarJson(`${API_BASE}/promos/${id}`, { method: 'PATCH', body: JSON.stringify({ activa }) })
}

export async function eliminarPromo(id: number) {
  return enviarJson(`${API_BASE}/promos/${id}`, { method: 'DELETE' })
}

export async function buscarProductos(q: string): Promise<Producto[]> {
  return enviarJson(`${API_BASE}/productos/busqueda?q=${encodeURIComponent(q)}`)
}

export async function subirImagen(archivo: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('archivo', archivo)
  const response = await fetch(`${API_BASE}/upload/imagen`, {
    credentials: 'same-origin',
    method: 'POST',
    body: formData,
  })
  if (!response.ok) {
    let mensaje = 'Error al subir imagen'
    try { const c = await response.json(); if (c.message) mensaje = c.message } catch {}
    throw new Error(mensaje)
  }
  return response.json()
}

export function formatearPrecio(precio: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(precio)
}

export function formatearFecha(fecha: string | null | undefined): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fecha ?? ''))
}

interface ErrorConStatus extends Error {
  status?: number
}

async function enviarJson<T>(url: string, opciones: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(opciones.headers ?? {}),
    },
  })
  if (response.status === 401 && !url.includes('/auth/login')) {
    window.dispatchEvent(new CustomEvent('auth:expired'))
    throw new Error('Sesión expirada')
  }
  if (!response.ok) {
    let mensaje = 'Error de servidor'
    try {
      const cuerpo = await response.json()
      if (cuerpo.message) mensaje = cuerpo.message
    } catch {
      // cuerpo vacío (p. ej. 401 sin body)
    }
    const error = new Error(mensaje) as ErrorConStatus
    error.status = response.status
    throw error
  }
  if (response.status === 204) return null as T
  return response.json()
}

export interface CrearConsultaPayload {
  tiendaSlug: string
  telefono: string
  observaciones?: string
  items: { productoId: number; color: string; talle: string; cantidad: number }[]
}

export async function crearConsulta(payload: CrearConsultaPayload): Promise<{ consulta: { numero: string }; enlaceWhatsApp: string }> {
  return enviarJson(`${API_BASE}/consultas`, { method: 'POST', body: JSON.stringify(payload) })
}

export async function login(usuario: string, clave: string): Promise<Usuario> {
  return enviarJson(`${API_BASE}/auth/login`, { method: 'POST', body: JSON.stringify({ usuario, clave }) })
}

export async function logout() {
  return enviarJson(`${API_BASE}/auth/logout`, { method: 'POST' })
}

export async function fetchMe(): Promise<Usuario> {
  return enviarJson(`${API_BASE}/auth/me`)
}

export interface FiltrosLista {
  estado?: string
  tiendaId?: string
  busqueda?: string
}

export async function fetchConsultas(filtros: FiltrosLista = {}): Promise<ConsultaLista[]> {
  const params = new URLSearchParams()
  if (filtros.estado) params.set('estado', filtros.estado)
  if (filtros.tiendaId) params.set('tiendaId', filtros.tiendaId)
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda)
  const query = params.toString()
  return enviarJson(`${API_BASE}/consultas${query ? `?${query}` : ''}`)
}

export async function fetchConsulta(id: number): Promise<ConsultaDetalle> {
  return enviarJson(`${API_BASE}/consultas/${id}`)
}

export async function cambiarFormaPagoConsulta(id: number, formaPago: FormaPago): Promise<ConsultaDetalle> {
  return enviarJson(`${API_BASE}/consultas/${id}/forma-pago`, {
    method: 'PATCH',
    body: JSON.stringify({ formaPago }),
  })
}

export interface ModificarConsultaPayload {
  motivo: string
  observaciones: string | null
  items: { productoId: number; color: string; talle: string; cantidad: number; observaciones: string | null }[]
}

export async function modificarConsulta(id: number, payload: ModificarConsultaPayload): Promise<ConsultaDetalle> {
  return enviarJson(`${API_BASE}/consultas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function actualizarNotaInterna(id: number, notaInterna: string | null): Promise<ConsultaDetalle> {
  return enviarJson(`${API_BASE}/consultas/${id}/nota-interna`, {
    method: 'PATCH',
    body: JSON.stringify({ notaInterna }),
  })
}

export const MOTIVOS_MODIFICACION = [
  { valor: 'CAMBIO_TALLE', etiqueta: 'Cambió el talle' },
  { valor: 'CAMBIO_PRODUCTO', etiqueta: 'Cambió el producto' },
  { valor: 'CAMBIO_CANTIDAD', etiqueta: 'Cambió la cantidad' },
  { valor: 'CAMBIO_COLOR', etiqueta: 'Cambió el color' },
  { valor: 'CORRECCION', etiqueta: 'Corrección de datos' },
  { valor: 'OTRO', etiqueta: 'Otro' },
] as const

export const TALLES_POR_TIENDA: Record<string, { titulo: string; talles: string[] }[]> = {
  'mokositos-bebes': [
    { titulo: 'Bebés', talles: ['RN', '0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M'] },
  ],
  'mokositos-ninos': [
    { titulo: 'Pequeños', talles: ['2', '4', '6'] },
    { titulo: 'Niños', talles: ['8', '10', '12'] },
  ],
  'agrandaditos': [
    { titulo: 'Niños', talles: ['8', '10', '12', '14', '16'] },
  ],
  'mood-teens': [
    { titulo: 'Adolescentes', talles: ['XXS', 'XS', 'S', 'M', 'L', 'XL'] },
  ],
}

export function tallesPorTienda(slug: string) {
  return TALLES_POR_TIENDA[slug] ?? TALLES_POR_TIENDA['agrandaditos']
}

export async function fetchVentas(filtros: FiltrosLista = {}): Promise<VentaLista[]> {
  const params = new URLSearchParams()
  if (filtros.estado) params.set('estado', filtros.estado)
  if (filtros.tiendaId) params.set('tiendaId', filtros.tiendaId)
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda)
  const query = params.toString()
  return enviarJson(`${API_BASE}/ventas${query ? `?${query}` : ''}`)
}

export async function fetchVenta(id: number): Promise<VentaDetalle> {
  return enviarJson(`${API_BASE}/ventas/${id}`)
}

export async function confirmarConsulta(consultaId: number): Promise<VentaDetalle> {
  return enviarJson(`${API_BASE}/consultas/${consultaId}/confirmar`, { method: 'POST' })
}

export async function cancelarConsulta(id: number): Promise<ConsultaDetalle> {
  return enviarJson(`${API_BASE}/consultas/${id}/cancelar`, { method: 'PATCH' })
}

export async function entregarVenta(id: number): Promise<VentaDetalle> {
  return enviarJson(`${API_BASE}/ventas/${id}/entregar`, { method: 'POST' })
}

export async function cancelarVenta(id: number): Promise<VentaDetalle> {
  return enviarJson(`${API_BASE}/ventas/${id}/cancelar`, { method: 'POST' })
}

export const ESTADOS_CONSULTA: { valor: EstadoConsulta; etiqueta: string }[] = [
  { valor: 'EN_PREPARACION', etiqueta: 'En preparación' },
  { valor: 'CONFIRMADA', etiqueta: 'Confirmado' },
  { valor: 'CANCELADA', etiqueta: 'Cancelado' },
]

export const ESTADOS_VENTA: { valor: EstadoVenta; etiqueta: string }[] = [
  { valor: 'CONFIRMADA', etiqueta: 'Confirmada' },
  { valor: 'ENTREGADA', etiqueta: 'Entregada' },
  { valor: 'CANCELADA', etiqueta: 'Cancelada' },
]

export const METODOS_PAGO: { valor: MetodoPago; etiqueta: string }[] = [
  { valor: 'EFECTIVO', etiqueta: 'Efectivo' },
  { valor: 'TARJETA_DEBITO', etiqueta: 'Tarjeta de débito' },
  { valor: 'TARJETA_CREDITO', etiqueta: 'Tarjeta de crédito' },
  { valor: 'TRANSFERENCIA', etiqueta: 'Transferencia' },
  { valor: 'MERCADO_PAGO', etiqueta: 'Mercado Pago' },
]

export function etiquetaMetodoPago(valor: MetodoPago): string {
  return METODOS_PAGO.find((m) => m.valor === valor)?.etiqueta ?? valor
}

export function etiquetaEstado(estado: string): string {
  return (
    ESTADOS_CONSULTA.find((e) => e.valor === estado)?.etiqueta ??
    ESTADOS_VENTA.find((e) => e.valor === estado)?.etiqueta ??
    estado
  )
}

export type { CarritoItem, VarianteProducto }