import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3, TrendingUp, Users, Sparkles, Star, Brain, Zap, Award } from "lucide-react";
import type { Agent } from "@/types/agent";

interface AnalyticsDashboardProps {
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
}

export function AnalyticsDashboard({ agents, isOpen, onClose }: AnalyticsDashboardProps) {
  const totalCreations = agents.reduce((s, a) => s + a.totalCreations, 0);
  const totalCollabs = agents.reduce((s, a) => s + a.totalCollaborations, 0);
  const avgReputation = Math.round(agents.reduce((s, a) => s + a.reputation, 0) / agents.length);
  const totalSkillLevels = agents.reduce((s, a) => s + a.skills.reduce((ss, sk) => ss + sk.level, 0), 0);
  const trainingAgents = agents.filter((a) => a.isTraining).length;

  // Leaderboards
  const byReputation = [...agents].sort((a, b) => b.reputation - a.reputation);
  const byCreations = [...agents].sort((a, b) => b.totalCreations - a.totalCreations);
  const byCollabs = [...agents].sort((a, b) => b.totalCollaborations - a.totalCollaborations);

  // Skill distribution
  const allSkills: Record<string, number> = {};
  agents.forEach((a) => a.skills.forEach((s) => {
    allSkills[s.name] = (allSkills[s.name] || 0) + s.level;
  }));
  const topSkills = Object.entries(allSkills).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxSkillVal = topSkills[0]?.[1] || 1;

  // Status distribution
  const statusCounts = agents.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  // Identity distribution
  const identityCounts = agents.reduce<Record<string, number>>((acc, a) => {
    acc[a.identity] = (acc[a.identity] || 0) + 1;
    return acc;
  }, {});

  const EMOJIS = ["🔬", "✍️", "💻", "📊", "🎨", "🔧", "⚡", "🧪"];
  const IDENTITY_EMOJI: Record<string, string> = {
    researcher: "🔬", writer: "✍️", developer: "💻", analyst: "📊",
    artist: "🎨", designer: "🎨", explorer: "🧭", musician: "🎵",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-5xl mx-4 overflow-hidden border border-border max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-lg">Analytics Dashboard</h2>
                  <p className="text-[11px] text-muted-foreground">Métricas e desempenho da cidade</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                  { label: "Agentes", value: agents.length, icon: Users, color: "#4ECDC4" },
                  { label: "Criações", value: totalCreations, icon: Sparkles, color: "#FFB347" },
                  { label: "Collabs", value: totalCollabs, icon: Users, color: "#FF6BB5" },
                  { label: "Rep. Média", value: avgReputation, icon: Star, color: "#FFD700" },
                  { label: "Treinando", value: trainingAgents, icon: Zap, color: "#A78BFA" },
                ].map((kpi, i) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-border/20 p-4 text-center"
                  >
                    <kpi.icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: kpi.color }} />
                    <div className="text-xl font-bold text-foreground">{kpi.value}</div>
                    <div className="text-[10px] text-muted-foreground">{kpi.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Reputation Leaderboard */}
                <div className="rounded-xl border border-border/20 p-4">
                  <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#FFD700]" /> Top Reputação
                  </h3>
                  <div className="space-y-2">
                    {byReputation.slice(0, 5).map((a, i) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-4">{i + 1}.</span>
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs" style={{ backgroundColor: a.color }}>
                          {EMOJIS[a.avatar]}
                        </div>
                        <span className="text-[11px] text-foreground flex-1">{a.name}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 text-[#FFD700]" />
                          <span className="text-[10px] font-bold text-foreground">{a.reputation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Creations Leaderboard */}
                <div className="rounded-xl border border-border/20 p-4">
                  <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FFB347]" /> Top Criadores
                  </h3>
                  <div className="space-y-2">
                    {byCreations.slice(0, 5).map((a, i) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-4">{i + 1}.</span>
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs" style={{ backgroundColor: a.color }}>
                          {EMOJIS[a.avatar]}
                        </div>
                        <span className="text-[11px] text-foreground flex-1">{a.name}</span>
                        <span className="text-[10px] font-bold text-foreground">{a.totalCreations}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collaborations Leaderboard */}
                <div className="rounded-xl border border-border/20 p-4">
                  <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#FF6BB5]" /> Top Colaboradores
                  </h3>
                  <div className="space-y-2">
                    {byCollabs.slice(0, 5).map((a, i) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-4">{i + 1}.</span>
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs" style={{ backgroundColor: a.color }}>
                          {EMOJIS[a.avatar]}
                        </div>
                        <span className="text-[11px] text-foreground flex-1">{a.name}</span>
                        <span className="text-[10px] font-bold text-foreground">{a.totalCollaborations}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Skills chart */}
                <div className="rounded-xl border border-border/20 p-4">
                  <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-primary" /> Distribuição de Skills
                  </h3>
                  <div className="space-y-2">
                    {topSkills.map(([name, val]) => (
                      <div key={name}>
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="text-foreground font-medium">{val}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(val / maxSkillVal) * 100}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Identity + Status */}
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/20 p-4">
                    <h3 className="text-xs font-semibold text-foreground mb-3">Identidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(identityCounts).map(([id, count]) => (
                        <div key={id} className="flex items-center gap-1.5 bg-muted/20 rounded-lg px-2.5 py-1.5">
                          <span className="text-sm">{IDENTITY_EMOJI[id] || "🤖"}</span>
                          <span className="text-[10px] text-foreground font-medium capitalize">{id}</span>
                          <span className="text-[9px] text-muted-foreground">×{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/20 p-4">
                    <h3 className="text-xs font-semibold text-foreground mb-3">Status Atual</h3>
                    <div className="flex gap-3">
                      {Object.entries(statusCounts).map(([status, count]) => {
                        const colors: Record<string, string> = { active: "#10B981", idle: "#F59E0B", thinking: "#6366F1", busy: "#EF4444" };
                        return (
                          <div key={status} className="text-center">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-foreground mx-auto" style={{ backgroundColor: `${colors[status]}20` }}>
                              {count}
                            </div>
                            <span className="text-[9px] text-muted-foreground capitalize mt-1 block">{status}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
