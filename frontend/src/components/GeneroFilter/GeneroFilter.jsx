import styles from './GeneroFilter.module.css'

const GENERO_ETIQUETAS = {
  NINO: 'Niños',
  NINA: 'Niñas',
  UNISEX: 'Unisex',
}

function GeneroFilter({ generos, seleccionado, onSeleccionar, colorPrimario, onTodo, todoActivo }) {
  return (
    <div className={styles.filtro} role="group" aria-label="Filtrar por género">
      {onTodo && (
        <button
          type="button"
          className={`${styles.chip} ${todoActivo ? styles.activo : ''}`}
          style={todoActivo ? { '--chip-color': colorPrimario } : undefined}
          onClick={onTodo}
          aria-pressed={todoActivo}
        >
          Todo
        </button>
      )}
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
