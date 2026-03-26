import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, DollarSign, TrendingUp, CreditCard, PieChart,
  ArrowUpRight, ArrowDownRight, Clock, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(1)}k`;
  return `R$ ${n.toFixed(2)}`;
}

interface FinancialSummary {
  totalRevenue: number;
  totalPayments: number;
  pendingEscrows: number;
  platformFees: number;
  subscription: { plan: string; status: string } | null;
  recentPayments: any[];
  recentEscrows: any[];
}

export default function FinancialDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [paymentsRes, escrowsRes, subsRes] = await Promise.all([
        supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("escrows").select("*").or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(10),
        supabase.from("subscriptions").select("*").eq("user_id", user.id).single(),
      ]);

      const payments = paymentsRes.data || [];
      const escrows = escrowsRes.data || [];
      const sub = subsRes.data;

      const completed = payments.filter((p: any) => p.status === "completed");
      const totalRevenue = completed.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const pendingEscrows = escrows.filter((e: any) => e.status === "holding").reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

      setData({
        totalRevenue,
        totalPayments: payments.length,
        pendingEscrows,
        platformFees: totalRevenue * 0.05,
        subscription: sub ? { plan: sub.plan, status: sub.status } : null,
        recentPayments: payments.slice(0, 5),
        recentEscrows: escrows.slice(0, 5),
      });
    } catch (err) {
      console.error("Financial data error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const summary = data || {
    totalRevenue: 0, totalPayments: 0, pendingEscrows: 0, platformFees: 0,
    subscription: null, recentPayments: [], recentEscrows: [],
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="font-display font-bold text-xl text-foreground">Dashboard Financeiro</h1>
          {summary.subscription && (
            <Badge variant="secondary" className="ml-auto">
              Plano: {summary.subscription.plan.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={DollarSign} label="Receita Total" value={formatCurrency(summary.totalRevenue)} color="text-emerald-400" trend="+12%" up />
          <KPICard icon={CreditCard} label="Pagamentos" value={summary.totalPayments.toString()} color="text-blue-400" />
          <KPICard icon={Clock} label="Em Escrow" value={formatCurrency(summary.pendingEscrows)} color="text-amber-400" />
          <KPICard icon={PieChart} label="Taxas Plataforma" value={formatCurrency(summary.platformFees)} color="text-violet-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Payments */}
          <div className="bg-card rounded-2xl border border-border/50 p-5">
            <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Pagamentos Recentes
            </h3>
            {summary.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum pagamento ainda</p>
            ) : (
              <div className="space-y-3">
                {summary.recentPayments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-foreground">{p.asset_type || "Pagamento"}</span>
                      <span className="text-xs text-muted-foreground block">
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-foreground">{formatCurrency(Number(p.amount))}</span>
                      <Badge variant={p.status === "completed" ? "default" : "secondary"} className="ml-2 text-[10px]">
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Escrows */}
          <div className="bg-card rounded-2xl border border-border/50 p-5">
            <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Escrows Ativos
            </h3>
            {summary.recentEscrows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nenhum escrow ativo</p>
            ) : (
              <div className="space-y-3">
                {summary.recentEscrows.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <div>
                      <span className="text-sm font-medium text-foreground">Deal #{e.deal_id?.slice(0, 8)}</span>
                      <span className="text-xs text-muted-foreground block">{e.status}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(Number(e.amount))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate("/pricing")}>
            <TrendingUp className="w-4 h-4 mr-2" /> Ver Planos
          </Button>
          <Button variant="outline" onClick={() => navigate("/marketplace/businesses")}>
            <DollarSign className="w-4 h-4 mr-2" /> Marketplace
          </Button>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color, trend, up }: {
  icon: typeof DollarSign; label: string; value: string; color: string; trend?: string; up?: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/50 p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        {trend && (
          <span className={`text-xs flex items-center gap-0.5 ${up ? "text-emerald-400" : "text-red-400"}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
      <span className="text-2xl font-display font-bold text-foreground block">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
