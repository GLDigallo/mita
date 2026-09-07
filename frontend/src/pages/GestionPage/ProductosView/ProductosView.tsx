import { useCallback, useEffect, useRef, useState } from 'react'
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ToastHost from '../../../components/Toast/Toast'
import { useToasts } from '../../../hooks/useToasts'
import {
  actualizarProducto,
  crearCategoria,
  crearProducto,
  eliminarCategoria,
  eliminarProducto,
  fetchCategorias,
  fetchProductos,
  formatearPrecio,
  subirImagen,
  tallesPorTienda,
} from '../../../services/api'
import type { Categoria, Genero, Producto, Tienda } from '../../../types'

interface PropsProductosView {
  tienda: Tienda | null
  esDueno: boolean
  tiendas: Tienda[]
}

interface VarianteForm {
  color: string
  talle: string
  stock: string
}

interface DatosProducto {
  nombre: string
  descripcion: string
  precio: string
  imagen: string
  talles: string
  genero: Genero
  destacado: boolean
  categoriaSlug: string
  variantes: VarianteForm[]
}

interface Editando {
  modo: 'crear' | 'editar'
  datos: DatosProducto
  producto?: Producto
}

const GENEROS: { valor: Genero; etiqueta: string }[] = [
  { valor: 'NINO', etiqueta: 'Niño' },
  { valor: 'NINA', etiqueta: 'Niña' },
  { valor: 'UNISEX', etiqueta: 'Unisex' },
]

const inputBase =
  'w-full min-h-11 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3 py-2 text-[15px] text-[var(--color-texto)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--color-marca)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-marca)_15%,transparent)] focus:outline-none'

const botonGuardar =
  'min-h-10 rounded-[var(--radius-sm)] border border-[var(--gestion-color,var(--color-marca))] bg-[var(--gestion-color,var(--color-marca))] px-4 text-[14px] font-semibold text-white transition-opacity duration-200 hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50'

const botonSecundario =
  'min-h-10 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-4 text-[14px] font-semibold text-[var(--color-texto)] transition-colors duration-200 hover:border-[var(--color-marca)]'

const botonPeligro =
  'min-h-[36px] rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3 text-[13px] font-semibold text-[#c0392b] transition-colors duration-200 hover:border-[#c0392b]'

