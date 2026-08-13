import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import CategoryFilter from '../../components/CategoryFilter/CategoryFilter'
import GeneroFilter from '../../components/GeneroFilter/GeneroFilter'
import ProductGrid from '../../components/ProductGrid/ProductGrid'
import ProductModal from '../../components/ProductModal/ProductModal'
import SkeletonCard from '../../components/SkeletonCard/SkeletonCard'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import NombreTienda from '../../components/NombreTienda/NombreTienda'
import { useFetch } from '../../hooks/useFetch'
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
  const [categoria, setCategoria] = useState('destacados')
  const [genero, setGenero] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
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

  useEffect(() => {
    setCategoria('destacados')
    setGenero('')
    setProductoSeleccionado(null)
    window.scrollTo(0, 0)
  }, [slug])

  const productosVisibles = categoria === 'destacados'
    ? (productos.data ?? []).filter((p) => p.destacado)
    : (productos.data ?? [])

  if (tienda.isLoading) {
    return (
      <>
        <Header />
        <div className={styles.skeletonHero} />
      </>
    )
  }

  if (tienda.error || !tienda.data) {
    return (
      <>
        <Header />
        <main className={styles.contenido}>
          <ErrorMessage message={tienda.error ?? 'Tienda no encontrada'} />
        </main>
        <Footer tiendas={tiendas.data ?? []} />
      </>
    )
  }

  const tiendaActual = tienda.data

  return (
    <>
      <Header />
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
            {!categorias.isLoading && !categorias.error && categorias.data && (
              <p className={styles.contador}>
                {productos.isLoading
                  ? 'Cargando…'
                  : `${productosVisibles.length} prenda${productosVisibles.length === 1 ? '' : 's'}`}
              </p>
            )}
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
      <Footer tiendas={tiendas.data ?? []} />

      {productoSeleccionado && (
        <ProductModal
          producto={productoSeleccionado}
          tienda={tiendaActual}
          onCerrar={() => setProductoSeleccionado(null)}
        />
      )}
    </>
  )
}

export default TiendaPage
