import { useCallback, useRef, useState } from 'react'
import type { TipoToast, ToastItem } from '../components/Toast/Toast'

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const contador = useRef(0)

  const quitar = useCallback((id: number) => {
    setToasts((actuales) => actuales.filter((t) => t.id !== id))
  }, [])

  const mostrar = useCallback((tipo: TipoToast, mensaje: string) => {
    const id = ++contador.current
    setToasts((actuales) => [...actuales, { id, tipo, mensaje }])
  }, [])

  return { toasts, mostrar, quitar }
}