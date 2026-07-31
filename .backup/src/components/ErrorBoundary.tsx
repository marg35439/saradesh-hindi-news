import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught Error in SaraDesh App:", error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans text-neutral-900">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-black text-neutral-900">
              सारादेश - लोड करने में समस्या आई
            </h1>
            <p className="text-sm text-neutral-600">
              पेज लोड करते समय एक अस्थायी तकनीकी समस्या उत्पन्न हुई। कृपया पेज को रिफ्रेश करें।
            </p>
            {this.state.error && (
              <pre className="text-[10px] bg-neutral-900 text-amber-300 p-3 rounded-lg text-left overflow-x-auto max-h-32 font-mono">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#ff6f00] hover:bg-amber-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-white" />
              <span>पेज रिफ्रेश करें (Reload)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
