import { useState } from 'react'
import styles from './LoginForm.module.css'

function LoginForm({ onLogin }) {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function manejarEnvio(evento) {
    evento.preventDefault()
    if (!usuario.trim() || !clave || enviando) return
    setEnviando(true)
    setError('')
    try {
      await onLogin(usuario.trim(), clave)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className={styles.formulario} onSubmit={manejarEnvio}>
      <p className={styles.etiqueta}>Acceso del local</p>
      <h1 className={styles.titulo}>Gestión de consultas</h1>
      <p className={styles.subtitulo}>Ingresá para ver y actualizar las consultas de WhatsApp.</p>

      <div className={styles.grupo}>
        <label className={styles.label} htmlFor="gestion-usuario">
          Usuario
        </label>
        <input
          id="gestion-usuario"
          className={styles.input}
          type="text"
          value={usuario}
          onChange={(evento) => setUsuario(evento.target.value)}
          autoComplete="username"
          autoFocus
        />
      </div>

      <div className={styles.grupo}>
        <label className={styles.label} htmlFor="gestion-clave">
          Contraseña
        </label>
        <input
          id="gestion-clave"
          className={styles.input}
          type="password"
          value={clave}
          onChange={(evento) => setClave(evento.target.value)}
          autoComplete="current-password"
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.boton} disabled={enviando}>
        {enviando ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  )
}

export default LoginForm
