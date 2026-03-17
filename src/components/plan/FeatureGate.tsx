import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { PLAN_DETAILS } from "@/hooks/useSubscription";

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  /** If true, shows locked overlay instead of hiding */
  showLocked?: boolean;
  /** Custom fallback */
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, showLocked = true, fallback }: FeatureGateProps) {
  const { allowed, requiredPlan, loading } = useFeatureGate(feature);
  const navigate = useNavigate();

  if (loading) return null;
  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;
  if (!showLocked) return null;

  const planInfo = PLAN_DETAILS[requiredPlan as keyof typeof PLAN_DETAILS];

  return (
    <div className="relative rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-6 overflow-hidden">
      {/* Blurred content placeholder */}
      <div className="opacity-20 blur-sm pointer-events-none select-none">
        {children}
      </div>
      
      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-[2px]">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            Recurso do plano {planInfo?.name || requiredPlan}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Faça upgrade para desbloquear
          </p>
        </div>
        <button
          onClick={() => navigate("/pricing")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          Ver planos <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
