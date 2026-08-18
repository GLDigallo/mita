import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15,15,25,0.6)',
          backdropFilter: 'blur(6px)',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: '32px 24px',
            maxWidth: 420,
            width: '90%',
            textAlign: 'center',
          }}>
            <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Algo salió mal</p>
            <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>{this.state.error.message}</p>
            <button
              type="button"
              onClick={() => { this.setState({ error: null }); this.props.onCerrar?.() }}
              style={{
                background: 'var(--color-marca, #4f46e5)',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
              }}
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
