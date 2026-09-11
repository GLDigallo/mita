export interface Tienda {
  id: number
  nombre: string
  slug: string
  etiquetaEdad: string
  colorPrimario: string
  colorSecundario: string
  imagenHero: string
  descripcion: string
  whatsapp: string
}

export interface Categoria {
  id: number
  slug: string
  nombre: string
}

export type Genero = 'NINO' | 'NINA' | 'UNISEX'

export interface VarianteProducto {
  id: number
  color: string
  talle: string
  stock: number
}

export interface Producto {
  id: number
  nombre: string
  descripcion: string
  precio: number
  imagen: string
  talles: string
  genero: Genero
  destacado: boolean
  categoriaSlug: string
  categoriaNombre: string
  tiendaSlug: string
  tiendaNombre: string
  variantes: VarianteProducto[]
  precioPromocional?: number
  precioAnterior?: number
  promoTitulo?: string
  promoTipo?: string
  promoBadge?: string
}

export interface CarritoItem {
  productoId: number
  nombre: string
  imagen: string
  precio: number
  color: string
  talle: string
  cantidad: number
}

export type EstadoConsulta = 'PENDIENTE' | 'EN_REVISION' | 'ESPERANDO_CLIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'FINALIZADA'

export type EstadoVenta = 'EN_PREPARACION' | 'CONFIRMADA' | 'ENTREGADA' | 'CANCELADA'

export type FormaPago = 'EFECTIVO' | 'TARJETA' | 'DIGITAL'

export type MetodoPago = 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA' | 'MERCADO_PAGO'

export interface ConsultaLista {
  id: number
  numero: string
  estado: EstadoConsulta
  tiendaId: number
  tiendaSlug: string
  tiendaNombre: string
  clienteNombre: string
  clienteTelefono: string
  totalItems: number
  fechaConsulta: string
}

export interface ProductoConsultado {
  id: number
  productoId: number
  productoNombre: string
  productoImagen: string
  color: string
  talle: string
  cantidad: number
  precioUnitario: number
  observaciones: string
  variantes: VarianteProducto[]
}

export interface ConsultaDetalle extends ConsultaLista {
  version: number
  editable: boolean
  formaPago: FormaPago
  observaciones: string
  notaInterna: string
  productos: ProductoConsultado[]
  ventaAsociada: EstadoVenta | null
  ventaId: number | null
  fechaLimite: string | null
}

export interface VentaLista {
  id: number
  numero: string
  estado: EstadoVenta
  consultaId: number
  consultaNumero: string
  tiendaId: number
  tiendaNombre: string
  tiendaSlug: string
  clienteNombre: string
  clienteTelefono: string
  empleado: string
  importeTotal: number
  totalItems: number
  fechaVenta: string
}

export interface VentaItem {
  id: number
  productoId: number
  varianteId: number
  productoNombre: string
  productoImagen: string
  color: string
  talle: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  stockDisponible: number
}

export interface VentaDetalle extends VentaLista {
  metodoPago: MetodoPago
  items: VentaItem[]
}

export type RolUsuario = 'DUENO' | 'ENCARGADA'

export interface Usuario {
  id: number
  usuario: string
  nombre: string
  rol: RolUsuario
  tiendaId: number
  tiendaSlug: string
  tiendaNombre: string
}