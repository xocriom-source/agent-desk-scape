import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Crown, Rocket, Building2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, PLAN_DETAILS } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLANS = [
  {
    id: "explorer",
    name: "Explorer",
    price: "$0",
    period: "/mês",
    description: "Para explorar a plataforma",
    icon: Building2,
    color: "from-muted to-muted/50",
    features: PLAN_DETAILS.explorer.features,
    cta: "Plano Atual",
    priceId: PLAN_DETAILS.explorer.priceId,
    isFree: true,
  },
  {
    id: "business",
    name: "Business",
    price: "$49",
    period: "/mês",
    description: "Para empreendedores ativos",
    icon: Zap,
    color: "from-primary to-primary/70",
    popular: true,
    features: PLAN_DETAILS.business.features,
    cta: "Assinar Business",
    priceId: PLAN_DETAILS.business.priceId,
  },
  {
    id: "mogul",
    name: "Mogul",
    price: "$199",
    period: "/mês",
    description: "Para líderes e investidores",
    icon: Crown,
    color: "from-amber-500 to-amber-600",
    features: PLAN_DETAILS.mogul.features,
    cta: "Assinar Mogul",
    priceId: PLAN_DETAILS.mogul.priceId,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { planId, loading: subLoading } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (plan.isFree || plan.id === planId) return;

    setLoading(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          mode: "subscription",
          price_id: plan.priceId,
          plan: plan.id,
          success_url: `${window.location.origin}/lobby?payment=success&plan=${plan.id}`,
          cancel_url: `${window.location.origin}/pricing?cancelled=true`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Erro ao iniciar checkout", { description: err.message });
    } finally {
      setLoading(null);
    }
  };

  const isCurrentPlan = (id: string) => id === planId;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-display font-bold text-xl text-foreground">Planos & Preços</h1>
          {!subLoading && planId && (
            <Badge variant="outline" className="ml-auto">
              Plano atual: {PLANS.find(p => p.id === planId)?.name || "Explorer"}
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          Escale seu negócio digital
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Escolha o plano ideal para sua jornada na cidade digital.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const current = isCurrentPlan(plan.id);
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border ${current ? "border-primary ring-2 ring-primary/20" : plan.popular ? "border-primary shadow-lg shadow-primary/10" : "border-border/50"} bg-card p-6 flex flex-col`}
            >
              {current && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white">
                  ✓ Seu Plano
                </Badge>
              )}
              {!current && plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Mais Popular
                </Badge>
              )}

              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              <h3 className="font-display font-bold text-lg text-foreground">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-3xl font-display font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={current ? "outline" : plan.popular ? "default" : "outline"}
                disabled={current || plan.isFree || loading === plan.id}
                onClick={() => handleSubscribe(plan)}
              >
                {loading === plan.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processando...</>
                ) : current ? "✓ Plano Atual" : plan.cta}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
