export function textoConContraste(hexColor?: string): string {
  if (!hexColor) return 'text-white'
  const m = hexColor.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16)
  const g = parseInt(m.slice(2, 4), 16)
  const b = parseInt(m.slice(4, 6), 16)
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminancia > 0.62 ? 'text-black' : 'text-white'
}