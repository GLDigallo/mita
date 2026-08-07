import styles from './SkeletonCard.module.css'

function SkeletonCard() {
  return (
    <div className={styles.tarjeta} aria-hidden="true">
      <div className={styles.imagen} />
      <div className={styles.cuerpo}>
        <div className={styles.lineaCorta} />
        <div className={styles.linea} />
        <div className={styles.lineaMedia} />
      </div>
    </div>
  )
}

export default SkeletonCard
