import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import Footer from '../../components/Footer/Footer'
import EmptyState from '../../components/EmptyState/EmptyState'
import { useFetch } from '../../hooks/useFetch'
import { fetchTiendas } from '../../services/api'
import styles from './NotFoundPage.module.css'

function NotFoundPage() {
  const tiendas = useFetch(fetchTiendas, [])

  return (
    <>
      <Header />
      <main className={styles.contenido}>
        <EmptyState
          titulo="Esta página no existe"
          texto="La dirección no es válida o la tienda fue movida. Volvé al inicio y elegí una tienda."
          accion="Ir al inicio"
        />
        {tiendas.data && (
          <nav className={styles.enlaces} aria-label="Tiendas disponibles">
            {tiendas.data.map((tienda) => (
              <Link key={tienda.id} to={`/tienda/${tienda.slug}`} className={styles.enlace}>
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
