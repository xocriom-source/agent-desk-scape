import { motion, AnimatePresence } from "framer-motion";
import { X, Brain, Database, MessageSquare, Search, Clock, Trash2, ChevronDown, ChevronRight, FileText, Lightbulb, Users } from "lucide-react";
import type { Agent } from "@/types/agent";
import { useState } from "react";

interface MemoryEntry {
  id: string;
  type: "conversation" | "fact" | "preference" | "relationship" | "task_result";
  content: string;
  source: string;
  timestamp: Date;
  importance: number; // 1-5
  tags: string[];
}

function generateMemory(agent: Agent): MemoryEntry[] {
  const memories: MemoryEntry[] = [
    { id: `m-${agent.id}-1`, type: "fact", content: `Minha missão principal é: ${agent.mission}`, source: "core", timestamp: new Date(Date.now() - 86400000 * agent.daysSinceArrival), importance: 5, tags: ["missão", "identidade"] },
    { id: `m-${agent.id}-2`, type: "preference", content: `Prefiro trabalhar na sala ${agent.room} — me sinto mais produtivo aqui.`, source: "aprendizado", timestamp: new Date(Date.now() - 86400000 * 10), importance: 3, tags: ["preferência", "local"] },
    { id: `m-${agent.id}-3`, type: "conversation", content: `Conversei com o Chefe sobre prioridades do sprint. Ele quer foco em qualidade.`, source: "chat", timestamp: new Date(Date.now() - 86400000 * 2), importance: 4, tags: ["conversa", "chefe"] },
    ...agent.relationships.map((r, i) => ({
      id: `m-${agent.id}-rel-${i}`,
      type: "relationship" as const,
      content: `${r.agentName} e eu já colaboramos ${r.collaborations} vezes. Força do vínculo: ${r.strength}/100.`,
      source: "social",
      timestamp: r.lastInteraction,
      importance: r.strength > 60 ? 4 : 2,
      tags: ["relacionamento", r.agentName.toLowerCase()],
    })),
    ...agent.artifacts.slice(0, 3).map((a, i) => ({
      id: `m-${agent.id}-art-${i}`,
      type: "task_result" as const,
      content: `Criei "${a.title}" — recebeu ${a.reactions} reações da comunidade.`,
      source: "criação",
      timestamp: a.createdAt,
      importance: a.reactions > 15 ? 5 : 3,
      tags: ["criação", a.type],
    })),
    { id: `m-${agent.id}-reflect`, type: "fact", content: agent.lastReflection || "Estou evoluindo a cada ciclo.", source: "reflexão", timestamp: new Date(Date.now() - 86400000), importance: 3, tags: ["reflexão", "crescimento"] },
    { id: `m-${agent.id}-skill`, type: "fact", content: `Minhas skills mais fortes: ${agent.skills.sort((a, b) => b.level - a.level).slice(0, 2).map(s => `${s.name} (Lv${s.level})`).join(", ")}`, source: "auto-avaliação", timestamp: new Date(Date.now() - 86400000 * 3), importance: 4, tags: ["skills", "avaliação"] },
    { id: `m-${agent.id}-thought`, type: "preference", content: agent.currentThought || "Processando novas informações...", source: "pensamento", timestamp: new Date(), importance: 2, tags: ["pensamento", "atual"] },
  ];
  return memories.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

const TYPE_CONFIG = {
  conversation: { icon: MessageSquare, label: "Conversa", color: "text-primary" },
  fact: { icon: Brain, label: "Fato", color: "text-accent" },
  preference: { icon: Lightbulb, label: "Preferência", color: "text-[#FFB347]" },
  relationship: { icon: Users, label: "Relação", color: "text-[#FF6BB5]" },
  task_result: { icon: FileText, label: "Resultado", color: "text-[#4ECDC4]" },
};

const IMPORTANCE_DOTS = ["", "○", "◐", "●", "★", "★★"];

interface AgentMemoryProps {
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
}

export function AgentMemory({ agents, isOpen, onClose }: AgentMemoryProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(agents[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const agent = agents.find((a) => a.id === selectedAgentId);
  const memories = agent ? generateMemory(agent) : [];
  
  const filtered = memories.filter((m) => {
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    if (searchQuery && !m.content.toLowerCase().includes(searchQuery.toLowerCase()) && !m.tags.some(t => t.includes(searchQuery.toLowerCase()))) return false;
    return true;
  });

  const EMOJIS = ["🔬", "✍️", "💻", "📊", "🎨", "🔧", "⚡", "🧪"];

  const memoryStats = {
    total: memories.length,
    conversations: memories.filter(m => m.type === "conversation").length,
    facts: memories.filter(m => m.type === "fact").length,
    relationships: memories.filter(m => m.type === "relationship").length,
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
            className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden border border-border max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-lg">Memória dos Agentes</h2>
                  <p className="text-[11px] text-muted-foreground">Conversas, fatos, preferências e estado interno</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Agent selector sidebar */}
              <div className="w-48 border-r border-border/30 overflow-y-auto p-2">
                {agents.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAgentId(a.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-xl text-left transition-colors mb-0.5 ${
                      selectedAgentId === a.id ? "bg-primary/10" : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: a.color }}>
                      {EMOJIS[a.avatar]}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-foreground block truncate">{a.name}</span>
                      <span className="text-[9px] text-muted-foreground">{a.role}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Memory content */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Agent info + stats */}
                {agent && (
                  <div className="px-4 py-3 border-b border-border/30 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: agent.color }}>
                      {EMOJIS[agent.avatar]}
                    </div>
                    <div>
                      <span className="text-sm font-bold text-foreground">{agent.name}</span>
                      <div className="flex gap-3 text-[9px] text-muted-foreground mt-0.5">
                        <span>📝 {memoryStats.total} memórias</span>
                        <span>💬 {memoryStats.conversations} conversas</span>
                        <span>🧠 {memoryStats.facts} fatos</span>
                        <span>🤝 {memoryStats.relationships} relações</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search + filters */}
                <div className="px-4 py-2 border-b border-border/30 flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar nas memórias..."
                      className="w-full text-xs bg-muted/30 rounded-xl pl-8 pr-3 py-2 text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="text-xs bg-muted/30 rounded-xl px-3 py-2 text-foreground border-0 outline-none"
                  >
                    <option value="all">Todos os tipos</option>
                    <option value="conversation">💬 Conversas</option>
                    <option value="fact">🧠 Fatos</option>
                    <option value="preference">💡 Preferências</option>
                    <option value="relationship">🤝 Relações</option>
                    <option value="task_result">📄 Resultados</option>
                  </select>
                </div>

                {/* Memory list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  {filtered.map((mem, i) => {
                    const cfg = TYPE_CONFIG[mem.type];
                    const Icon = cfg.icon;
                    const isExpanded = expandedIds.has(mem.id);
                    return (
                      <motion.div
                        key={mem.id}
                        initial={i < 6 ? { opacity: 0, x: -5 } : false}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-xl border border-border/15 hover:border-border/30 transition-all"
                      >
                        <button
                          onClick={() => setExpandedIds((prev) => {
                            const next = new Set(prev);
                            next.has(mem.id) ? next.delete(mem.id) : next.add(mem.id);
                            return next;
                          })}
                          className="w-full flex items-center gap-2.5 p-3 text-left"
                        >
                          <Icon className={`w-3.5 h-3.5 ${cfg.color} shrink-0`} />
                          <span className="text-[11px] text-foreground flex-1 truncate">{mem.content}</span>
                          <span className="text-[9px] text-muted-foreground/50 shrink-0">{IMPORTANCE_DOTS[mem.importance]}</span>
                          {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 pt-0">
                                <p className="text-[10px] text-muted-foreground mb-2">{mem.content}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-muted/30 ${cfg.color}`}>{cfg.label}</span>
                                  <span className="text-[9px] text-muted-foreground/50">Fonte: {mem.source}</span>
                                  <span className="text-[9px] text-muted-foreground/50">
                                    {mem.timestamp.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                                  </span>
                                  {mem.tags.map((tag) => (
                                    <span key={tag} className="text-[8px] bg-muted/20 text-muted-foreground px-1.5 py-0.5 rounded-full">#{tag}</span>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma memória encontrada.</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
