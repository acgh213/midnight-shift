import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Midnight Shift crashed:', error);
    console.error('Component stack:', info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh bg-asphalt text-gray-200 font-mono flex items-center justify-center p-4">
          <div className="bg-midnight border border-red-500/30 rounded p-6 max-w-md text-center">
            <h1 className="text-xl text-neon-pink mb-2">Something broke</h1>
            <p className="text-xs text-red-400 mb-3 font-mono break-all">
              {this.state.error.message}
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('midnight-shift-save');
                window.location.reload();
              }}
              className="px-4 py-2 bg-neon-pink text-black rounded text-sm"
            >
              Clear Save & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
