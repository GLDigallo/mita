import Hero from '../../components/Hero/Hero'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import StoreCard from '../../components/StoreCard/StoreCard'
import ProductCard from '../../components/ProductCard/ProductCard'
import SkeletonCard from '../../components/SkeletonCard/SkeletonCard'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import useSeo from '../../hooks/useSeo'
import { fetchDestacados, fetchProductosGlobales, fetchTiendas } from '../../services/api'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './HomePage.module.css'

function HomePage() {
  const tiendas = useFetch(fetchTiendas, [])
  const destacados = useFetch(fetchDestacados, [])
  const productosGlobales = useFetch(fetchProductosGlobales, [])
  const [pestana, setPestana] = useState('novedades')
  const navigate = useNavigate()

  useSeo({
    titulo: 'AgrandaditosTienda · Tiendas de moda para chicos',
    descripcion:
      'Las tiendas de moda para bebés, niños, niñas y adolescentes en Corrientes Capital. Entrá a la tienda de la edad de tu pibe: Mokositos, Agrandaditos y Mood Teens.',
    canonical: 'https://agrandaditostiendas.onrender.com/',
  })

  const productosAMostrar = pestana === 'novedades' ? productosGlobales : destacados
  const hayDestacados = destacados.data && destacados.data.length > 0

  return (
    <>
      <Header />
      <Hero />
      <main>
        <section className={styles.seccion} id="tiendas">
          <div className={styles.contenido}>
            <p className={styles.etiqueta}>Tiendas AgrandaditosTienda</p>
            <h2 className={styles.titulo}>Elegí la tienda de tu pibe</h2>
            <p className={styles.subtitulo}>
              Cuatro tiendas, cada una con su nombre y su catálogo. Entrá a la que va con su edad.
            </p>
            {tiendas.isLoading && (
              <div className={styles.tiendasGrid}>
                {Array.from({ length: 4 }).map((_, indice) => (
                  <div key={indice} className={styles.skeletonTienda} />
                ))}
              </div>
            )}
            {tiendas.error && <ErrorMessage message={tiendas.error} />}
            {tiendas.data && (
              <div className={styles.tiendasGrid}>
                {tiendas.data.map((tienda) => (
                  <StoreCard key={tienda.id} tienda={tienda} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={styles.seccion}>
          <div className={styles.contenido}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${pestana === 'novedades' ? styles.tabActivo : ''}`}
                onClick={() => setPestana('novedades')}
              >
                Lo último
              </button>
              {hayDestacados && (
                <button
                  className={`${styles.tab} ${pestana === 'destacados' ? styles.tabActivo : ''}`}
                  onClick={() => setPestana('destacados')}
                >
                  Destacados
                </button>
              )}
            </div>

            {productosAMostrar.isLoading && (
              <div className={styles.productosGrid}>
                {Array.from({ length: 12 }).map((_, indice) => (
                  <SkeletonCard key={indice} />
                ))}
              </div>
            )}
            {productosAMostrar.error && <ErrorMessage message={productosAMostrar.error} />}
            {productosAMostrar.data && (
              <div className={styles.productosGrid}>
                {productosAMostrar.data.map((producto) => (
                  <ProductCard
                    key={producto.id}
                    producto={producto}
                    onSeleccionar={() => navigate(`/tienda/${producto.tiendaSlug}`)}
                    mostrarTienda
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={styles.seccion}>
          <div className={styles.contenido}>
            <div className={styles.acerca}>
              <div>
                <p className={styles.etiqueta}>Sobre nosotros</p>
                <h2 className={styles.titulo}>AgrandaditosTienda en Corrientes</h2>
              </div>
              <div className={styles.acercaTexto}>
                <p>
                  AgrandaditosTienda es un grupo de tiendas de ropa para chicos en{' '}
                  <strong>Corrientes Capital</strong>. Cuatro tiendas, cada una con su nombre y su
                  propio catálogo según la edad: bebés de 0 a 2 años, niños de 2 a 8, preadolescentes
                  de 8 a 12 y adolescentes de 12 a 16.
                </p>
                <p>
                  En cada tienda vas a encontrar remeras, pantalones, buzos, vestidos y todo lo que
                  tu pibe necesita, en talles para cada edad. Elegí la tienda, mirá el catálogo y
                  consultá la prenda que te guste por WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer tiendas={tiendas.data ?? []} />
    </>
  )
}

export default HomePage
