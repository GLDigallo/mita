import { Link } from 'react-router-dom'
import Hero from '../../components/Hero/Hero'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import StoreCard from '../../components/StoreCard/StoreCard'
import ProductCard from '../../components/ProductCard/ProductCard'
import SkeletonCard from '../../components/SkeletonCard/SkeletonCard'
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage'
import { useFetch } from '../../hooks/useFetch'
import useSeo from '../../hooks/useSeo'
import { fetchDestacados, fetchTiendas } from '../../services/api'
import styles from './HomePage.module.css'

function HomePage() {
  const tiendas = useFetch(fetchTiendas, [])
  const destacados = useFetch(fetchDestacados, [])

  useSeo({
    titulo: 'AgrandaditosTienda · Tiendas de moda para chicos',
    descripcion:
      'Las tiendas de moda para bebés, niños, niñas y adolescentes en Corrientes Capital. Entrá a la tienda de la edad de tu pibe: Mokositos, Agrandaditos y Mood Teens.',
    canonical: 'https://agrandaditostiendas.onrender.com/',
  })

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
            <div className={styles.cabeceraDestacados}>
              <div>
                <p className={styles.etiqueta}>Los favoritos</p>
                <h2 className={styles.titulo}>Destacados del grupo</h2>
              </div>
              <a href="#tiendas" className={styles.verTodos}>
                Ver las tiendas →
              </a>
            </div>
            {destacados.isLoading && (
              <div className={styles.destacadosGrid}>
                {Array.from({ length: 8 }).map((_, indice) => (
                  <SkeletonCard key={indice} />
                ))}
              </div>
            )}
            {destacados.error && <ErrorMessage message={destacados.error} />}
            {destacados.data && (
              <div className={styles.destacadosGrid}>
                {destacados.data.slice(0, 8).map((producto) => (
                  <Link
                    key={producto.id}
                    to={`/tienda/${producto.tiendaSlug}`}
                    className={styles.tarjetaEnlace}
                  >
                    <ProductCard producto={producto} onSeleccionar={() => {}} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer tiendas={tiendas.data ?? []} />
    </>
  )
}

export default HomePage
