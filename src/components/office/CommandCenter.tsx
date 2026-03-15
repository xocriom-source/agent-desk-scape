import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, UserPlus, Trash2, Edit3, Save, Zap, Star, Brain, Target, Shield } from "lucide-react";
import type { Agent, AgentIdentity, AgentSkill } from "@/types/agent";
import { useState } from "react";

const IDENTITIES: { value: AgentIdentity; label: string; emoji: string }[] = [
  { value: "researcher", label: "Pesquisador", emoji: "🔬" },
  { value: "writer", label: "Escritor", emoji: "✍️" },
  { value: "developer", label: "Desenvolvedor", emoji: "💻" },
  { value: "analyst", label: "Analista", emoji: "📊" },
  { value: "artist", label: "Artista", emoji: "🎨" },
  { value: "designer", label: "Designer", emoji: "🎨" },
  { value: "explorer", label: "Explorador", emoji: "🧭" },
  { value: "musician", label: "Músico", emoji: "🎵" },
];

const ROLE_TEMPLATES = [
  { role: "Pesquisador IA", identity: "researcher" as AgentIdentity, skills: ["Pesquisa", "Análise de Dados", "Escrita Acadêmica"] },
  { role: "Escritor IA", identity: "writer" as AgentIdentity, skills: ["Escrita Criativa", "Storytelling", "Poesia"] },
  { role: "Desenvolvedor IA", identity: "developer" as AgentIdentity, skills: ["Programação", "Arquitetura", "Code Review"] },
  { role: "Analista de Dados", identity: "analyst" as AgentIdentity, skills: ["Análise de Dados", "Visualização", "SQL"] },
  { role: "Designer IA", identity: "artist" as AgentIdentity, skills: ["Design Visual", "Pixel Art", "UI/UX"] },
  { role: "DevOps IA", identity: "developer" as AgentIdentity, skills: ["Infrastructure", "CI/CD", "Monitoramento"] },
  { role: "QA Tester IA", identity: "analyst" as AgentIdentity, skills: ["Testes", "Automação", "Documentação"] },
  { role: "Músico IA", identity: "musician" as AgentIdentity, skills: ["Composição", "Produção", "Sound Design"] },
];

const COLORS = ["#3B82F6", "#22C55E", "#F97316", "#A855F7", "#EC4899", "#06B6D4", "#EAB308", "#14B8A6", "#F43F5E", "#8B5CF6"];

interface CommandCenterProps {
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
}

