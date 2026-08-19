import { useCallback, useEffect, useState } from 'react'
import ConfirmDialog from '../../../components/ConfirmDialog/ConfirmDialog'
import EmptyState from '../../../components/EmptyState/EmptyState'
import ErrorMessage from '../../../components/ErrorMessage/ErrorMessage'
import {
  actualizarCategoria,
  actualizarProducto,
  crearCategoria,
  crearProducto,
  eliminarCategoria,
  eliminarProducto,
  fetchCategorias,
  fetchProductos,
  formatearPrecio,
  subirImagen,
} from '../../../services/api'
import styles from './ProductosView.module.css'

const GENEROS = [
  { valor: 'NINO', etiqueta: 'Niño' },
  { valor: 'NINA', etiqueta: 'Niña' },
  { valor: 'UNISEX', etiqueta: 'Unisex' },
]

const TALLES_DEFAULT = 'XS / S / M / L / XL'

function ProductosView({ tienda, esDueno, tiendas }) {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [catFiltro, setCatFiltro] = useState('')
  const [generoFiltro, setGeneroFiltro] = useState('')

  const [vista, setVista] = useState('lista')
  const [editando, setEditando] = useState(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const [catInput, setCatInput] = useState('')
  const [confirmarEliminarCat, setConfirmarEliminarCat] = useState(null)
  const [subiendoImagen, setSubiendoImagen] = useState(false)

  const tiendaSlug = tienda?.slug ?? ''

  const cargar = useCallback(async () => {
    if (!tiendaSlug) return
    setCargando(true)
    setError('')
    try {
      const [prods, cats] = await Promise.all([
        fetchProductos(tiendaSlug, catFiltro, generoFiltro),
        fetchCategorias(tiendaSlug),
      ])
      setProductos(prods)
      setCategorias(cats)
    } catch (err) {
      setError(err.message)
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

  function abrirEditar(producto) {
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

  function formularioVacio() {
    return {
      nombre: '',
      descripcion: '',
      precio: '',
      imagen: '',
      talles: TALLES_DEFAULT,
      genero: 'UNISEX',
      destacado: false,
      categoriaSlug: categorias[0]?.slug ?? '',
      variantes: [{ color: '', talle: '', stock: '0' }],
    }
  }

  function actualizarCampo(campo, valor) {
    setEditando((prev) => ({
      ...prev,
      datos: { ...prev.datos, [campo]: valor },
    }))
  }

  function agregarVariante() {
    setEditando((prev) => ({
      ...prev,
      datos: {
        ...prev.datos,
        variantes: [...prev.datos.variantes, { color: '', talle: '', stock: '0' }],
      },
    }))
  }

  function actualizarVariante(idx, campo, valor) {
    setEditando((prev) => {
      const v = [...prev.datos.variantes]
      v[idx] = { ...v[idx], [campo]: valor }
      return { ...prev, datos: { ...prev.datos, variantes: v } }
    })
  }

  function eliminarVariante(idx) {
    setEditando((prev) => ({
      ...prev,
      datos: {
        ...prev.datos,
        variantes: prev.datos.variantes.filter((_, i) => i !== idx),
      },
    }))
  }

  async function guardar() {
    if (!editando) return
    const d = editando.datos
    if (!d.nombre.trim() || !d.precio || !d.categoriaSlug) {
      setError('Completá nombre, precio y categoría')
      return
    }
    const precio = parseFloat(d.precio)
    if (isNaN(precio) || precio <= 0) {
      setError('El precio debe ser un número mayor a 0')
      return
    }
    const variantes = d.variantes
      .filter((v) => v.color.trim() && v.talle.trim())
      .map((v) => ({ color: v.color.trim(), talle: v.talle.trim(), stock: parseInt(v.stock, 10) || 0 }))

    const payload = {
      nombre: d.nombre.trim(),
      descripcion: d.descripcion.trim(),
      precio,
      imagen: d.imagen.trim(),
      talles: d.talles.trim(),
      genero: d.genero,
      destacado: d.destacado,
      categoriaSlug: d.categoriaSlug,
      variantes,
    }

    setGuardando(true)
    setError('')
    try {
      if (editando.modo === 'crear') {
        await crearProducto(tiendaSlug, payload)
      } else {
        await actualizarProducto(editando.producto.id, payload)
      }
      setEditando(null)
      setVista('lista')
      cargar()
    } catch (err) {
      setError(err.message)
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
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const totalStock = (producto) =>
    (producto.variantes ?? []).reduce((acc, v) => acc + (v.stock ?? 0), 0)

  async function handleSubirImagen(archivo) {
    setSubiendoImagen(true)
    setError('')
    try {
      const resultado = await subirImagen(archivo)
      actualizarCampo('imagen', resultado.url)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubiendoImagen(false)
    }
  }

  async function crearCategoriaInline(nombre) {
    if (!nombre.trim()) return
    setGuardando(true)
    setError('')
    try {
      await crearCategoria(tiendaSlug, nombre.trim())
      await cargar()
      return categorias.find((c) => c.nombre.toLowerCase() === nombre.trim().toLowerCase())
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setGuardando(false)
    }
  }

  async function borrarCategoria(cat) {
    if (!window.confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return
    setGuardando(true)
    setError('')
    try {
      await eliminarCategoria(cat.id)
      const cats = await fetchCategorias(tiendaSlug)
      setCategorias(cats)
      if (editando?.datos?.categoriaSlug === cat.slug) {
        actualizarCampo('categoriaSlug', '')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (vista === 'formulario' && editando) {
    return (
      <div className={styles.formulario}>
        <div className={styles.formHeader}>
          <h3>{editando.modo === 'crear' ? 'Nuevo producto' : 'Editar producto'}</h3>
        </div>

        {error && <ErrorMessage message={error} />}

        <div className={styles.formCampos}>
          <label className={styles.formLabel}>
            Nombre *
            <input
              className={styles.formInput}
              value={editando.datos.nombre}
              onChange={(e) => actualizarCampo('nombre', e.target.value)}
              maxLength={120}
            />
          </label>

          <label className={styles.formLabel}>
            Descripción
            <textarea
              className={styles.formTextarea}
              value={editando.datos.descripcion}
              onChange={(e) => actualizarCampo('descripcion', e.target.value)}
              rows={3}
            />
          </label>

          <div className={styles.formFila}>
            <label className={styles.formLabel}>
              Precio (ARS) *
              <input
                className={styles.formInput}
                type="number"
                min="0"
                step="100"
                value={editando.datos.precio}
                onChange={(e) => actualizarCampo('precio', e.target.value)}
              />
            </label>

            <label className={styles.formLabel}>
              Categoría *
              <select
                className={styles.formInput}
                value={editando.datos.categoriaSlug}
                onChange={(e) => actualizarCampo('categoriaSlug', e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {categorias.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.nombre}</option>
                ))}
              </select>
              <div className={styles.catGestion}>
                {categorias.map((c) => (
                  <span key={c.slug} className={styles.catMini}>
                    <span className={styles.catMiniNombre}>{c.nombre}</span>
                    <button
                      type="button"
                      className={styles.catMiniX}
                      onClick={() => borrarCategoria(c)}
                      aria-label={`Eliminar ${c.nombre}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className={styles.catCrearFila}>
                <input
                  className={styles.formInput}
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
                    className={styles.catCrearBtn}
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
            </label>

            <label className={styles.formLabel}>
              Género
              <select
                className={styles.formInput}
                value={editando.datos.genero}
                onChange={(e) => actualizarCampo('genero', e.target.value)}
              >
                {GENEROS.map((g) => (
                  <option key={g.valor} value={g.valor}>{g.etiqueta}</option>
                ))}
              </select>
            </label>
          </div>

          <label className={styles.formLabel}>
            Imagen
            <div className={styles.imagenOpciones}>
              <label className={styles.imagenUpload}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className={styles.imagenUploadInput}
                  onChange={(e) => {
                    const archivo = e.target.files?.[0]
                    if (archivo) handleSubirImagen(archivo)
                  }}
                  disabled={subiendoImagen}
                />
                {subiendoImagen ? 'Subiendo…' : ' Subir desde celular/PC'}
              </label>
              <span className={styles.imagenO}>o pegá URL</span>
            </div>
          </label>

          <input
            className={styles.formInput}
            type="url"
            value={editando.datos.imagen}
            onChange={(e) => actualizarCampo('imagen', e.target.value)}
            placeholder="https://..."
          />

          {editando.datos.imagen && (
            <img src={editando.datos.imagen} alt="Preview" className={styles.preview} />
          )}

          <label className={styles.formLabel}>
            Talles disponibles
            <input
              className={styles.formInput}
              value={editando.datos.talles}
              onChange={(e) => actualizarCampo('talles', e.target.value)}
              placeholder="XS / S / M / L / XL"
            />
          </label>

          {esDueno && (
            <label className={styles.formCheck}>
              <input
                type="checkbox"
                checked={editando.datos.destacado}
                onChange={(e) => actualizarCampo('destacado', e.target.checked)}
              />
              Destacado
            </label>
          )}

          <div className={styles.variantesHeader}>
            <h4>Variantes (color + talle + stock)</h4>
            <button type="button" className={styles.agregarVarBtn} onClick={agregarVariante}>
              + Agregar variante
            </button>
          </div>

          {editando.datos.variantes.map((v, idx) => (
            <div key={idx} className={styles.varianteFila}>
              <input
                className={styles.varianteInput}
                value={v.color}
                onChange={(e) => actualizarVariante(idx, 'color', e.target.value)}
                placeholder="Color"
                maxLength={40}
              />
              <input
                className={styles.varianteInput}
                value={v.talle}
                onChange={(e) => actualizarVariante(idx, 'talle', e.target.value)}
                placeholder="Talle"
                maxLength={20}
              />
              <input
                className={`${styles.varianteInput} ${styles.varianteStock}`}
                type="number"
                min="0"
                value={v.stock}
                onChange={(e) => actualizarVariante(idx, 'stock', e.target.value)}
                placeholder="Stock"
              />
              <button
                type="button"
                className={styles.varianteEliminar}
                onClick={() => eliminarVariante(idx)}
                aria-label="Eliminar variante"
              >
                ×
              </button>
            </div>
          ))}

          <div className={styles.formAcciones}>
            <button type="button" className={styles.btnCancelar} onClick={() => { setVista('lista'); setEditando(null) }}>
              Cancelar
            </button>
            <button type="button" className={styles.btnGuardar} onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando…' : editando.modo === 'crear' ? 'Crear producto' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.listaHeader}>
        <h3>Productos</h3>
        <button type="button" className={styles.btnCrear} onClick={abrirCrear}>
          + Nuevo producto
        </button>
      </div>

      <div className={styles.filtros}>
        <select className={styles.select} value={catFiltro} onChange={(e) => setCatFiltro(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.slug} value={c.slug}>{c.nombre}</option>
          ))}
        </select>
        <select className={styles.select} value={generoFiltro} onChange={(e) => setGeneroFiltro(e.target.value)}>
          <option value="">Todos los géneros</option>
          {GENEROS.map((g) => (
            <option key={g.valor} value={g.valor}>{g.etiqueta}</option>
          ))}
        </select>
      </div>

      {error && <ErrorMessage message={error} />}

      {cargando ? (
        <div className={styles.lista}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`${styles.fila} ${styles.filaSkeleton}`} />
          ))}
        </div>
      ) : productos.length === 0 ? (
        <EmptyState titulo="Sin productos" texto="No hay productos en esta tienda. ¡Creá el primero!" />
      ) : (
        <div className={styles.lista}>
          {productos.map((p) => (
            <div key={p.id} className={styles.fila}>
              <div className={styles.filaIzq}>
                {p.imagen && <img src={p.imagen} alt="" className={styles.filaImg} />}
                <div className={styles.filaInfo}>
                  <div className={styles.filaTop}>
                    <span className={styles.filaNombre}>{p.nombre}</span>
                    {p.destacado && <span className={styles.badgeDestacado}>★</span>}
                  </div>
                  <p className={styles.filaMeta}>
                    {p.categoriaNombre} · {p.genero} · {formatearPrecio(p.precio)}
                    {p.variantes?.length > 0 ? ` · ${totalStock(p)} uds en stock` : ''}
                  </p>
                  {p.variantes?.length > 0 && (
                    <p className={styles.filaVariantes}>
                      {p.variantes.map((v) => `${v.color}/${v.talle}`).join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <div className={styles.filaAcciones}>
                <button type="button" className={styles.btnEditar} onClick={() => abrirEditar(p)}>
                  Editar
                </button>
                <button type="button" className={styles.btnBorrar} onClick={() => setConfirmarEliminar(p)}>
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
    </div>
  )
}

export default ProductosView
