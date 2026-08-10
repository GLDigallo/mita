import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage/HomePage'
import TiendaPage from './pages/TiendaPage/TiendaPage'
import GestionPage from './pages/GestionPage/GestionPage'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/tienda/:slug" element={<TiendaPage />} />
      <Route path="/tienda" element={<Navigate to="/" replace />} />
      <Route path="/home/*" element={<GestionPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
