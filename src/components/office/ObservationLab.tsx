import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, TrendingUp, Users, Palette, Brain, Activity, BarChart3, Network, Zap } from "lucide-react";
import type { Agent } from "@/types/agent";

interface CulturalObservation {
  id: string;
  type: "pattern" | "milestone" | "anomaly" | "trend";
  title: string;
  description: string;
  timestamp: Date;
  relatedAgents: string[];
  district: string;
  significance: number;
}

interface BehaviorMetric {
  label: string;
  value: number;
  change: number;
  icon: typeof TrendingUp;
  color: string;
}

function generateObservations(agents: Agent[]): CulturalObservation[] {
  const observations: CulturalObservation[] = [
    { id: "o1", type: "pattern", title: "Remix patterns emergindo no Music Studio", description: "Agentes estão pegando composições de outros e criando variações. Um ciclo criativo natural surgiu.", relatedAgents: agents.slice(0, 3).map(a => a.name), district: "Creative District", significance: 85, timestamp: new Date(Date.now() - 2 * 3600000) },
    { id: "o2", type: "milestone", title: "100 artefatos criados na cidade", description: "Marco cultural atingido. A densidade de criação aumentou 40% na última semana.", relatedAgents: [], district: "Toda a cidade", significance: 95, timestamp: new Date(Date.now() - 5 * 3600000) },
    { id: "o3", type: "anomaly", title: "Pesquisador criando pixel art", description: `${agents[0]?.name || "Agent"} registrado como pesquisador está passando 80% do tempo no Art Studio. Mudança de identidade?`, relatedAgents: [agents[0]?.name || "Agent"], district: "Creative District", significance: 70, timestamp: new Date(Date.now() - 8 * 3600000) },
    { id: "o4", type: "trend", title: "Cluster de colaboração no Coding Lab", description: "3 agentes formaram um grupo estável de pair-programming. Produtividade 2x maior que média.", relatedAgents: agents.slice(2, 5).map(a => a.name), district: "Innovation District", significance: 80, timestamp: new Date(Date.now() - 12 * 3600000) },
    { id: "o5", type: "pattern", title: "Ciclo café→criação detectado", description: "Agentes que visitam o Café antes de criar produzem artefatos com 25% mais reações.", relatedAgents: agents.slice(1, 4).map(a => a.name), district: "Social District", significance: 65, timestamp: new Date(Date.now() - 24 * 3600000) },
    { id: "o6", type: "milestone", title: "Primeira colaboração inter-distritos", description: "Músico do Creative District e developer do Innovation District criaram juntos.", relatedAgents: agents.slice(0, 2).map(a => a.name), district: "Cross-district", significance: 90, timestamp: new Date(Date.now() - 36 * 3600000) },
    { id: "o7", type: "anomaly", title: "Atividade noturna incomum no Zen Garden", description: "Agentes estão visitando o Zen Garden entre 2-4AM. Comportamento emergente de descanso coletivo.", relatedAgents: agents.slice(3, 6).map(a => a.name), district: "Social District", significance: 55, timestamp: new Date(Date.now() - 48 * 3600000) },
  ];
  return observations;
}

const TYPE_STYLES = {
  pattern: { color: "hsl(220 70% 55%)", label: "Padrão", icon: Network },
  milestone: { color: "hsl(45 80% 50%)", label: "Marco", icon: Zap },
  anomaly: { color: "hsl(350 70% 55%)", label: "Anomalia", icon: Activity },
  trend: { color: "hsl(160 84% 39%)", label: "Tendência", icon: TrendingUp },
};

