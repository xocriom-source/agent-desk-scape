import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Loading State ──────────────────────────────────────────────────────────
interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({ message = "Carregando...", size = "md" }: LoadingStateProps) {
  const spinnerSize = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" }[size];
  const textSize = { sm: "text-[9px]", md: "text-[10px]", lg: "text-xs" }[size];

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3" role="status" aria-live="polite">
      <div className={`${spinnerSize} border-2 border-primary/30 border-t-primary rounded-full animate-spin`} />
      <p className={`${textSize} font-mono tracking-wider text-muted-foreground`}>{message.toUpperCase()}</p>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────
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
      role="status"
    >
      {icon ? (
        <div className="text-muted-foreground/40">{icon}</div>
      ) : (
        <Inbox className="w-10 h-10 text-muted-foreground/30" />
      )}
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}

// ─── Error State ────────────────────────────────────────────────────────────
interface ErrorStateProps {
  message?: string;
  description?: string;
  onRetry?: () => void;
  fatal?: boolean;
}

export function ErrorState({
  message = "Algo deu errado",
  description,
  onRetry,
  fatal = false,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-8 gap-3 text-center"
      role="alert"
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${fatal ? "bg-destructive/20" : "bg-destructive/10"}`}>
        <AlertTriangle className={`w-6 h-6 ${fatal ? "text-destructive" : "text-destructive/80"}`} />
      </div>
      <p className="text-sm text-foreground font-medium">{message}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
      )}
      {onRetry && !fatal && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-1 gap-2 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tentar novamente
        </Button>
      )}
      {fatal && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="mt-1 gap-2 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Recarregar página
        </Button>
      )}
    </motion.div>
  );
}

// ─── Page Skeleton ──────────────────────────────────────────────────────────
interface PageSkeletonProps {
  rows?: number;
  variant?: "list" | "grid" | "cards";
}

export function PageSkeleton({ rows = 5, variant = "list" }: PageSkeletonProps) {
  if (variant === "cards") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 p-4 space-y-3">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
