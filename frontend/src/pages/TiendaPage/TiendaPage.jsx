import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import CategoryFilter from '../../components/CategoryFilter/CategoryFilter'
import GeneroFilter from '../../components/GeneroFilter/GeneroFilter'
import ProductGrid from '../../components/ProductGrid/ProductGrid'
import ProductModal from '../../components/ProductModal/ProductModal'
import CartModal from '../../components/CartModal/CartModal'
import SkeletonCard from '../../components/SkeletonCard/SkeletonCard'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import NombreTienda from '../../components/NombreTienda/NombreTienda'
import { useFetch } from '../../hooks/useFetch'
import useSeo from '../../hooks/useSeo'
import {
  fetchCategorias,
  fetchGeneros,
  fetchProductos,
  fetchTienda,
  fetchTiendas,
} from '../../services/api'
import styles from './TiendaPage.module.css'

function TiendaPage() {
  const { slug } = useParams()
  const [categoria, setCategoria] = useState('')
  const [genero, setGenero] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [carrito, setCarrito] = useState([])
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const productosRef = useRef(null)

  const todoActivo = categoria === '' && genero === ''

  const seleccionarTodo = () => {
    setCategoria('')
    setGenero('')
    productosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const tienda = useFetch(() => fetchTienda(slug), [slug])
  const categorias = useFetch(() => fetchCategorias(slug), [slug])
  const generos = useFetch(() => fetchGeneros(slug), [slug])
  const productos = useFetch(() => {
    const categoriaBackend = categoria === 'destacados' ? '' : categoria
    return fetchProductos(slug, categoriaBackend, genero)
  }, [slug, categoria, genero])
  const tiendas = useFetch(fetchTiendas, [])

  const jsonLdTienda = tienda.data ? {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: tienda.data.nombre,
    description: tienda.data.descripcion || `Tienda de ropa para ${tienda.data.etiquetaEdad} en Corrientes Capital.`,
    url: `https://agrandaditostiendas.onrender.com/tienda/${slug}`,
    image: tienda.data.imagenHero,
    priceRange: '$$',
    openingHours: 'Mo-Sa 09:00-20:00',
    telephone: tienda.data.whatsapp ? `+${tienda.data.whatsapp.replace(/\s/g, '')}` : undefined,
    areaServed: 'Corrientes Capital, Argentina',
    address: { '@type': 'PostalAddress', addressLocality: 'Corrientes', addressRegion: 'Corrientes', addressCountry: 'AR' },
    geo: { '@type': 'GeoCoordinates', latitude: -27.4678, longitude: -58.8167 },
  } : undefined

  useSeo({
    titulo: tienda.data
      ? `${tienda.data.nombre} · Tienda para ${tienda.data.etiquetaEdad} · AgrandaditosTienda`
      : 'AgrandaditosTienda · Tiendas de moda para chicos',
    descripcion: tienda.data?.descripcion,
    canonical: `https://agrandaditostiendas.onrender.com/tienda/${slug}`,
    jsonLd: jsonLdTienda,
  })

  useEffect(() => {
    setCategoria('destacados')
    setGenero('')
    setProductoSeleccionado(null)
    setCarrito([])
    setCarritoAbierto(false)
    window.scrollTo(0, 0)
  }, [slug])

  const cantidadCarrito = carrito.reduce((suma, item) => suma + item.cantidad, 0)

  const agregarAlCarrito = (item) => {
    setCarrito((prev) => {
      const existente = prev.findIndex(
        (i) => i.productoId === item.productoId && i.color === item.color && i.talle === item.talle,
      )
      if (existente >= 0) {
        const copia = [...prev]
        copia[existente] = { ...copia[existente], cantidad: copia[existente].cantidad + item.cantidad }
        return copia
      }
      return [...prev, item]
    })
    setProductoSeleccionado(null)
    setCarritoAbierto(true)
  }

  const quitarDelCarrito = (indice) => {
    setCarrito((prev) => prev.filter((_, i) => i !== indice))
    if (carrito.length - 1 === 0) setCarritoAbierto(false)
  }

  const limpiarCarrito = () => setCarrito([])

  const productosVisibles = categoria === 'destacados'
    ? (productos.data ?? []).filter((p) => p.destacado)
    : (productos.data ?? [])

  if (tienda.isLoading) {
    return (
      <>
        <Header colorPrimario={tienda.data?.colorPrimario} />
        <div className={styles.skeletonHero} />
      </>
    )
  }

  if (tienda.error || !tienda.data) {
    return (
      <>
        <Header colorPrimario={tienda.data?.colorPrimario} />
        <main className={styles.contenido}>
          <ErrorMessage message={tienda.error ?? 'Tienda no encontrada'} />
        </main>
        <Footer tiendas={tiendas.data ?? []} colorPrimario={tienda.data?.colorPrimario} />
      </>
    )
  }

  const tiendaActual = tienda.data

  return (
    <>
      <Header colorPrimario={tiendaActual.colorPrimario} />
      <main>
        <section
          className={styles.hero}
          style={{ '--primario': tiendaActual.colorPrimario, '--secundario': tiendaActual.colorSecundario }}
        >
          <div className={styles.heroContenido}>
            <div className={styles.heroBarra}>
              <Link to="/" className={styles.volver}>
                <span className={styles.volverIcono} aria-hidden="true">←</span>
                Volver al grupo
              </Link>
            </div>
            <NombreTienda tienda={tiendaActual} className={styles.nombre} />
            <p className={styles.descripcion}>{tiendaActual.descripcion}</p>
          </div>
        </section>

        <section className={styles.contenido}>
          <div className={styles.filtroBarra}>
            <div className={styles.filtros}>
              {generos.isLoading ? (
                <div className={styles.skeletonFiltros}>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                generos.data &&
                generos.data.length > 1 && (
                  <GeneroFilter
                    generos={generos.data}
                    seleccionado={genero}
                    onSeleccionar={setGenero}
                    colorPrimario={tiendaActual.colorPrimario}
                    onTodo={seleccionarTodo}
                    todoActivo={todoActivo}
                  />
                )
              )}
              {categorias.isLoading ? (
                <div className={styles.skeletonFiltros}>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                categorias.data && (
                  <CategoryFilter
                    categorias={categorias.data}
                    seleccionada={categoria}
                    onSeleccionar={setCategoria}
                    colorPrimario={tiendaActual.colorPrimario}
                  />
                )
              )}
            </div>
          </div>

          <div ref={productosRef} className={styles.productos}>
            {productos.isLoading && (
              <div className={styles.grid}>
                {Array.from({ length: 8 }).map((_, indice) => (
                  <SkeletonCard key={indice} />
                ))}
              </div>
            )}
            {productos.error && <ErrorMessage message={productos.error} />}
            {productos.data && (
              <ProductGrid
                productos={productosVisibles}
                onSeleccionar={setProductoSeleccionado}
                mensajeVacio={
                  categoria === 'destacados'
                    ? 'Todavía no hay prendas destacadas en esta tienda. ¡Volvé pronto!'
                    : undefined
                }
              />
            )}
          </div>
        </section>
      </main>
      <Footer tiendas={tiendas.data ?? []} colorPrimario={tiendaActual.colorPrimario} />

      {productoSeleccionado && (
        <ProductModal
          producto={productoSeleccionado}
          tienda={tiendaActual}
          onCerrar={() => setProductoSeleccionado(null)}
          onAgregar={agregarAlCarrito}
        />
      )}

      {carrito.length > 0 && (
        <button
          type="button"
          className={styles.carritoFlotante}
          style={{ '--primario': tiendaActual.colorPrimario }}
          onClick={() => setCarritoAbierto(true)}
          aria-label={`Abrir carrito, ${cantidadCarrito} productos`}
        >
          <span className={styles.carritoIcono} aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M3 6h18" strokeLinecap="round" />
              <path d="M16 10a4 4 0 0 1-8 0" strokeLinecap="round" />
            </svg>
          </span>
          {cantidadCarrito > 0 && <span className={styles.carritoContador}>{cantidadCarrito}</span>}
        </button>
      )}

      {carritoAbierto && (
        <CartModal
          items={carrito}
          tienda={tiendaActual}
          onCerrar={() => setCarritoAbierto(false)}
          onQuitar={quitarDelCarrito}
          onLimpiar={limpiarCarrito}
        />
      )}
    </>
  )
}

export default TiendaPage
