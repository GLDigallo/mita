import { useEffect, useRef, useState, type CSSProperties } from 'react'
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
import type { CarritoItem, Producto } from '../../types'

const brillo = 'animate-brillar bg-[linear-gradient(100deg,#eeece6_40%,#f7f5f0_50%,#eeece6_60%)] bg-[length:200%_100%]'

function TiendaPage() {
  const { slug } = useParams()
  const [categoria, setCategoria] = useState('')
  const [genero, setGenero] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [carrito, setCarrito] = useState<CarritoItem[]>([])
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const productosRef = useRef<HTMLDivElement>(null)

  const todoActivo = categoria === '' && genero === ''

  const seleccionarTodo = () => {
    setCategoria('')
    setGenero('')
    productosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const tienda = useFetch(() => fetchTienda(slug ?? ''), [slug])
  const categorias = useFetch(() => fetchCategorias(slug ?? ''), [slug])
  const generos = useFetch(() => fetchGeneros(slug ?? ''), [slug])
  const productos = useFetch(() => {
    const categoriaBackend = categoria === 'destacados' ? '' : categoria
    return fetchProductos(slug ?? '', categoriaBackend, genero)
  }, [slug, categoria, genero])
  const tiendas = useFetch(fetchTiendas, [])

  const jsonLdTienda = tienda.data
    ? {
        '@context': 'https://schema.org',
        '@type': 'ClothingStore',
        name: tienda.data.nombre,
        description:
          tienda.data.descripcion ||
          `Tienda de ropa para ${tienda.data.etiquetaEdad} en Corrientes Capital.`,
        url: `https://agrandaditostiendas.onrender.com/tienda/${slug}`,
        image: tienda.data.imagenHero,
        priceRange: '$$',
        openingHours: 'Mo-Sa 09:00-20:00',
        telephone: tienda.data.whatsapp ? `+${tienda.data.whatsapp.replace(/\s/g, '')}` : undefined,
        areaServed: 'Corrientes Capital, Argentina',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Corrientes',
          addressRegion: 'Corrientes',
          addressCountry: 'AR',
        },
        geo: { '@type': 'GeoCoordinates', latitude: -27.4678, longitude: -58.8167 },
      }
    : undefined

  useSeo({
    titulo: tienda.data
      ? `${tienda.data.nombre} · Tienda para ${tienda.data.etiquetaEdad} · AgrandaditosTienda`
      : 'AgrandaditosTienda · Tiendas de moda para chicos',
    descripcion: tienda.data?.descripcion,
    canonical: `https://agrandaditostiendas.onrender.com/tienda/${slug}`,
    jsonLd: jsonLdTienda,
  })

  useEffect(() => {
    setCategoria('')
    setGenero('')
    setProductoSeleccionado(null)
    setCarrito([])
    setCarritoAbierto(false)
    window.scrollTo(0, 0)
  }, [slug])

  const cantidadCarrito = carrito.reduce((suma, item) => suma + item.cantidad, 0)

  const agregarAlCarrito = (item: CarritoItem) => {
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

  const quitarDelCarrito = (indice: number) => {
    setCarrito((prev) => prev.filter((_, i) => i !== indice))
    if (carrito.length - 1 === 0) setCarritoAbierto(false)
  }

  const limpiarCarrito = () => setCarrito([])

  const productosVisibles =
    categoria === 'destacados'
      ? (productos.data ?? []).filter((p) => p.destacado)
      : (productos.data ?? [])

  if (tienda.isLoading) {
    return (
      <>
        <Header colorPrimario={tienda.data?.colorPrimario} />
        <div className="h-[260px] animate-brillar bg-[linear-gradient(100deg,#e5e2da_40%,#f0ede5_50%,#e5e2da_60%)] bg-[length:200%_100%]" />
      </>
    )
  }

  if (tienda.error || !tienda.data) {
    return (
      <>
        <Header colorPrimario={tienda.data?.colorPrimario} />
        <main className="mx-auto max-w-[1200px] px-4 pt-7 sm:px-5 md:px-6">
          <ErrorMessage message={tienda.error ?? 'Tienda no encontrada'} />
        </main>
        <Footer tiendas={tiendas.data ?? []} colorPrimario={tienda.data?.colorPrimario} />
      </>
    )
  }

  const tiendaActual = tienda.data
  const estiloHero = {
    '--primario': tiendaActual.colorPrimario,
    '--secundario': tiendaActual.colorSecundario,
  } as CSSProperties
  const estiloCarrito = { '--primario': tiendaActual.colorPrimario } as CSSProperties

  return (
    <>
      <Header colorPrimario={tiendaActual.colorPrimario} />
      <main>
        <section className="bg-[linear-gradient(135deg,var(--primario)_0%,var(--secundario)_100%)] text-white" style={estiloHero}>
          <div className="mx-auto max-w-[1200px] px-4 py-11 pb-13 sm:px-5 md:px-6 md:py-15 md:pb-18">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3 md:gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-1 rounded-full border border-white/28 bg-black/22 px-2.5 py-1.5 text-[10.5px] font-semibold text-white/92 transition-colors duration-200 hover:bg-black/35"
              >
                <span className="text-[12px] leading-none transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-x-1" aria-hidden="true">
                  ←
                </span>
                Volver al grupo
              </Link>
            </div>
            <NombreTienda tienda={tiendaActual} className="text-[clamp(38px,12vw,68px)] tracking-[-0.03em] md:text-[clamp(44px,7vw,68px)]" />
            <p className="mt-3.5 max-w-[640px] text-[15px] leading-[1.65] text-white/88 md:text-[16.5px]">
              {tiendaActual.descripcion}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 pt-7 sm:px-5 md:px-6 md:pt-9">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-7">
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              {generos.isLoading ? (
                <div className="flex flex-wrap gap-2.5">
                  {Array.from({ length: 4 }).map((_, indice) => (
                    <span key={indice} className={`${brillo} h-[42px] w-[90px] rounded-full`} />
                  ))}
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
                <div className="flex flex-wrap gap-2.5">
                  {Array.from({ length: 4 }).map((_, indice) => (
                    <span key={indice} className={`${brillo} h-[42px] w-[90px] rounded-full`} />
                  ))}
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

          <div ref={productosRef} className="scroll-mt-[84px]">
            {productos.isLoading && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
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
          className="fixed bottom-4 right-4 z-[calc(var(--z-modal)-1)] flex h-15 w-15 items-center justify-center rounded-full border-0 bg-[var(--primario,#4f46e5)] text-white shadow-[var(--shadow-lg)] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(20,20,30,0.35)] md:bottom-6 md:right-6 md:h-16 md:w-16"
          style={estiloCarrito}
          onClick={() => setCarritoAbierto(true)}
          aria-label={`Abrir carrito, ${cantidadCarrito} productos`}
        >
          <span aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 6h18" strokeLinecap="round" />
              <path d="M16 10a4 4 0 0 1-8 0" strokeLinecap="round" />
            </svg>
          </span>
          {cantidadCarrito > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-6 items-center justify-center rounded-full border-2 border-white bg-[#e53e3e] px-1.5 text-[12.5px] font-bold text-white">
              {cantidadCarrito}
            </span>
          )}
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