import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Page error:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-danger-500/10 flex items-center justify-center text-danger-400 mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <p className="text-base font-semibold text-ink-100">Something went wrong</p>
          <p className="text-sm text-ink-400 mt-1 max-w-sm">An unexpected error occurred while loading this page. You can try again.</p>
          <button
            onClick={() => { this.handleRetry(); this.props.onRetry?.(); }}
            className="btn-primary mt-5"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
