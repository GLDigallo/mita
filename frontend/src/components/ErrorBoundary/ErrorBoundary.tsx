import { Component, type ReactNode } from 'react'

interface PropsErrorBoundary {
  children: ReactNode
  onCerrar?: () => void
}

interface StateErrorBoundary {
  error: Error | null
}

export default class ErrorBoundary extends Component<PropsErrorBoundary, StateErrorBoundary> {
  state: StateErrorBoundary = { error: null }

  static getDerivedStateFromError(error: Error): StateErrorBoundary {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-[rgba(15,15,25,0.6)] backdrop-blur-[6px]"
        >
          <div
            className="w-[90%] max-w-[420px] rounded-[16px] bg-white p-8 text-center"
          >
            <p className="mb-2 text-[17px] font-bold">Algo salió mal</p>
            <p className="mb-5 text-[14px] text-[#666]">{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ error: null })
                this.props.onCerrar?.()
              }}
              className="cursor-pointer rounded-lg border-0 bg-[var(--color-marca,#4f46e5)] px-6 py-2.5 text-[14px] font-semibold text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}