import { Component, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * Captura erros de renderização React e exibe um fallback amigável.
 * Envolve rotas no App.tsx para evitar tela branca.
 * Includes auto-recovery and error count tracking.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error.message, info.componentStack);
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }));
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    // Clear state before navigating to prevent error loops
    this.setState({ hasError: false, error: null, errorCount: 0 });
    window.location.href = "/";
  };

  handleHardRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isRepeated = this.state.errorCount > 2;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-mono font-bold tracking-wider text-foreground mb-2">
              ALGO DEU ERRADO
            </h1>
            <p className="text-sm text-muted-foreground mb-1">
              Encontramos um erro inesperado nesta página.
            </p>
            <p className="text-xs text-muted-foreground/60 font-mono mb-6 break-all max-h-20 overflow-hidden">
              {this.state.error?.message || "Erro desconhecido"}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {!isRepeated && (
                <Button variant="outline" onClick={this.handleRetry} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Tentar novamente
                </Button>
              )}
              {isRepeated && (
                <Button variant="outline" onClick={this.handleHardRefresh} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Recarregar página
                </Button>
              )}
              <Button onClick={this.handleGoHome} className="gap-2">
                <Home className="w-4 h-4" />
                Início
              </Button>
            </div>
            {isRepeated && (
              <p className="text-[10px] text-muted-foreground/50 mt-4 font-mono">
                Erro persistente detectado. Tente recarregar a página ou voltar ao início.
              </p>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
