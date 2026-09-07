import { useState } from 'react'

interface PropsLoginForm {
  onLogin: (usuario: string, clave: string) => Promise<void>
}

const inputBase =
  'w-full min-h-12 rounded-[var(--radius-sm)] border border-[var(--color-borde)] bg-[var(--color-superficie)] p-3 text-[15px] text-[var(--color-texto)] transition-[border-color,box-shadow] duration-200 focus:border-[var(--color-marca)] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] focus:outline-none'

function LoginForm({ onLogin }: PropsLoginForm) {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  async function manejarEnvio(evento: React.FormEvent) {
    evento.preventDefault()
    if (!usuario.trim() || !clave || enviando) return
    setEnviando(true)
    setError('')
    try {
      await onLogin(usuario.trim(), clave)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="mx-auto mt-16 w-full max-w-[400px] rounded-[var(--radius-lg)] bg-[var(--color-superficie)] p-8 shadow-[var(--shadow-md)]" onSubmit={manejarEnvio}>
      <p className="mb-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--color-marca)]">
        Acceso del local
      </p>
      <h1 className="mb-2.5 text-[28px] tracking-[-0.02em]">Gestión de consultas</h1>
      <p className="mb-6 text-[15px] leading-[1.6] text-[var(--color-texto-suave)]">
        Ingresá para ver y actualizar las consultas de WhatsApp.
      </p>

      <div className="mb-[18px]">
        <label className="mb-2 block text-[14px] font-semibold" htmlFor="gestion-usuario">
          Usuario
        </label>
        <input
          id="gestion-usuario"
          className={inputBase}
          type="text"
          value={usuario}
          onChange={(evento) => setUsuario(evento.target.value)}
          autoComplete="username"
          autoFocus
        />
      </div>

      <div className="mb-[18px]">
        <label className="mb-2 block text-[14px] font-semibold" htmlFor="gestion-clave">
          Contraseña
        </label>
        <input
          id="gestion-clave"
          className={inputBase}
          type="password"
          value={clave}
          onChange={(evento) => setClave(evento.target.value)}
          autoComplete="current-password"
        />
      </div>

      {error && <p className="mb-3.5 text-[14px] text-[#c0392b]">{error}</p>}

      <button
        type="submit"
        className="min-h-[52px] w-full rounded-[var(--radius-pill)] border-0 bg-[var(--color-marca)] text-[16px] font-bold text-white transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(79,70,229,0.35)] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={enviando}
      >
        {enviando ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  )
}

export default LoginForm