import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("FundBridge Runtime Error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('fundbridge_user');
    localStorage.removeItem('fundbridge_token');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0A0A0C',
          color: '#FFFFFF',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '550px',
            width: '100%'
          }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#2A82E4' }}>FundBridge Application Notice</h2>
            <p style={{ color: '#94A3B8', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              An unexpected error occurred while loading the application view.
            </p>
            {this.state.error?.message && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#F87171',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
                fontFamily: 'monospace',
                textAlign: 'left',
                wordBreak: 'break-word'
              }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#2A82E4',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  backgroundColor: 'transparent',
                  color: '#94A3B8',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Clear Cache & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

