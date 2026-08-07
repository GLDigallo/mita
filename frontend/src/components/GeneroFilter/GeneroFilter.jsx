import styles from './GeneroFilter.module.css'

const GENERO_ETIQUETAS = {
  NINO: 'Niños',
  NINA: 'Niñas',
  UNISEX: 'Unisex',
}

function GeneroFilter({ generos, seleccionado, onSeleccionar, colorPrimario }) {
  return (
    <div className={styles.filtro} role="group" aria-label="Filtrar por género">
      <button
        type="button"
        className={`${styles.chip} ${seleccionado === '' ? styles.activo : ''}`}
        style={seleccionado === '' ? { '--chip-color': colorPrimario } : undefined}
        onClick={() => onSeleccionar('')}
        aria-pressed={seleccionado === ''}
      >
        Todos
      </button>
      {generos.map((genero) => {
        const activo = seleccionado === genero
        return (
          <button
            key={genero}
            type="button"
            className={`${styles.chip} ${activo ? styles.activo : ''}`}
            style={activo ? { '--chip-color': colorPrimario } : undefined}
            onClick={() => onSeleccionar(genero)}
            aria-pressed={activo}
          >
            {GENERO_ETIQUETAS[genero] ?? genero}
          </button>
        )
      })}
    </div>
  )
}

export default GeneroFilter
