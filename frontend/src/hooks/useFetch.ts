import { useEffect, useState, type DependencyList } from 'react'

interface EstadoFetch<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

export function useFetch<T>(fetcher: () => Promise<T>, deps: DependencyList = []): EstadoFetch<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setIsLoading(true)
    setError(null)

    fetcher()
      .then((resultado) => {
        if (!cancelado) setData(resultado)
      })
      .catch((err: Error) => {
        if (!cancelado) setError(err.message)
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false)
      })

    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, isLoading, error }
}