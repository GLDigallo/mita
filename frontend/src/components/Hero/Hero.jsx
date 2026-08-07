import styles from './Hero.module.css'

function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.contenido}>
        <p className={styles.bajada}>Grupo de tiendas · Corrientes Capital</p>
        <h1 className={styles.titulo}>
          Una tienda para <span className={styles.resaltado}>cada etapa</span> de tu pibe
        </h1>
        <p className={styles.subtitulo}>
          Desde los primeros días hasta la adolescencia: 4 tiendas con nombre propio y moda pensada
          para cada edad. Elegí la tuya y entrá directo.
        </p>
        <a href="#tiendas" className={styles.cta}>
          Elegí tu tienda
        </a>
      </div>
    </section>
  )
}

export default Hero
