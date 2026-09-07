import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import EmptyState from '../../components/EmptyState/EmptyState'
import { useFetch } from '../../hooks/useFetch'
import useSeo from '../../hooks/useSeo'
import { fetchTiendas } from '../../services/api'

function NotFoundPage() {
  const tiendas = useFetch(fetchTiendas, [])

  useSeo({
    titulo: 'Página no encontrada · AgrandaditosTienda',
    descripcion: 'La página que buscás no existe o fue movida. Volvé al inicio y elegí una tienda.',
    noIndex: true,
  })

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1200px] px-5 py-20 pb-10">
        <EmptyState
          titulo="Esta página no existe"
          texto="La dirección no es válida o la tienda fue movida. Volvé al inicio y elegí una tienda."
          accion="Ir al inicio"
        />
        {tiendas.data && (
          <nav className="mt-7 flex flex-wrap justify-center gap-3" aria-label="Tiendas disponibles">
            {tiendas.data.map((tienda) => (
              <Link
                key={tienda.id}
                to={`/tienda/${tienda.slug}`}
                className="rounded-full border border-[var(--color-borde)] bg-[var(--color-superficie)] px-[18px] py-2.5 text-[14px] font-semibold text-[var(--color-texto-suave)] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:border-[var(--color-texto)] hover:text-[var(--color-texto)]"
              >
                {tienda.nombre}
              </Link>
            ))}
          </nav>
        )}
      </main>
      <Footer tiendas={tiendas.data ?? []} />
    </>
  )
}

export default NotFoundPage