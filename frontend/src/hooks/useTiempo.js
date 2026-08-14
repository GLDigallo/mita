import { useEffect, useState } from 'react'

function faseAproximada() {
  const hora = new Date().getHours()
  if (hora < 7 || hora >= 19) return 'noche'
  if (hora < 13) return 'manana'
  return 'tarde'
}

function parametros() {
  return new URLSearchParams(window.location.search)
}

function useTiempo() {
  const [fase, setFase] = useState(
    () => parametros().get('tiempo') ?? faseAproximada(),
  )
  const [lluvia, setLluvia] = useState(() => parametros().get('clima') === 'lluvia')

  useEffect(() => {
    const forzada = parametros().get('tiempo')
    const climaForzado = parametros().get('clima')
    if (forzada) {
      setFase(forzada)
      return
    }
    if (climaForzado) {
      setLluvia(climaForzado === 'lluvia')
      return
    }
    let activo = true
    async function cargar() {
      try {
        const respuesta = await fetch('/api/clima')
        if (!respuesta.ok) return
        const datos = await respuesta.json()
        if (!activo) return
        setFase(datos.fase)
        setLluvia(Boolean(datos.esLluvia))
      } catch {
        /* si falla la api, queda el tema por hora local */
      }
    }
    cargar()
    const intervalo = setInterval(cargar, 15 * 60 * 1000)
    return () => {
      activo = false
      clearInterval(intervalo)
    }
  }, [])

  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-tiempo', fase)
    if (lluvia) html.setAttribute('data-clima', 'lluvia')
    else html.removeAttribute('data-clima')
  }, [fase, lluvia])

  return { fase, lluvia }
}

export default useTiempo
