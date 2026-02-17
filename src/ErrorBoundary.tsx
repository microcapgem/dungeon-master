import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          color: '#e8e6f0',
          background: '#0d0d1a',
          minHeight: '100vh',
          fontFamily: 'monospace',
        }}>
          <h1 style={{ color: '#e74c3c', marginBottom: '16px' }}>Something went wrong</h1>
          <p style={{ color: '#a0a0c0', marginBottom: '16px' }}>
            The app crashed. Try clearing your saved data:
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{
              background: '#9b6dff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              marginBottom: '20px',
            }}
          >
            Clear Data & Reload
          </button>
          <pre style={{
            background: '#1a1a35',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto',
            color: '#e74c3c',
            fontSize: '0.85rem',
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
