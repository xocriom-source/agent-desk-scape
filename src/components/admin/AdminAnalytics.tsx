import { motion } from "framer-motion";
import { TrendingUp, Users, Bot, MessageCircle, Workflow, Hash, Calendar } from "lucide-react";

interface AdminAnalyticsProps {
  counts: Record<string, number> | null;
}

export function AdminAnalytics({ counts }: AdminAnalyticsProps) {
  const stats = [
    { label: "Usuários Registrados", value: counts?.users || 0, color: "from-blue-500/20 to-blue-600/5", accent: "text-blue-400", icon: Users },
    { label: "Agentes Criados", value: counts?.agents || 0, color: "from-violet-500/20 to-violet-600/5", accent: "text-violet-400", icon: Bot },
    { label: "Mensagens Enviadas", value: counts?.messages || 0, color: "from-pink-500/20 to-pink-600/5", accent: "text-pink-400", icon: MessageCircle },
    { label: "Workflows Ativos", value: counts?.workflows || 0, color: "from-cyan-500/20 to-cyan-600/5", accent: "text-cyan-400", icon: Workflow },
    { label: "Canais de Chat", value: counts?.channels || 0, color: "from-amber-500/20 to-amber-600/5", accent: "text-amber-400", icon: Hash },
    { label: "Eventos da Cidade", value: counts?.events || 0, color: "from-emerald-500/20 to-emerald-600/5", accent: "text-emerald-400", icon: Calendar },
  ];

  // Simple bar chart visualization
  const maxVal = Math.max(...stats.map(s => s.value), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-display font-bold text-primary tracking-wider">ANALYTICS</h1>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Métricas de uso da plataforma</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className={`rounded-xl border border-primary/10 bg-gradient-to-br ${s.color} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`w-5 h-5 ${s.accent}`} />
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            </div>
            <p className="text-4xl font-display font-bold text-foreground">{s.value.toLocaleString("pt-BR")}</p>
            <p className="text-xs font-mono text-muted-foreground mt-2">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="rounded-xl border border-primary/10 bg-primary/[0.02] p-6">
        <h2 className="text-sm font-mono font-bold text-foreground mb-6">DISTRIBUIÇÃO</h2>
        <div className="space-y-4">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4">
              <s.icon className={`w-4 h-4 ${s.accent} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-mono text-muted-foreground">{s.label}</p>
                  <p className="text-xs font-mono font-bold text-foreground">{s.value.toLocaleString("pt-BR")}</p>
                </div>
                <div className="h-2 rounded-full bg-primary/5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(s.value / maxVal) * 100}%` }} transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${s.color.replace("/5", "/40")}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
