import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const brillo = 'animate-brillar bg-[linear-gradient(100deg,#eeece6_40%,#f7f5f0_50%,#eeece6_60%)] bg-[length:200%_100%]'

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
        <section className="scroll-mt-[72px] py-12 md:py-16 lg:py-20" id="tiendas">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-5 md:px-6">
            <p className="mb-2.5 inline-block text-[12.5px] font-bold uppercase tracking-[0.1em] text-[var(--color-marca)]">
              Tiendas AgrandaditosTienda
            </p>
            <h2 className="mb-2.5 text-[clamp(26px,7vw,44px)] tracking-[-0.02em]">
              Elegí la tienda de tu pibe
            </h2>
            <p className="mb-8 max-w-[620px] text-[15.5px] leading-[1.6] text-[var(--color-texto-suave)] md:text-[17px]">
              Cuatro tiendas, cada una con su nombre y su catálogo. Entrá a la que va con su edad.
            </p>
            {tiendas.isLoading && (
              <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, indice) => (
                  <div key={indice} className={`${brillo} aspect-[3/4] rounded-[var(--radius-lg)]`} />
                ))}
              </div>
            )}
            {tiendas.error && <ErrorMessage message={tiendas.error} />}
            {tiendas.data && (
              <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
                {tiendas.data.map((tienda) => (
                  <StoreCard key={tienda.id} tienda={tienda} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-5 md:px-6">
            <div className="mb-6 flex border-b-2 border-[var(--color-borde)]">
              <button
                className={`-mb-0.5 border-b-2 px-5 py-2.5 text-[15px] font-semibold transition-colors duration-200 ${
                  pestana === 'novedades'
                    ? 'border-[var(--color-marca)] text-[var(--color-marca)]'
                    : 'border-transparent text-[var(--color-texto-suave)] hover:text-[var(--color-texto)]'
                }`}
                onClick={() => setPestana('novedades')}
              >
                Lo último
              </button>
              {hayDestacados && (
                <button
                  className={`-mb-0.5 border-b-2 px-5 py-2.5 text-[15px] font-semibold transition-colors duration-200 ${
                    pestana === 'destacados'
                      ? 'border-[var(--color-marca)] text-[var(--color-marca)]'
                      : 'border-transparent text-[var(--color-texto-suave)] hover:text-[var(--color-texto)]'
                  }`}
                  onClick={() => setPestana('destacados')}
                >
                  Destacados
                </button>
              )}
            </div>

            {productosAMostrar.isLoading && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                {Array.from({ length: 12 }).map((_, indice) => (
                  <SkeletonCard key={indice} />
                ))}
              </div>
            )}
            {productosAMostrar.error && <ErrorMessage message={productosAMostrar.error} />}
            {productosAMostrar.data && (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
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

        <section className="py-12 md:py-16 lg:py-20">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-5 md:px-6">
            <div className="grid gap-4 md:gap-6 lg:grid-cols-2 lg:gap-10">
              <div>
                <p className="mb-2.5 inline-block text-[12.5px] font-bold uppercase tracking-[0.1em] text-[var(--color-marca)]">
                  Sobre nosotros
                </p>
                <h2 className="mb-2.5 text-[clamp(26px,7vw,44px)] tracking-[-0.02em]">
                  AgrandaditosTienda en Corrientes
                </h2>
              </div>
              <div className="grid max-w-[680px] gap-3.5 text-[15.5px] leading-[1.75]">
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