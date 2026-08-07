import styles from './ErrorMessage.module.css'

function ErrorMessage({ message }) {
  return (
    <div className={styles.error} role="alert">
      <p className={styles.titulo}>Ups, algo salió mal</p>
      <p className={styles.mensaje}>{message}</p>
      <button type="button" className={styles.boton} onClick={() => window.location.reload()}>
        Reintentar
      </button>
    </div>
  )
}

export default ErrorMessage
