import type { Tienda } from '../../types'

const PALETA_DISNEY = ['#ff4a56', '#ffa41f', '#ffe14d', '#3df2c4', '#4fc8ff', '#95a3ff', '#f58bff']

interface PropsLetras {
  nombre: string
}

function LetrasDisney({ nombre }: PropsLetras) {
  return (
    <>
      {Array.from(nombre).map((letra, i) => (
        <span
          key={i}
          className="inline-block uppercase"
          style={{
            color: PALETA_DISNEY[i % PALETA_DISNEY.length],
            transform: `rotate(${((i * 47) % 9) - 4}deg) translateY(${(((i + 1) * 31) % 5) - 2}px)`,
            WebkitTextStroke: '2px #23263a',
            textShadow:
              '3px 0 0 #23263a, -3px 0 0 #23263a, 0 3px 0 #23263a, 0 -3px 0 #23263a, 2px 2px 0 #23263a, -2px 2px 0 #23263a, 2px -2px 0 #23263a, -2px -2px 0 #23263a, 0 4px 0 #2a2e45, 0 6px 0 #1e2233, 0 0 18px rgba(255,255,255,0.65), 0 0 42px rgba(255,255,255,0.3), 0 8px 14px rgba(0,0,0,0.35)',
          }}
        >
          {letra}
        </span>
      ))}
    </>
  )
}

interface PropsNombreTienda {
  tienda: Tienda
  className?: string
}

function NombreTienda({ tienda, className }: PropsNombreTienda) {
  const [primerPalabra, ...resto] = tienda.nombre.split(' ')

  if (tienda.slug === 'mood-teens') {
    return (
      <span className={`inline-flex flex-wrap items-baseline gap-[0.22em] leading-[1.05] ${className ?? ''}`}>
        <span
          className="font-[var(--font-anton)] font-normal uppercase tracking-[0.06em] text-white"
          style={{
            WebkitTextStroke: '0.05em #000',
            paintOrder: 'stroke fill',
            textShadow:
              '0.04em 0 0 #000, -0.04em 0 0 #000, 0 0.04em 0 #000, 0 -0.04em 0 #000, 0 0.06em 0.03em rgba(0,0,0,0.35)',
          }}
        >
          {primerPalabra}
        </span>
        {resto.length > 0 && (
          <span className="font-[var(--font-barlow)] font-semibold uppercase tracking-[0.05em] text-black">
            {resto.join(' ')}
          </span>
        )}
      </span>
    )
  }

  return (
    <span
      className={`inline-block font-[var(--font-boogaloo)] font-normal leading-[1.15] uppercase tracking-[0.02em] ${className ?? ''}`}
    >
      <LetrasDisney nombre={tienda.nombre} />
    </span>
  )
}

export default NombreTienda