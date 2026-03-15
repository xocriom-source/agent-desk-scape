import { motion } from "framer-motion";
import { Activity, Bot, Zap, Brain, MessageCircle, Workflow, TrendingUp, BarChart3 } from "lucide-react";

// Mock ecosystem metrics
const METRICS = {
  activeAgents: 847,
  dailyInteractions: 12453,
  newPhrases: 34,
  collaborations: 189,
  workflowsExecuted: 567,
  creationsToday: 234,
  protocolSignals: 78,
  avgResponseTime: "1.2s",
};

const HOURLY_ACTIVITY = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  value: Math.floor(Math.random() * 800) + 200,
}));

export function EvolutionObservatory() {
  const stats = [
    { label: "Agentes Ativos", value: METRICS.activeAgents, icon: Bot, color: "text-violet-400", bg: "bg-violet-400/10", trend: "+12%" },
    { label: "Interações Diárias", value: METRICS.dailyInteractions.toLocaleString(), icon: MessageCircle, color: "text-blue-400", bg: "bg-blue-400/10", trend: "+8%" },
    { label: "Novos Termos", value: METRICS.newPhrases, icon: Brain, color: "text-amber-400", bg: "bg-amber-400/10", trend: "+5" },
    { label: "Colaborações", value: METRICS.collaborations, icon: Zap, color: "text-emerald-400", bg: "bg-emerald-400/10", trend: "+23%" },
    { label: "Workflows Executados", value: METRICS.workflowsExecuted, icon: Workflow, color: "text-cyan-400", bg: "bg-cyan-400/10", trend: "+15%" },
    { label: "Criações Hoje", value: METRICS.creationsToday, icon: TrendingUp, color: "text-pink-400", bg: "bg-pink-400/10", trend: "+31%" },
  ];

  const maxActivity = Math.max(...HOURLY_ACTIVITY.map(h => h.value));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Evolution Observatory</h2>
        <span className="text-[10px] bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className="text-[10px] text-emerald-400 font-medium">{stat.trend}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Activity Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Atividade por Hora (Últimas 24h)
          </h3>
        </div>
        <div className="flex items-end gap-1 h-32">
          {HOURLY_ACTIVITY.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-primary/60 to-primary/20 hover:from-primary/80 hover:to-primary/40 transition-colors cursor-pointer"
                style={{ height: `${(h.value / maxActivity) * 100}%` }}
                title={`${h.hour}:00 — ${h.value} ações`}
              />
              {i % 4 === 0 && <span className="text-[8px] text-gray-600">{h.hour}h</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Live Pulse */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-xs font-bold text-white mb-3">Pulso da Cidade</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-gray-400">{METRICS.protocolSignals} sinais de protocolo ativos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] text-gray-400">Tempo médio de resposta: {METRICS.avgResponseTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
