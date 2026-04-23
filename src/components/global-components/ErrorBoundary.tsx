import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grow flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none text-center space-y-8 animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-3xl flex items-center justify-center text-rose-500 animate-pulse">
              <AlertTriangle size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Oops! Gravity Failed
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Something went wrong while rendering this page. Our engineers (and the laws of physics) have been notified.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-left border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Error Details</p>
                <code className="text-xs font-mono text-rose-500 break-words line-clamp-3">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button 
                onClick={this.handleReload}
                className="h-14 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg active:scale-95"
              >
                <RefreshCcw size={16} className="mr-2" />
                Reload
              </Button>
              <Button 
                onClick={this.handleReset}
                variant="outline"
                className="h-14 border-slate-200 dark:border-slate-800 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                <Home size={16} className="mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
