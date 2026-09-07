interface PropsErrorMessage {
  message: string
}

function ErrorMessage({ message }: PropsErrorMessage) {
  return (
    <div className="px-5 py-15 text-center" role="alert">
      <p className="mb-2 text-[22px] font-bold">Ups, algo salió mal</p>
      <p className="mb-5 text-[var(--color-texto-suave)]">{message}</p>
      <button
        type="button"
        className="rounded-full border-0 bg-[var(--color-texto)] px-6 py-3 font-semibold text-white transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:opacity-90"
        onClick={() => window.location.reload()}
      >
        Reintentar
      </button>
    </div>
  )
}

export default ErrorMessage