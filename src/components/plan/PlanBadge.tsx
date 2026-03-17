import { Crown, Zap, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

const PLAN_CONFIG: Record<string, { icon: typeof Crown; label: string; className: string }> = {
  explorer: { icon: Building2, label: "Explorer", className: "bg-muted text-muted-foreground" },
  business: { icon: Zap, label: "Business", className: "bg-primary/10 text-primary border-primary/20" },
  mogul: { icon: Crown, label: "Mogul", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
};

export function PlanBadge({ showUpgrade = true }: { showUpgrade?: boolean }) {
  const { planId, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) return null;

  const config = PLAN_CONFIG[planId] || PLAN_CONFIG.explorer;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`${config.className} cursor-pointer`} onClick={() => navigate("/pricing")}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
      {showUpgrade && planId === "explorer" && (
        <button
          onClick={() => navigate("/pricing")}
          className="text-[10px] text-primary hover:underline font-medium"
        >
          Upgrade
        </button>
      )}
    </div>
  );
}
