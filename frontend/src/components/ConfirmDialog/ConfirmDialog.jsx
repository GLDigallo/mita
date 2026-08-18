import { useEffect } from 'react'
import styles from './ConfirmDialog.module.css'

function ConfirmDialog({ titulo, mensaje, textoAccion = 'Confirmar', peligro = false, onConfirmar, onCancelar, cargando = false }) {
  useEffect(() => {
    function manejarEscape(e) {
      if (e.key === 'Escape' && !cargando) onCancelar()
    }
    document.addEventListener('keydown', manejarEscape)
    return () => document.removeEventListener('keydown', manejarEscape)
  }, [onCancelar, cargando])

  return (
    <div className={styles.fondo} onMouseDown={!cargando ? onCancelar : undefined}>
      <div className={styles.dialogo} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className={styles.titulo}>{titulo}</h3>
        <p className={styles.mensaje}>{mensaje}</p>
        <div className={styles.acciones}>
          <button type="button" className={styles.btnCancelar} onClick={onCancelar} disabled={cargando}>
            Cancelar
          </button>
          <button
            type="button"
            className={`${styles.btnConfirmar} ${peligro ? styles.peligro : ''}`}
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? 'Procesando…' : textoAccion}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