export function CommandCenter({ agents, isOpen, onClose }: CommandCenterProps) {
  const [view, setView] = useState<"overview" | "create">("overview");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState(ROLE_TEMPLATES[0].role);
  const [newIdentity, setNewIdentity] = useState<AgentIdentity>("researcher");
  const [newMission, setNewMission] = useState("");
  const [newSoul, setNewSoul] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  const EMOJIS = ["🔬", "✍️", "💻", "📊", "🎨", "🔧", "⚡", "🧪"];

  const totalStats = {
    agents: agents.length,
    active: agents.filter(a => a.status === "active").length,
    training: agents.filter(a => a.isTraining).length,
    avgRep: Math.round(agents.reduce((s, a) => s + a.reputation, 0) / agents.length),
    totalCreations: agents.reduce((s, a) => s + a.totalCreations, 0),
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
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-lg">Command Center</h2>
                  <p className="text-[11px] text-muted-foreground">Gerencie sua equipe de agentes de IA</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView(view === "create" ? "overview" : "create")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-xs font-medium hover:bg-primary/30 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {view === "create" ? "Ver Equipe" : "Novo Agente"}
                </button>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="px-6 py-3 border-b border-border/30 flex gap-6">
              {[
                { label: "Agentes", value: totalStats.agents, icon: "👥" },
                { label: "Ativos", value: totalStats.active, icon: "🟢" },
                { label: "Treinando", value: totalStats.training, icon: "⚡" },
                { label: "Rep. Média", value: totalStats.avgRep, icon: "⭐" },
                { label: "Criações", value: totalStats.totalCreations, icon: "✨" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-sm font-bold text-foreground">{s.icon} {s.value}</div>
                  <div className="text-[9px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {view === "overview" ? (
                /* Agent roster */
                <div className="space-y-2">
                  {agents.map((agent, i) => (
                    <motion.div
                      key={agent.id}
                      initial={i < 6 ? { opacity: 0, y: 5 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-3 rounded-xl border border-border/20 hover:border-border/40 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: agent.color }}>
                        {EMOJIS[agent.avatar]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{agent.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground">{agent.identity}</span>
                          {agent.isTraining && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary animate-pulse">
                              <Zap className="w-2.5 h-2.5 inline" /> Treinando
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{agent.role} · {agent.room}</p>
                        <div className="flex gap-3 mt-1 text-[9px] text-muted-foreground">
                          <span>⭐ {agent.reputation}</span>
                          <span>🧠 {agent.skills.length} skills</span>
                          <span>✨ {agent.totalCreations} criações</span>
                          <span>🤝 {agent.totalCollaborations} collabs</span>
                          <span>📅 {agent.daysSinceArrival}d</span>
                        </div>
                      </div>
                      {/* Skill bars mini */}
                      <div className="w-28 space-y-1 hidden md:block">
                        {agent.skills.slice(0, 2).map((s) => (
                          <div key={s.name}>
                            <div className="flex justify-between text-[8px]">
                              <span className="text-muted-foreground truncate">{s.name}</span>
                              <span className="text-foreground">{s.level}</span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${s.level}%`, backgroundColor: agent.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-center shrink-0">
                        <div className={`w-3 h-3 rounded-full mx-auto mb-0.5 ${
                          agent.status === "active" ? "bg-accent" :
                          agent.status === "thinking" ? "bg-primary" :
                          agent.status === "busy" ? "bg-destructive" : "bg-[#F59E0B]"
                        }`} />
                        <span className="text-[8px] text-muted-foreground capitalize">{agent.status}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                /* Create new agent */
                <div className="max-w-lg mx-auto space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" />
                    Criar Novo Agente
                  </h3>

                  {/* Template selector */}
                  <div>
                    <label className="text-[10px] text-muted-foreground font-medium block mb-1.5">Template de Função</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {ROLE_TEMPLATES.map((t, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedTemplate(i);
                            setNewRole(t.role);
                            setNewIdentity(t.identity);
                          }}
                          className={`p-2 rounded-xl text-center text-[10px] transition-colors ${
                            selectedTemplate === i ? "bg-primary/15 text-primary border border-primary/30" : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                          }`}
                        >
                          {IDENTITIES.find(id => id.value === t.identity)?.emoji}<br/>
                          {t.role.replace(" IA", "")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium block mb-1">Nome do Agente</label>
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ex: Phoenix, Nexus, Aria..."
                        className="w-full text-sm bg-muted/30 rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium block mb-1">Missão</label>
                      <textarea
                        value={newMission}
                        onChange={(e) => setNewMission(e.target.value)}
                        placeholder="Qual é o propósito principal deste agente?"
                        rows={2}
                        className="w-full text-xs bg-muted/30 rounded-xl px-4 py-2 text-foreground placeholder:text-muted-foreground border-0 outline-none resize-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground font-medium block mb-1">Soul (Essência)</label>
                      <input
                        value={newSoul}
                        onChange={(e) => setNewSoul(e.target.value)}
                        placeholder="Ex: Eu crio porque o mundo precisa de beleza."
                        className="w-full text-xs bg-muted/30 rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-muted-foreground font-medium block mb-1">Identidade</label>
                        <select
                          value={newIdentity}
                          onChange={(e) => setNewIdentity(e.target.value as AgentIdentity)}
                          className="w-full text-xs bg-muted/30 rounded-xl px-3 py-2.5 text-foreground border-0 outline-none"
                        >
                          {IDENTITIES.map((id) => (
                            <option key={id.value} value={id.value}>{id.emoji} {id.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-muted-foreground font-medium block mb-1">Função</label>
                        <input
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="w-full text-xs bg-muted/30 rounded-xl px-3 py-2.5 text-foreground border-0 outline-none"
                        />
                      </div>
                    </div>

                    {/* Skills preview */}
                    <div className="bg-muted/10 rounded-xl p-3">
                      <span className="text-[10px] font-medium text-muted-foreground">Skills iniciais (do template):</span>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {ROLE_TEMPLATES[selectedTemplate].skills.map((s) => (
                          <span key={s} className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>

                    <button
                      disabled={!newName.trim()}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Criar Agente
                    </button>
                    <p className="text-[9px] text-muted-foreground text-center">
                      ⚠️ Para persistir agentes, conecte ao Lovable Cloud
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
