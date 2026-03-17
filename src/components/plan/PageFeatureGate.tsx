import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight, ArrowLeft } from "lucide-react";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { PLAN_DETAILS } from "@/hooks/useSubscription";
import { motion } from "framer-motion";

interface Props {
  feature: string;
  children: ReactNode;
}

/**
 * Full-page gate that blocks access to an entire route if the user's plan is insufficient.
 */
export function PageFeatureGate({ feature, children }: Props) {
  const { allowed, requiredPlan, loading } = useFeatureGate(feature);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (allowed) return <>{children}</>;

  const planInfo = PLAN_DETAILS[requiredPlan as keyof typeof PLAN_DETAILS];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Recurso Premium
        </h1>
        <p className="text-muted-foreground mb-6">
          Este recurso requer o plano <span className="font-semibold text-primary">{planInfo?.name || requiredPlan}</span> ou superior.
          Faça upgrade para desbloquear.
        </p>

        {planInfo && (
          <div className="bg-card border border-border rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-foreground">{planInfo.name}</span>
              <span className="text-primary font-bold">{planInfo.price}/mês</span>
            </div>
            <ul className="space-y-1">
              {planInfo.features.slice(0, 4).map((f, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="text-primary">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <button
            onClick={() => navigate("/pricing")}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Ver planos <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
