import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Crown, TrendingUp, Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    description: "Para explorar a plataforma",
    icon: Building2,
    color: "from-muted to-muted/50",
    features: [
      "1 prédio na cidade",
      "Assistente IA básico",
      "Marketplace (visualizar)",
      "Chat da cidade",
    ],
    cta: "Plano Atual",
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 97",
    period: "/mês",
    description: "Para empreendedores ativos",
    icon: Zap,
    color: "from-primary to-primary/70",
    popular: true,
    features: [
      "Prédios ilimitados",
      "Assistente IA avançado",
      "Analytics completo",
      "Marketplace (comprar/vender)",
      "Agentes de IA (5 inclusos)",
      "Destaque de ativos",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
    priceId: "price_pro_monthly",
  },
  {
    id: "investor",
    name: "Investor",
    price: "R$ 297",
    period: "/mês",
    description: "Para investidores e deal-makers",
    icon: TrendingUp,
    color: "from-amber-500 to-amber-600",
    features: [
      "Tudo do Pro",
      "Dados financeiros avançados",
      "Due diligence automatizada",
      "Acesso antecipado a deals",
      "API completa",
      "Agentes IA ilimitados",
      "Dashboard de portfólio",
    ],
    cta: "Assinar Investor",
    priceId: "price_investor_monthly",
  },
  {
    id: "premium_seller",
    name: "Premium Seller",
    price: "R$ 497",
    period: "/mês",
    description: "Para vender com máxima visibilidade",
    icon: Crown,
    color: "from-violet-500 to-violet-600",
    features: [
      "Tudo do Investor",
      "Taxa de comissão reduzida (2%)",
      "Listagens em destaque permanente",
      "Selo verificado",
      "Concierge dedicado",
      "Relatórios personalizados",
      "White-label para clientes",
    ],
    cta: "Assinar Premium",
    priceId: "price_premium_monthly",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!plan.priceId) return;

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
        window.location.href = data.url;
      } else {
        toast.info("💡 Configure os Price IDs no Stripe Dashboard para ativar assinaturas reais.", {
          description: "Os planos serão ativados quando os produtos forem criados no Stripe.",
        });
      }
    } catch (err: any) {
      toast.error("Erro ao iniciar checkout", { description: err.message });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-display font-bold text-xl text-foreground">Planos & Preços</h1>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          Escale seu negócio digital
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Escolha o plano ideal para sua jornada na cidade digital. Upgrade ou downgrade a qualquer momento.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border ${plan.popular ? "border-primary shadow-lg shadow-primary/10" : "border-border/50"} bg-card p-6 flex flex-col`}
            >
              {plan.popular && (
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
                variant={plan.popular ? "default" : "outline"}
                disabled={plan.disabled || loading === plan.id}
                onClick={() => handleSubscribe(plan)}
              >
                {loading === plan.id ? "Processando..." : plan.cta}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
