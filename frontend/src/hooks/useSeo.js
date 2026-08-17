import { useEffect } from 'react'

const OG_IMAGE_DEFAULT = 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1200&h=630&fit=crop&q=70'

function fijarMeta(nombre, contenido, esProperty = false) {
  const attr = esProperty ? 'property' : 'name'
  let meta = document.querySelector(`meta[${attr}="${nombre}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attr, nombre)
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

function fijarJsonLd(datos) {
  let script = document.querySelector('script[type="application/ld+json"]')
  if (!script) {
    script = document.createElement('script')
    script.setAttribute('type', 'application/ld+json')
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(datos)
}

function useSeo({ titulo, descripcion, canonical, ogImage, jsonLd, noIndex = false }) {
  useEffect(() => {
    if (titulo) document.title = titulo
    if (descripcion) {
      fijarMeta('description', descripcion)
      fijarMeta('og:title', titulo, true)
      fijarMeta('og:description', descripcion, true)
    }
    if (canonical) {
      fijarCanonical(canonical)
      fijarMeta('og:url', canonical, true)
    }
    if (ogImage) {
      fijarMeta('og:image', ogImage, true)
      fijarMeta('twitter:image', ogImage)
    } else {
      fijarMeta('og:image', OG_IMAGE_DEFAULT, true)
      fijarMeta('twitter:image', OG_IMAGE_DEFAULT)
    }
    if (titulo) {
      fijarMeta('twitter:title', titulo)
      fijarMeta('twitter:description', descripcion || '')
    }
    if (noIndex) {
      fijarMeta('robots', 'noindex, nofollow')
    } else {
      fijarMeta('robots', 'index, follow')
    }
    if (jsonLd) fijarJsonLd(jsonLd)
  }, [titulo, descripcion, canonical, ogImage, jsonLd, noIndex])
}

export default useSeo
