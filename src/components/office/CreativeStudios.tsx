import { motion, AnimatePresence } from "framer-motion";
import { X, Music, Palette, BookOpen, Code, Zap, PlayCircle, StopCircle, Sparkles } from "lucide-react";
import type { Agent, AgentArtifact } from "@/types/agent";
import { useState, useEffect } from "react";

interface Studio {
  id: string;
  name: string;
  icon: typeof Music;
  color: string;
  roomId: string;
  description: string;
  activeAgents: string[];
  artifactType: AgentArtifact["type"];
  productions: number;
}

const STUDIOS: Studio[] = [
  { id: "music-studio", name: "Music Studio", icon: Music, color: "#FF6BB5", roomId: "game", description: "Composição e produção musical com IA", activeAgents: [], artifactType: "music", productions: 0 },
  { id: "art-studio", name: "Art Studio", icon: Palette, color: "#4ECDC4", roomId: "design", description: "Criação de arte digital, pixel art e ilustrações", activeAgents: [], artifactType: "art", productions: 0 },
  { id: "library", name: "Library & Writing", icon: BookOpen, color: "#A78BFA", roomId: "library", description: "Escrita criativa, pesquisa e documentação", activeAgents: [], artifactType: "text", productions: 0 },
  { id: "workshop", name: "Code Workshop", icon: Code, color: "#10B981", roomId: "server", description: "Desenvolvimento, automação e ferramentas", activeAgents: [], artifactType: "code", productions: 0 },
];

interface CreativeStudiosProps {
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
}

function getAgentsInRoom(agents: Agent[], roomName: string): Agent[] {
  const roomMap: Record<string, string[]> = {
    "game": ["Game Room"],
    "design": ["Design Lab"],
    "library": ["Library"],
    "server": ["Server Room"],
  };
  const names = roomMap[roomName] || [];
  return agents.filter((a) => names.includes(a.room));
}

const CREATION_PROGRESS_MSGS = [
  "Inicializando pipeline criativo...",
  "Analisando referências...",
  "Gerando primeira versão...",
  "Refinando detalhes...",
  "Aplicando estilo único...",
  "Revisão de qualidade...",
  "Finalizando artefato...",
  "✨ Artefato concluído!",
];

export function CreativeStudios({ agents, isOpen, onClose }: CreativeStudiosProps) {
  const [activeStudio, setActiveStudio] = useState<string | null>(null);
  const [creationProgress, setCreationProgress] = useState<Record<string, number>>({});
  const [recentCreations, setRecentCreations] = useState<{ studio: string; agent: string; title: string; time: Date }[]>([]);

  // Simulate creation progress
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCreationProgress((prev) => {
        const next = { ...prev };
        for (const studio of STUDIOS) {
          const inRoom = getAgentsInRoom(agents, studio.roomId);
          if (inRoom.length > 0) {
            const current = next[studio.id] || 0;
            if (current < CREATION_PROGRESS_MSGS.length - 1) {
              next[studio.id] = current + 1;
            } else {
              // Completed - add to recent and reset
              const agent = inRoom[Math.floor(Math.random() * inRoom.length)];
              const titles: Record<string, string[]> = {
                "music-studio": ["Lo-fi Beat: Midnight Code", "Synthwave: Digital Dreams", "Ambient: Server Hum"],
                "art-studio": ["Pixel City Sunset", "Abstract: Neural Pathways", "Portrait: Digital Soul"],
                "library": ["Conto: O Último Deploy", "Poema: Bits e Bytes", "Paper: Agent Cognition"],
                "workshop": ["SDK v3.0", "Auto-Scaler Module", "Data Pipeline v2"],
              };
              const studioTitles = titles[studio.id] || ["Nova Criação"];
              setRecentCreations((r) => [
                { studio: studio.name, agent: agent.name, title: studioTitles[Math.floor(Math.random() * studioTitles.length)], time: new Date() },
                ...r,
              ].slice(0, 10));
              next[studio.id] = 0;
            }
          }
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, agents]);

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
                <div className="w-10 h-10 rounded-xl bg-[#FFB347]/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#FFB347]" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-lg">Estúdios Criativos</h2>
                  <p className="text-[11px] text-muted-foreground">Onde agentes criam artefatos em tempo real</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Studios grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {STUDIOS.map((studio) => {
                  const Icon = studio.icon;
                  const inRoom = getAgentsInRoom(agents, studio.roomId);
                  const progress = creationProgress[studio.id] || 0;
                  const isActive = inRoom.length > 0;
                  
                  return (
                    <motion.div
                      key={studio.id}
                      whileHover={{ scale: 1.01 }}
                      className={`rounded-xl border p-4 transition-all cursor-pointer ${
                        activeStudio === studio.id
                          ? "border-primary/50 bg-primary/5"
                          : "border-border/20 hover:border-border/40"
                      }`}
                      onClick={() => setActiveStudio(activeStudio === studio.id ? null : studio.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${studio.color}15` }}>
                          <Icon className="w-6 h-6" style={{ color: studio.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{studio.name}</h3>
                            {isActive && (
                              <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-medium animate-pulse">
                                ATIVO
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{studio.description}</p>
                          
                          {/* Agents in studio */}
                          <div className="flex items-center gap-1.5 mt-2">
                            {inRoom.length > 0 ? (
                              inRoom.map((a) => (
                                <div
                                  key={a.id}
                                  className="w-6 h-6 rounded-md flex items-center justify-center text-[10px]"
                                  style={{ backgroundColor: a.color }}
                                  title={a.name}
                                >
                                  {["🔬", "✍️", "💻", "📊", "🎨", "🔧", "⚡", "🧪"][a.avatar]}
                                </div>
                              ))
                            ) : (
                              <span className="text-[9px] text-muted-foreground/50">Nenhum agente presente</span>
                            )}
                          </div>

                          {/* Creation progress */}
                          {isActive && progress > 0 && (
                            <div className="mt-2">
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(progress / (CREATION_PROGRESS_MSGS.length - 1)) * 100}%` }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: studio.color }}
                                />
                              </div>
                              <p className="text-[9px] text-muted-foreground mt-1">
                                {CREATION_PROGRESS_MSGS[progress]}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Recent creations */}
              {recentCreations.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#FFB347]" />
                    Criações Recentes dos Estúdios
                  </h3>
                  <div className="space-y-1.5">
                    {recentCreations.map((c, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/10 text-[11px]"
                      >
                        <span className="text-accent">✨</span>
                        <span className="font-medium text-foreground">{c.agent}</span>
                        <span className="text-muted-foreground">criou</span>
                        <span className="text-foreground font-medium truncate">{c.title}</span>
                        <span className="text-muted-foreground/50 ml-auto text-[9px]">
                          {c.time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </motion.div>
                    ))}
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
