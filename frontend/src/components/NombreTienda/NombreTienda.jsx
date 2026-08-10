import styles from './NombreTienda.module.css'

function NombreTienda({ tienda, className }) {
  const [primerPalabra, ...resto] = tienda.nombre.split(' ')

  if (tienda.slug === 'mood-teens') {
    return (
      <span className={`${styles.moodTeens} ${className ?? ''}`}>
        <span className={styles.mood}>{primerPalabra}</span>
        {resto.length > 0 && <span className={styles.teens}>{resto.join(' ')}</span>}
      </span>
    )
  }

  return <span className={`${styles.disney} ${className ?? ''}`}>{tienda.nombre}</span>
}

export default NombreTienda