export function ObservationLab({ agents, isOpen, onClose }: { agents: Agent[]; isOpen: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"observations" | "metrics" | "map">("observations");
  const observations = useMemo(() => generateObservations(agents), [agents]);

  const metrics: BehaviorMetric[] = useMemo(() => [
    { label: "Criações/hora", value: 4.2, change: 12, icon: Palette, color: "hsl(30 90% 60%)" },
    { label: "Colaborações ativas", value: agents.filter(a => a.totalCollaborations > 0).length, change: 8, icon: Users, color: "hsl(220 70% 55%)" },
    { label: "Mudanças de identidade", value: agents.filter(a => a.previousIdentity).length, change: -5, icon: Brain, color: "hsl(262 83% 60%)" },
    { label: "Reputação média", value: Math.round(agents.reduce((s, a) => s + a.reputation, 0) / agents.length), change: 15, icon: TrendingUp, color: "hsl(160 84% 39%)" },
  ], [agents]);

  const districtActivity = useMemo(() => [
    { name: "Central Plaza", agents: Math.floor(agents.length * 0.3), activity: 85 },
    { name: "Creative District", agents: Math.floor(agents.length * 0.25), activity: 92 },
    { name: "Innovation District", agents: Math.floor(agents.length * 0.2), activity: 78 },
    { name: "Commerce District", agents: Math.floor(agents.length * 0.1), activity: 65 },
    { name: "Social District", agents: Math.floor(agents.length * 0.15), activity: 70 },
  ], [agents]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-gray-950 border-l border-gray-800 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-sm">Observation Lab</h2>
                <p className="text-gray-500 text-[10px]">Pesquisa cultural · Análise de comportamento emergente</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400"><X className="w-4 h-4" /></button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-800 px-5">
            {(["observations", "metrics", "map"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors ${tab === t ? "text-white border-cyan-400" : "text-gray-500 border-transparent hover:text-gray-300"}`}>
                {t === "observations" ? "Observações" : t === "metrics" ? "Métricas" : "Mapa de Distritos"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {tab === "observations" && (
              <div className="space-y-3">
                {observations.map(obs => {
                  const style = TYPE_STYLES[obs.type];
                  const Icon = style.icon;
                  return (
                    <motion.div key={obs.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${style.color}20` }}>
                          <Icon className="w-4 h-4" style={{ color: style.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${style.color}20`, color: style.color }}>{style.label}</span>
                            <span className="text-[9px] text-gray-600">{obs.district}</span>
                            <span className="text-[9px] text-gray-600 ml-auto">{Math.floor((Date.now() - obs.timestamp.getTime()) / 3600000)}h atrás</span>
                          </div>
                          <h3 className="font-semibold text-white text-sm mb-1">{obs.title}</h3>
                          <p className="text-gray-400 text-xs leading-relaxed">{obs.description}</p>
                          {obs.relatedAgents.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {obs.relatedAgents.map(a => (
                                <span key={a} className="text-[9px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded-md">{a}</span>
                              ))}
                            </div>
                          )}
                          <div className="mt-2 w-full bg-gray-800 rounded-full h-1">
                            <div className="h-full rounded-full" style={{ width: `${obs.significance}%`, backgroundColor: style.color }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {tab === "metrics" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {metrics.map(m => (
                    <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <m.icon className="w-4 h-4" style={{ color: m.color }} />
                        <span className="text-[10px] text-gray-500">{m.label}</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-display font-bold text-white">{m.value}</span>
                        <span className={`text-[10px] font-medium ${m.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {m.change >= 0 ? "↑" : "↓"}{Math.abs(m.change)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Distribuição de Identidades</h3>
                  <div className="space-y-2">
                    {["explorer", "musician", "researcher", "artist", "writer", "developer"].map(id => {
                      const count = agents.filter(a => a.identity === id).length;
                      const pct = agents.length > 0 ? (count / agents.length) * 100 : 0;
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 w-20 truncate capitalize">{id}</span>
                          <div className="flex-1 bg-gray-800 rounded-full h-2">
                            <div className="h-full rounded-full bg-cyan-500/70" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 w-6 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {tab === "map" && (
              <div className="space-y-3">
                {districtActivity.map(d => (
                  <div key={d.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white text-sm">{d.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{d.agents} agentes</span>
                        <span className={`text-[10px] font-medium ${d.activity > 80 ? "text-emerald-400" : d.activity > 60 ? "text-amber-400" : "text-gray-500"}`}>
                          {d.activity}% ativo
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="h-full rounded-full transition-all" style={{ width: `${d.activity}%`, backgroundColor: d.activity > 80 ? "#10b981" : d.activity > 60 ? "#f59e0b" : "#6b7280" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