function ProductosView({ tienda, esDueno }: PropsProductosView) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const { toasts, mostrar, quitar } = useToasts()

  const [catFiltro, setCatFiltro] = useState('')
  const [generoFiltro, setGeneroFiltro] = useState('')

  const [vista, setVista] = useState<'lista' | 'formulario'>('lista')
  const [editando, setEditando] = useState<Editando | null>(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState<Producto | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [catInput, setCatInput] = useState('')
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [catsAbierto, setCatsAbierto] = useState(false)

  const tiendaSlug = tienda?.slug ?? ''
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cargar = useCallback(async () => {
    if (!tiendaSlug) return
    setCargando(true)
    try {
      const [prods, cats] = await Promise.all([
        fetchProductos(tiendaSlug, catFiltro, generoFiltro),
        fetchCategorias(tiendaSlug),
      ])
      setProductos(prods)
      setCategorias(cats)
    } catch (err) {
      mostrar('error', (err as Error).message)
      setProductos([])
    } finally {
      setCargando(false)
    }
  }, [tiendaSlug, catFiltro, generoFiltro])

  useEffect(() => {
    cargar()
  }, [cargar])

  function abrirCrear() {
    setEditando({ modo: 'crear', datos: formularioVacio() })
    setVista('formulario')
  }

  function abrirEditar(producto: Producto) {
    setEditando({
      modo: 'editar',
      datos: {
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? '',
        precio: String(producto.precio),
        imagen: producto.imagen ?? '',
        talles: producto.talles ?? '',
        genero: producto.genero ?? 'UNISEX',
        destacado: producto.destacado,
        categoriaSlug: producto.categoriaSlug ?? '',
        variantes: (producto.variantes ?? []).map((v) => ({
          color: v.color,
          talle: v.talle,
          stock: String(v.stock),
        })),
      },
      producto,
    })
    setVista('formulario')
  }

  function formularioVacio(): DatosProducto {
    return {
      nombre: '',
      descripcion: '',
      precio: '',
      imagen: '',
      talles: '',
      genero: 'UNISEX',
      destacado: false,
      categoriaSlug: categorias[0]?.slug ?? '',
      variantes: [{ color: '', talle: '', stock: '0' }],
    }
  }

  function actualizarCampo(campo: keyof DatosProducto, valor: DatosProducto[keyof DatosProducto]) {
    setEditando((prev) => (prev ? { ...prev, datos: { ...prev.datos, [campo]: valor } } : prev))
  }

  function agregarVariante() {
    setEditando((prev) =>
      prev
        ? { ...prev, datos: { ...prev.datos, variantes: [...prev.datos.variantes, { color: '', talle: '', stock: '0' }] } }
        : prev,
    )
  }

  function actualizarVariante(idx: number, campo: keyof VarianteForm, valor: string) {
    setEditando((prev) => {
      if (!prev) return prev
      const v = [...prev.datos.variantes]
      v[idx] = { ...v[idx], [campo]: valor }
      return { ...prev, datos: { ...prev.datos, variantes: v } }
    })
  }

  function eliminarVariante(idx: number) {
    setEditando((prev) =>
      prev
        ? { ...prev, datos: { ...prev.datos, variantes: prev.datos.variantes.filter((_, i) => i !== idx) } }
        : prev,
    )
  }

  async function guardar() {
    if (!editando) return
    const d = editando.datos
    if (!d.nombre.trim() || !d.precio || !d.categoriaSlug) {
      mostrar('error', 'Completá nombre, precio y categoría')
      return
    }
    const precio = parseFloat(d.precio)
    if (isNaN(precio) || precio <= 0) {
      mostrar('error', 'El precio debe ser un número mayor a 0')
      return
    }
    const variantesIncompletas = d.variantes.filter(
      (v) => (v.color.trim() && !v.talle.trim()) || (!v.color.trim() && v.talle.trim()),
    )
    if (variantesIncompletas.length > 0 && editando.modo === 'editar') {
      if (!window.confirm('Hay variantes incompletas (falta color o talle). Se van a borrar al guardar. ¿Continuar?')) return
    }

    const variantes = d.variantes
      .filter((v) => v.color.trim() && v.talle.trim())
      .map((v) => ({ color: v.color.trim(), talle: v.talle.trim(), stock: parseInt(v.stock, 10) || 0 }))

    const tallesAuto = [...new Set(variantes.map((v) => v.talle))].join(' / ')

    const payload = {
      nombre: d.nombre.trim(),
      descripcion: d.descripcion.trim(),
      precio,
      imagen: d.imagen.trim(),
      talles: tallesAuto,
      genero: d.genero,
      destacado: d.destacado,
      categoriaSlug: d.categoriaSlug,
      variantes,
    }

    setGuardando(true)
    try {
      if (editando.modo === 'crear') {
        await crearProducto(tiendaSlug, payload)
      } else {
        await actualizarProducto(editando.producto!.id, payload)
      }
      setEditando(null)
      setVista('lista')
      cargar()
    } catch (err) {
      mostrar('error', (err as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  async function confirmarBorrar() {
    if (!confirmarEliminar) return
    setGuardando(true)
    try {
      await eliminarProducto(confirmarEliminar.id)
      setConfirmarEliminar(null)
      cargar()
    } catch (err) {
      mostrar('error', (err as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  const totalStock = (producto: Producto) =>
    (producto.variantes ?? []).reduce((acc: number, v) => acc + (v.stock ?? 0), 0)

  async function handleSubirImagen(archivo: File) {
    setSubiendoImagen(true)
    try {
      const resultado = await subirImagen(archivo)
      actualizarCampo('imagen', resultado.url)
    } catch (err) {
      mostrar('error', (err as Error).message)
    } finally {
      setSubiendoImagen(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function crearCategoriaInline(nombre: string): Promise<Categoria | null> {
    if (!nombre.trim()) return null
    setGuardando(true)
    try {
      await crearCategoria(tiendaSlug, nombre.trim())
      const cats = await fetchCategorias(tiendaSlug)
      setCategorias(cats)
      return cats.find((c) => c.nombre.toLowerCase() === nombre.trim().toLowerCase()) ?? null
    } catch (err) {
      mostrar('error', (err as Error).message)
      return null
    } finally {
      setGuardando(false)
    }
  }

  async function borrarCategoria(cat: Categoria) {
    if (!window.confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return
    setGuardando(true)
    try {
      await eliminarCategoria(cat.id)
      if (catFiltro === cat.slug) setCatFiltro('')
      const cats = await fetchCategorias(tiendaSlug)
      setCategorias(cats)
      if (editando?.datos?.categoriaSlug === cat.slug) {
        actualizarCampo('categoriaSlug', '')
      }
      const prods = await fetchProductos(tiendaSlug, catFiltro === cat.slug ? '' : catFiltro, generoFiltro)
      setProductos(prods)
    } catch (err) {
      mostrar('error', (err as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  if (vista === 'formulario' && editando) {
    return (
      <div className="max-w-[700px]">
        <div className="mb-5 flex items-center gap-3">
          <h3 className="text-[18px] font-bold">{editando.modo === 'crear' ? 'Nuevo producto' : 'Editar producto'}</h3>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-[13px] font-semibold text-[var(--color-texto-suave)]">
            Nombre *
            <input
              className={inputBase}
              value={editando.datos.nombre}
              onChange={(e) => actualizarCampo('nombre', e.target.value)}
              maxLength={120}
              placeholder="Nombre del producto"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1 text-[13px] font-semibold text-[var(--color-texto-suave)]">
              Precio (ARS) *
              <input
                className={inputBase}
                type="number"
                min="0"
                step="100"
                value={editando.datos.precio}
                onChange={(e) => actualizarCampo('precio', e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1 text-[13px] font-semibold text-[var(--color-texto-suave)]">
              Género
              <select
                className={inputBase}
                value={editando.datos.genero}
                onChange={(e) => actualizarCampo('genero', e.target.value as Genero)}
              >
                {GENEROS.map((g) => (
                  <option key={g.valor} value={g.valor}>{g.etiqueta}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-[13px] font-semibold text-[var(--color-texto-suave)]">
            Categoría *
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <select
                  className={`${inputBase} min-w-0 flex-1`}
                  value={editando.datos.categoriaSlug}
                  onChange={(e) => actualizarCampo('categoriaSlug', e.target.value)}
                >
                  <option value="">Seleccionar…</option>
                  {categorias.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.nombre}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="min-h-[38px] shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3 text-[13px] font-semibold text-[var(--color-texto)] transition-colors duration-150 hover:border-[var(--color-marca)]"
                  onClick={() => setCatsAbierto(!catsAbierto)}
                >
                  {catsAbierto ? 'Cerrar' : 'Gestionar'}
                </button>
              </div>
              {catsAbierto && (
                <div className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-fondo)] p-2.5">
                  <div className="flex flex-wrap gap-1">
                    {categorias.map((c) => (
                      <span key={c.slug} className="inline-flex items-center">
                        <button
                          type="button"
                          className={`border border-[var(--color-borde)] px-2.5 py-1 text-[12px] font-medium transition-colors duration-150 ${
                            editando.datos.categoriaSlug === c.slug
                              ? 'border-[var(--color-marca)] bg-[var(--color-marca)] text-white'
                              : 'border-r-0 bg-[var(--color-superficie)] text-[var(--color-texto)] hover:bg-[color-mix(in_srgb,var(--color-marca)_10%,transparent)]'
                          } rounded-l-[var(--radius-sm)]`}
                          onClick={() => {
                            actualizarCampo('categoriaSlug', c.slug)
                            setCatsAbierto(false)
                          }}
                        >
                          {c.nombre}
                        </button>
                        <button
                          type="button"
                          className="rounded-r-[var(--radius-sm)] border border-[var(--color-borde)] border-l-0 bg-[var(--color-superficie)] px-1.5 py-1 text-[13px] font-bold leading-none text-[var(--color-texto-suave)] transition-colors duration-150 hover:bg-[#fef2f2] hover:text-[#dc2626]"
                          onClick={() => borrarCategoria(c)}
                          aria-label={`Eliminar ${c.nombre}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      className={`${inputBase} !w-[150px] flex-none`}
                      value={catInput}
                      onChange={(e) => setCatInput(e.target.value)}
                      placeholder="Nueva categoría…"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (!catInput.trim()) return
                          const nueva = await crearCategoriaInline(catInput.trim())
                          if (nueva) {
                            actualizarCampo('categoriaSlug', nueva.slug)
                            setCatInput('')
                          }
                        }
                      }}
                    />
                    {catInput.trim() && !categorias.find((c) => c.nombre.toLowerCase() === catInput.trim().toLowerCase()) && (
                      <button
                        type="button"
                        className="min-h-[38px] shrink-0 rounded-[var(--radius-sm)] border border-[var(--color-marca)] bg-transparent px-3.5 text-[13px] font-semibold text-[var(--color-marca)] transition-colors duration-150 hover:bg-[var(--color-marca)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={async () => {
                          const nueva = await crearCategoriaInline(catInput.trim())
                          if (nueva) {
                            actualizarCampo('categoriaSlug', nueva.slug)
                            setCatInput('')
                          }
                        }}
                        disabled={guardando}
                      >
                        + Crear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </label>

          <label className="flex flex-col gap-1 text-[13px] font-semibold text-[var(--color-texto-suave)]">
            Imagen
            <div className="mt-1 flex items-center gap-2.5 md:flex-row md:items-center max-sm:flex-col max-sm:items-start">
              <label className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] border border-dashed border-[var(--color-marca)] px-3.5 py-2 text-[13px] font-semibold text-[var(--color-marca)] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--color-marca)_10%,transparent)]">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const archivo = e.target.files?.[0]
                    if (archivo) handleSubirImagen(archivo)
                  }}
                  disabled={subiendoImagen}
                />
                {subiendoImagen ? 'Subiendo…' : ' Subir desde celular/PC'}
              </label>
              <span className="text-[13px] text-[var(--color-texto-suave)]">o pegá URL</span>
            </div>
          </label>

          <input
            className={inputBase}
            type="url"
            value={editando.datos.imagen}
            onChange={(e) => actualizarCampo('imagen', e.target.value)}
            placeholder="https://..."
          />

          {editando.datos.imagen && (
            <img src={editando.datos.imagen} alt="Preview" className="h-20 w-20 rounded-[var(--radius-sm)] object-cover" />
          )}

          <label className="flex flex-col gap-1 text-[13px] font-semibold text-[var(--color-texto-suave)]">
            Descripción
            <input
              className={inputBase}
              value={editando.datos.descripcion}
              onChange={(e) => actualizarCampo('descripcion', e.target.value)}
              placeholder="Descripción corta (opcional)"
              maxLength={200}
            />
          </label>

          {esDueno && (
            <label className="flex cursor-pointer items-center gap-2 text-[14px] font-semibold">
              <input
                type="checkbox"
                className="h-[18px] w-[18px] accent-[var(--color-marca)]"
                checked={editando.datos.destacado}
                onChange={(e) => actualizarCampo('destacado', e.target.checked)}
              />
              Destacado
            </label>
          )}

          <div className="flex items-center justify-between">
            <h4 className="text-[15px] font-bold">Variantes (color + talle + stock)</h4>
            <button type="button" className="min-h-8 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-marca)] bg-transparent px-2.5 text-[13px] font-semibold text-[var(--color-marca)] transition-colors duration-200 hover:bg-[var(--color-marca)] hover:text-white" onClick={agregarVariante}>
              + Agregar
            </button>
          </div>
          <p className="my-1 text-[12px] text-[var(--color-texto-suave)]">
            Cada variante es un producto distinto. Completá color, talle y stock.
          </p>

          {editando.datos.variantes.map((v, idx) => {
            const sinColor = v.color.trim() === ''
            const sinTalle = v.talle.trim() === ''
            const sinStock = !v.stock && v.stock !== '0'
            const incompleta = sinColor || sinTalle || sinStock
            return (
              <div key={idx} className={`grid grid-cols-[1fr_1fr_80px_32px] items-center gap-2 max-sm:grid-cols-2 ${incompleta ? 'rounded-[var(--radius-sm)] bg-[#fffbeb]' : ''}`}>
                <input
                  className={`min-h-10 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-2.5 py-1.5 text-[14px] text-[var(--color-texto)] focus:border-[var(--color-marca)] focus:outline-none ${sinColor ? '!border-[#dc2626]' : ''}`}
                  value={v.color}
                  onChange={(e) => actualizarVariante(idx, 'color', e.target.value)}
                  placeholder="Color"
                  maxLength={40}
                />
                <select
                  className={`min-h-10 cursor-pointer appearance-auto rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-2.5 py-1.5 text-[14px] text-[var(--color-texto)] focus:border-[var(--color-marca)] focus:outline-none ${sinTalle ? '!border-[#dc2626]' : ''}`}
                  value={v.talle}
                  onChange={(e) => actualizarVariante(idx, 'talle', e.target.value)}
                >
                  <option value="">Talle</option>
                  {tallesPorTienda(tiendaSlug).flatMap((g) => g.talles).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  className={`min-h-10 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-2.5 py-1.5 text-center text-[14px] text-[var(--color-texto)] focus:border-[var(--color-marca)] focus:outline-none ${sinStock ? '!border-[#dc2626]' : ''}`}
                  type="number"
                  min="0"
                  value={v.stock}
                  onChange={(e) => actualizarVariante(idx, 'stock', e.target.value)}
                  placeholder="Stock"
                />
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] text-[18px] leading-none text-[#c0392b] transition-colors duration-200 hover:border-[#c0392b] hover:bg-[#c0392b] hover:text-white"
                  onClick={() => eliminarVariante(idx)}
                  aria-label="Eliminar variante"
                >
                  ×
                </button>
              </div>
            )
          })}

          <div className="mt-2 flex justify-end gap-2.5">
            <button
              type="button"
              className={`${botonSecundario} text-[var(--color-texto-suave)] hover:border-[var(--color-texto)]`}
              onClick={() => { setVista('lista'); setEditando(null) }}
            >
              Cancelar
            </button>
            <button type="button" className={botonGuardar} onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando…' : editando.modo === 'crear' ? 'Crear producto' : 'Guardar'}
            </button>
          </div>
        </div>

        <ToastHost toasts={toasts} onCerrar={quitar} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[18px] font-bold">Productos</h3>
        <button type="button" className={botonGuardar} onClick={abrirCrear}>
          + Nuevo producto
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
        <select className={inputBase} value={catFiltro} onChange={(e) => setCatFiltro(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.slug} value={c.slug}>{c.nombre}</option>
          ))}
        </select>
        <select className={inputBase} value={generoFiltro} onChange={(e) => setGeneroFiltro(e.target.value)}>
          <option value="">Todos los géneros</option>
          {GENEROS.map((g) => (
            <option key={g.valor} value={g.valor}>{g.etiqueta}</option>
          ))}
        </select>
      </div>

      {cargando ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[72px] animate-brillar rounded-[var(--radius-md)] border-0 bg-[linear-gradient(90deg,#eeece6_25%,#f6f4ef_50%,#eeece6_75%)] bg-[length:200%_100%]" />
          ))}
        </div>
      ) : productos.length === 0 ? (
        <EmptyState titulo="Sin productos" texto="No hay productos en esta tienda. ¡Creá el primero!" />
      ) : (
        <div className="flex flex-col gap-2">
          {productos.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-borde)] border-l-[3px] border-l-[var(--gestion-color,var(--color-marca))] bg-[var(--color-superficie)] p-3.5 transition-all duration-200 hover:-translate-y-px hover:border-[var(--gestion-color,var(--color-marca))] hover:shadow-[var(--shadow-sm)] max-sm:flex-col max-sm:items-start">
              <div className="flex min-w-0 items-center gap-3">
                {p.imagen && <img src={p.imagen} alt="" className="h-12 w-12 shrink-0 rounded-[var(--radius-sm)] object-cover" />}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[15px] font-semibold">{p.nombre}</span>
                    {p.destacado && <span className="text-[13px] text-[#f59e0b]">★</span>}
                  </div>
                  <p className="mt-0.5 text-[13px] text-[var(--color-texto-suave)]">
                    {p.categoriaNombre} · {p.genero} · {formatearPrecio(p.precio)}
                    {p.variantes?.length > 0 ? ` · ${totalStock(p)} uds en stock` : ''}
                  </p>
                  {p.variantes?.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {p.variantes.map((v) => (
                        <span
                          key={`${v.color}/${v.talle}`}
                          className="inline-flex items-center whitespace-nowrap rounded-full border border-[var(--color-borde)] bg-[var(--color-fondo)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-texto-suave)]"
                        >
                          {v.color} · {v.talle}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5 max-sm:w-full max-sm:justify-end">
                <button type="button" className="min-h-[36px] rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3 text-[13px] font-semibold text-[var(--color-marca)] transition-colors duration-200 hover:border-[var(--color-marca)]" onClick={() => abrirEditar(p)}>
                  Editar
                </button>
                <button type="button" className={botonPeligro} onClick={() => setConfirmarEliminar(p)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmarEliminar && (
        <ConfirmDialog
          titulo="Eliminar producto"
          mensaje={`¿Eliminar "${confirmarEliminar.nombre}"? Esta acción no se puede deshacer.`}
          textoAccion="Eliminar"
          peligro
          onConfirmar={confirmarBorrar}
          onCancelar={() => setConfirmarEliminar(null)}
          cargando={guardando}
        />
      )}

      <ToastHost toasts={toasts} onCerrar={quitar} />
    </div>
  )
}

export default ProductosView