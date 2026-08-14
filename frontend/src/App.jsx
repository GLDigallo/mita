import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import useTiempo from './hooks/useTiempo'
import HomePage from './pages/HomePage/HomePage'
import TiendaPage from './pages/TiendaPage/TiendaPage'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage'

const GestionPage = lazy(() => import('./pages/GestionPage/GestionPage'))

function App() {
  useTiempo()
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tienda/:slug" element={<TiendaPage />} />
        <Route path="/tienda" element={<Navigate to="/" replace />} />
        <Route path="/home/*" element={<GestionPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export default App
