import styles from './CategoryFilter.module.css'

function CategoryFilter({ categorias, seleccionada, onSeleccionar, colorPrimario }) {
  return (
    <div className={styles.filtro} role="group" aria-label="Filtrar por categoría">
      <button
        type="button"
        className={`${styles.chip} ${seleccionada === '' ? styles.activo : ''}`}
        style={seleccionada === '' ? { '--chip-color': colorPrimario } : undefined}
        onClick={() => onSeleccionar('')}
        aria-pressed={seleccionada === ''}
      >
        Todo
      </button>
      {categorias.map((categoria) => {
        const activa = seleccionada === categoria.slug
        return (
          <button
            key={categoria.id}
            type="button"
            className={`${styles.chip} ${activa ? styles.activo : ''}`}
            style={activa ? { '--chip-color': colorPrimario } : undefined}
            onClick={() => onSeleccionar(categoria.slug)}
            aria-pressed={activa}
          >
            {categoria.nombre}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryFilter
