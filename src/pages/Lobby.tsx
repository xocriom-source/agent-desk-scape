import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Bot, MapPin, ArrowRight, Plus, BarChart3,
  Globe, Activity, Clock, Star, Sparkles, TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PlanBadge } from "@/components/plan/PlanBadge";
import { LoadingState, EmptyState } from "@/components/ui/LoadingState";
import { SEOHead } from "@/components/SEOHead";
import { fetchUserBuildings, fetchRecentActivity, type BuildingSummary } from "@/services/buildingService";
import logoOriginal from "@/assets/logo-original.svg";

const TYPE_EMOJIS: Record<string, string> = {
  corporate: "🏢", studio: "🎨", research: "🔬", hub: "🤝",
};

export default function Lobby() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [buildings, setBuildings] = useState<BuildingSummary[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetchUserBuildings(user.id),
      fetchRecentActivity(user.id, 5),
    ]).then(([b, a]) => {
      setBuildings(b);
      setActivity(a);
    }).finally(() => setLoading(false));
  }, [user]);

  const userName = profile?.display_name || "Usuário";
  const primaryBuilding = buildings[0];
  const totalFloors = buildings.reduce((s, b) => s + b.floors, 0);

  const quickStats = useMemo(() => [
    { icon: Building2, label: "Espaços", value: buildings.length },
    { icon: TrendingUp, label: "Andares", value: totalFloors },
    { icon: Globe, label: "Cidades", value: new Set(buildings.map(b => b.city).filter(Boolean)).size || 0 },
  ], [buildings, totalFloors]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Lobby" description="Gerencie seus prédios e agentes IA no The Good City." path="/spaces" />
        <nav className="border-b border-border/30 bg-card/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-muted animate-pulse" />
              <div className="w-24 h-4 rounded bg-muted animate-pulse hidden sm:block" />
            </div>
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 space-y-2">
            <div className="w-64 h-8 rounded bg-muted animate-pulse" />
            <div className="w-48 h-4 rounded bg-muted animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-border/40 bg-card p-4 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                <div className="w-12 h-6 rounded bg-muted animate-pulse" />
                <div className="w-16 h-3 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-border/40 bg-card p-5 space-y-3">
                <div className="w-full h-24 rounded-lg bg-muted animate-pulse" />
                <div className="w-3/4 h-5 rounded bg-muted animate-pulse" />
                <div className="w-1/2 h-3 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Lobby" description="Gerencie seus prédios e agentes IA no The Good City." path="/spaces" />
      {/* Nav */}
      <nav className="border-b border-border/30 bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <img src={logoOriginal} alt="" className="w-7 h-7" />
            <span className="text-primary font-bold text-sm tracking-wider font-mono hidden sm:block">THE GOOD CITY</span>
          </div>
          <div className="flex items-center gap-3">
            <PlanBadge />
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {greeting}, <span className="text-primary">{userName}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {buildings.length > 0
              ? `Você tem ${buildings.length} espaço${buildings.length > 1 ? "s" : ""} ativo${buildings.length > 1 ? "s" : ""}`
              : "Crie seu primeiro espaço para começar"}
          </p>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {quickStats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border/30 rounded-xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-mono tracking-wider">{s.label.toUpperCase()}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main: Buildings */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Seus Espaços
              </h2>
              <button
                onClick={() => navigate("/onboarding?mode=new")}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Novo espaço
              </button>
            </div>

            {buildings.length === 0 ? (
              <EmptyState
                icon={<Building2 className="w-10 h-10" />}
                title="Nenhum espaço encontrado"
                description="Crie seu primeiro prédio virtual e comece a operar na cidade."
                action={
                  <button
                    onClick={() => navigate("/onboarding")}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Criar meu primeiro espaço
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {buildings.map((b, i) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => navigate("/office")}
                    className="bg-card border border-border/30 rounded-xl p-4 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: `${b.primary_color || "#3b82f6"}22` }}
                      >
                        {TYPE_EMOJIS[b.style] || "🏢"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">{b.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MapPin className="w-3 h-3" /> {b.city || "Sem cidade"}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Star className="w-3 h-3" /> {b.floors} andares
                          </span>
                          <span className="text-[10px] text-muted-foreground capitalize">{b.style}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { label: "Cidade", icon: Globe, path: "/city-explore", color: "text-accent" },
                { label: "Mapa Global", icon: MapPin, path: "/world", color: "text-primary" },
                { label: "Marketplace", icon: BarChart3, path: "/marketplace/businesses", color: "text-amber-500" },
                { label: "Ecossistema", icon: Sparkles, path: "/ecosystem", color: "text-purple-500" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 bg-card border border-border/30 rounded-xl p-4 hover:border-primary/30 hover:bg-card/80 transition-all"
                >
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                  <span className="text-[10px] font-mono text-muted-foreground tracking-wider">{action.label.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sidebar: Recent activity */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" /> Atividade recente
            </h2>
            <div className="bg-card border border-border/30 rounded-xl overflow-hidden">
              {activity.length === 0 ? (
                <div className="p-6 text-center">
                  <Clock className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Nenhuma atividade ainda</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    Suas ações aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/20">
                  {activity.map((item) => (
                    <div key={item.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-foreground truncate">
                            <span className="font-medium">{item.actor_name}</span>{" "}
                            <span className="text-muted-foreground">{item.action}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {new Date(item.created_at).toLocaleDateString("pt-BR", {
                              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plan info */}
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Seu plano</span>
              </div>
              <PlanBadge />
              <button
                onClick={() => navigate("/pricing")}
                className="w-full mt-3 text-[10px] text-primary hover:text-primary/80 font-mono tracking-wider transition-colors"
              >
                VER PLANOS →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
