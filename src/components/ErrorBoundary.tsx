import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { DEVELOPER_CONTACT } from '@/lib/constants';

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
        <div className="h-screen bg-navy-deep flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={28} className="text-error" />
            </div>
            <h1 className="font-serif text-2xl text-cream mb-3">Something Went Wrong</h1>
            <p className="text-cream/70 text-sm mb-4">{DEVELOPER_CONTACT.message}</p>
            <p className="text-gold text-sm font-medium mb-6">{DEVELOPER_CONTACT.action}</p>
            {this.state.error && (
              <details className="text-left">
                <summary className="text-xs text-gray-muted cursor-pointer hover:text-cream mb-2">
                  Technical Details
                </summary>
                <pre className="text-xs text-error/70 bg-navy-light rounded-lg p-3 overflow-x-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 rounded-lg bg-gold/15 text-gold border border-gold/20
                hover:bg-gold/25 text-sm font-medium transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
