import styles from './NombreTienda.module.css'

const PALETA_DISNEY = ['#ff5a5f', '#ff9f1c', '#ffd23f', '#2ee6a8', '#38bdf8', '#818cf8', '#e879f9']

function LetrasDisney({ nombre }) {
  return Array.from(nombre).map((letra, i) => (
    <span
      key={i}
      className={styles.letra}
      style={{
        color: PALETA_DISNEY[i % PALETA_DISNEY.length],
        ['--rot']: `${((i * 47) % 9) - 4}deg`,
        ['--desplazamiento']: `${(((i + 1) * 31) % 5) - 2}px`,
      }}
    >
      {letra}
    </span>
  ))
}

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

  return (
    <span className={`${styles.disney} ${className ?? ''}`}>
      <LetrasDisney nombre={tienda.nombre} />
    </span>
  )
}

export default NombreTienda
