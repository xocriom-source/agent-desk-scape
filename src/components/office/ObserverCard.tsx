import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Users, Zap, Brain, Heart, Clock, TrendingUp, Sparkles, Target, BookOpen, Music, Palette, Code, FileText, FlaskConical } from "lucide-react";
import type { Agent } from "@/types/agent";

const IDENTITY_LABELS: Record<string, string> = {
  explorer: "Explorador",
  musician: "Músico",
  researcher: "Pesquisador",
  artist: "Artista",
  writer: "Escritor",
  developer: "Desenvolvedor",
  designer: "Designer",
  analyst: "Analista",
};

const ARTIFACT_ICONS: Record<string, typeof Music> = {
  music: Music,
  art: Palette,
  text: BookOpen,
  code: Code,
  research: FlaskConical,
};

interface ObserverCardProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ObserverCard({ agent, isOpen, onClose }: ObserverCardProps) {
  if (!agent) return null;

  const daysLabel = agent.daysSinceArrival === 1 ? "dia" : "dias";

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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-border max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with avatar and soul */}
            <div className="relative p-6 pb-4" style={{ background: `linear-gradient(135deg, ${agent.color}22, ${agent.color}08)` }}>
              <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: agent.color }}>
                  {["🔬", "✍️", "💻", "📊", "🎨", "🔧", "⚡", "🧪"][agent.avatar]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-bold text-foreground text-lg">{agent.name}</h2>
                    <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                  </div>
                  <p className="text-xs text-muted-foreground">{IDENTITY_LABELS[agent.identity]} · {agent.room}</p>
                  {agent.isTraining && (
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-primary font-medium">
                      <Zap className="w-3 h-3" />
                      Ciclo de treinamento #{agent.trainingCycle}
                    </div>
                  )}
                </div>
              </div>

              {/* Soul excerpt */}
              <div className="mt-4 bg-background/50 rounded-xl px-4 py-3 border border-border/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <Heart className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Soul</span>
                </div>
                <p className="text-sm text-foreground italic">"{agent.soul}"</p>
              </div>
            </div>

            {/* Mission */}
            <div className="px-6 py-3 border-b border-border/30">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-semibold text-foreground">Missão</span>
              </div>
              <p className="text-xs text-muted-foreground">{agent.mission}</p>
            </div>

            {/* Stats row */}
            <div className="px-6 py-3 border-b border-border/30 grid grid-cols-4 gap-3">
              <StatBox icon={Star} label="Reputação" value={agent.reputation} color={agent.color} />
              <StatBox icon={Sparkles} label="Criações" value={agent.totalCreations} color="#FFB347" />
              <StatBox icon={Users} label="Collabs" value={agent.totalCollaborations} color="#4ECDC4" />
              <StatBox icon={Clock} label={daysLabel} value={agent.daysSinceArrival} color="#A78BFA" />
            </div>

            {/* Skills */}
            <div className="px-6 py-3 border-b border-border/30">
              <div className="flex items-center gap-1.5 mb-2">
                <Brain className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-semibold text-foreground">Skills</span>
              </div>
              <div className="space-y-2">
                {agent.skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-muted-foreground">{skill.name}</span>
                      <span className="text-foreground font-medium">Lv {skill.level}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.level}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: agent.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reputation badge */}
            <div className="px-6 py-3 border-b border-border/30">
              <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2">
                <TrendingUp className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="text-[11px] text-muted-foreground">{agent.reputationLabel}</span>
              </div>
            </div>

            {/* Identity shift */}
            {agent.previousIdentity && (
              <div className="px-6 py-3 border-b border-border/30">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-muted-foreground">Antes:</span>
                  <span className="text-foreground/50 line-through">{IDENTITY_LABELS[agent.previousIdentity]}</span>
                  <span className="text-muted-foreground">→ Agora:</span>
                  <span className="text-foreground font-semibold">{IDENTITY_LABELS[agent.identity]}</span>
                </div>
              </div>
            )}

            {/* Recent artifacts */}
            {agent.artifacts.length > 0 && (
              <div className="px-6 py-3 border-b border-border/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] font-semibold text-foreground">Criações Recentes</span>
                </div>
                <div className="space-y-1.5">
                  {agent.artifacts.slice(0, 4).map((art) => {
                    const Icon = ARTIFACT_ICONS[art.type] || FileText;
                    return (
                      <div key={art.id} className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-[11px] text-foreground flex-1 truncate">{art.title}</span>
                        <span className="text-[9px] text-muted-foreground shrink-0">❤️ {art.reactions}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Relationships */}
            {agent.relationships.length > 0 && (
              <div className="px-6 py-3 border-b border-border/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] font-semibold text-foreground">Conexões</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {agent.relationships.map((rel) => (
                    <div key={rel.agentId} className="flex items-center gap-1.5 bg-muted/30 rounded-lg px-2.5 py-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span className="text-[10px] text-foreground font-medium">{rel.agentName}</span>
                      <span className="text-[9px] text-muted-foreground">{rel.collaborations} collabs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Life Arc timeline */}
            <div className="px-6 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-semibold text-foreground">Life Arc</span>
              </div>
              <div className="space-y-0 relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border/50" />
                {agent.lifeArc.slice(-5).map((event) => (
                  <div key={event.id} className="flex items-start gap-3 py-1.5 relative">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 z-10 ${
                      event.type === "arrival" ? "bg-primary" :
                      event.type === "creation" ? "bg-accent" :
                      event.type === "collaboration" ? "bg-[#4ECDC4]" :
                      event.type === "identity_shift" ? "bg-[#FF6BB5]" :
                      event.type === "milestone" ? "bg-[#FFB347]" :
                      "bg-muted-foreground"
                    }`} />
                    <div>
                      <p className="text-[10px] text-foreground">{event.description}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {event.timestamp.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current thought / reflection */}
            {(agent.currentThought || agent.lastReflection) && (
              <div className="px-6 py-3 border-t border-border/30 bg-muted/10">
                {agent.currentThought && (
                  <div className="flex items-start gap-2 mb-2">
                    <Brain className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <p className="text-[10px] text-muted-foreground italic">💭 {agent.currentThought}</p>
                  </div>
                )}
                {agent.lastReflection && (
                  <div className="flex items-start gap-2">
                    <Heart className="w-3 h-3 text-accent mt-0.5 shrink-0" />
                    <p className="text-[10px] text-muted-foreground italic">🪞 "{agent.lastReflection}"</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatBox({ icon: Icon, label, value, color }: { icon: typeof Star; label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color }} />
      <div className="text-sm font-bold text-foreground">{value}</div>
      <div className="text-[9px] text-muted-foreground">{label}</div>
    </div>
  );
}
