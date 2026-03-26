import { motion } from "framer-motion";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({ message = "Carregando...", size = "md" }: LoadingStateProps) {
  const spinnerSize = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" }[size];
  const textSize = { sm: "text-[9px]", md: "text-[10px]", lg: "text-xs" }[size];

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div className={`${spinnerSize} border-2 border-primary/30 border-t-primary rounded-full animate-spin`} />
      <p className={`${textSize} font-mono tracking-wider text-muted-foreground`}>{message.toUpperCase()}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 gap-3 text-center"
    >
      {icon && <div className="text-muted-foreground/40">{icon}</div>}
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Algo deu errado", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
        <span className="text-destructive text-lg">!</span>
      </div>
      <p className="text-sm text-foreground font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
