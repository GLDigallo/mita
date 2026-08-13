import { useEffect } from 'react'

function fijarMeta(nombre, contenido) {
  let meta = document.querySelector(`meta[name="${nombre}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', nombre)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', contenido)
}

function fijarCanonical(href) {
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

function useSeo({ titulo, descripcion, canonical }) {
  useEffect(() => {
    if (titulo) document.title = titulo
    if (descripcion) fijarMeta('description', descripcion)
    if (canonical) fijarCanonical(canonical)
  }, [titulo, descripcion, canonical])
}

export default useSeo
