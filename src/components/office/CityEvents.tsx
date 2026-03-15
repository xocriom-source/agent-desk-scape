import { useState } from "react";
import { X, Calendar, MapPin, Users2, Clock, Flame, Music, Code, Palette, Trophy, Megaphone, Star, Sparkles, ArrowRight } from "lucide-react";
import type { Agent } from "@/types/agent";

interface CityEvent {
  id: string;
  title: string;
  description: string;
  type: "concert" | "hackathon" | "exhibition" | "market" | "ceremony" | "workshop";
  location: string;
  district: string;
  startTime: string;
  duration: string;
  participants: number;
  maxParticipants: number;
  organizer: string;
  status: "live" | "upcoming" | "ended";
  reward?: string;
  color: string;
}

const EVENT_ICONS = {
  concert: Music,
  hackathon: Code,
  exhibition: Palette,
  market: Megaphone,
  ceremony: Trophy,
  workshop: Sparkles,
};

const EVENTS: CityEvent[] = [
  {
    id: "e1",
    title: "🎵 Noite de Jazz na Praça",
    description: "Show ao vivo com composições originais criadas por agentes músicos. Público pode votar na melhor performance.",
    type: "concert",
    location: "Central Plaza",
    district: "Centro",
    startTime: "Agora",
    duration: "2h",
    participants: 24,
    maxParticipants: 50,
    organizer: "DJ Synth (NPC)",
    status: "live",
    reward: "+15 Reputação",
    color: "hsl(330 80% 60%)",
  },
  {
    id: "e2",
    title: "💻 Hackathon: Automação Criativa",
    description: "48h de desenvolvimento colaborativo. Equipes de agentes competem para criar a melhor automação. Prêmio: upgrade de prédio.",
    type: "hackathon",
    location: "Coding Lab",
    district: "Innovation",
    startTime: "Em 2h",
    duration: "48h",
    participants: 12,
    maxParticipants: 30,
    organizer: "Atlas (NPC Mentor)",
    status: "upcoming",
    reward: "Upgrade de Andar",
    color: "hsl(160 84% 39%)",
  },
  {
    id: "e3",
    title: "🎨 Exposição: Arte Emergente",
    description: "Galeria aberta com pixel art e criações visuais dos agentes artistas. Curadoria por IA com votação popular.",
    type: "exhibition",
    location: "Pixel Art Studio",
    district: "Creative",
    startTime: "Amanhã 14h",
    duration: "6h",
    participants: 8,
    maxParticipants: 20,
    organizer: "Muse (NPC)",
    status: "upcoming",
    reward: "+10 Reputação",
    color: "hsl(30 90% 60%)",
  },
  {
    id: "e4",
    title: "🏪 Feira de Talentos",
    description: "Marketplace especial onde prédios mostram seus melhores agentes para contratação temporária. Networking entre donos de prédios.",
    type: "market",
    location: "Marketplace",
    district: "Commerce",
    startTime: "Sexta 18h",
    duration: "4h",
    participants: 15,
    maxParticipants: 40,
    organizer: "Axiom (NPC Estrategista)",
    status: "upcoming",
    reward: "Desconto 20% Hiring",
    color: "hsl(45 80% 50%)",
  },
  {
    id: "e5",
    title: "🏆 Cerimônia: Top Criadores",
    description: "Premiação mensal dos agentes mais produtivos e criativos da cidade. Categorias: música, código, arte e pesquisa.",
    type: "ceremony",
    location: "Central Plaza",
    district: "Centro",
    startTime: "Domingo 20h",
    duration: "1h30",
    participants: 0,
    maxParticipants: 100,
    organizer: "Prefeito IA",
    status: "upcoming",
    reward: "Badge Exclusiva",
    color: "hsl(262 83% 76%)",
  },
  {
    id: "e6",
    title: "🔧 Workshop: Identidade de Agente",
    description: "Sessão guiada sobre como evoluir a identidade dos seus agentes. Dicas de NPCs veteranos sobre treinamento.",
    type: "workshop",
    location: "Café Filosófico",
    district: "Social",
    startTime: "Ontem",
    duration: "1h",
    participants: 18,
    maxParticipants: 18,
    organizer: "Kaori (NPC Barista)",
    status: "ended",
    color: "hsl(187 92% 41%)",
  },
];

interface CityEventsProps {
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
}

export function CityEvents({ agents, isOpen, onClose }: CityEventsProps) {
  const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "ended">("all");
  const [selectedEvent, setSelectedEvent] = useState<CityEvent | null>(null);

  if (!isOpen) return null;

  const filtered = filter === "all" ? EVENTS : EVENTS.filter(e => e.status === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-foreground text-lg">Eventos da Cidade</h2>
              <p className="text-xs text-muted-foreground">Shows, hackathons, exposições e mais</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-1 rounded-full">
              <Flame className="w-3 h-3" />
              {EVENTS.filter(e => e.status === "live").length} ao vivo
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-4 border-b border-border">
          {(["all", "live", "upcoming", "ended"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "Todos" : f === "live" ? "🔴 Ao Vivo" : f === "upcoming" ? "📅 Próximos" : "✅ Encerrados"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedEvent ? (
            <div className="space-y-4">
              <button onClick={() => setSelectedEvent(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                ← Voltar aos eventos
              </button>

              <div className="bg-muted/30 rounded-2xl p-6 border border-border">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${selectedEvent.color}20` }}>
                    {(() => { const Icon = EVENT_ICONS[selectedEvent.type]; return <Icon className="w-7 h-7" style={{ color: selectedEvent.color }} />; })()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-foreground text-xl">{selectedEvent.title}</h3>
                      {selectedEvent.status === "live" && (
                        <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full animate-pulse">AO VIVO</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedEvent.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-card rounded-xl p-3 border border-border">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] mb-1"><MapPin className="w-3 h-3" />Local</div>
                    <div className="text-sm font-medium text-foreground">{selectedEvent.location}</div>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-border">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] mb-1"><Clock className="w-3 h-3" />Início</div>
                    <div className="text-sm font-medium text-foreground">{selectedEvent.startTime}</div>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-border">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] mb-1"><Users2 className="w-3 h-3" />Participantes</div>
                    <div className="text-sm font-medium text-foreground">{selectedEvent.participants}/{selectedEvent.maxParticipants}</div>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-border">
                    <div className="flex items-center gap-1 text-muted-foreground text-[10px] mb-1"><Star className="w-3 h-3" />Recompensa</div>
                    <div className="text-sm font-medium text-foreground">{selectedEvent.reward || "—"}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Organizado por <strong className="text-foreground">{selectedEvent.organizer}</strong> · Distrito {selectedEvent.district}
                  </div>
                  {selectedEvent.status !== "ended" && (
                    <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                      {selectedEvent.status === "live" ? "Participar agora" : "Inscrever agentes"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Participants preview */}
              <div className="bg-muted/20 rounded-xl p-4 border border-border">
                <h4 className="font-display font-semibold text-foreground text-sm mb-3">Participantes ({selectedEvent.participants})</h4>
                <div className="flex flex-wrap gap-2">
                  {agents.slice(0, Math.min(selectedEvent.participants, 8)).map(a => (
                    <div key={a.id} className="flex items-center gap-1.5 bg-card rounded-lg px-2 py-1 border border-border">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                      <span className="text-[10px] font-medium text-foreground">{a.name}</span>
                    </div>
                  ))}
                  {selectedEvent.participants > 8 && (
                    <div className="flex items-center text-[10px] text-muted-foreground px-2 py-1">
                      +{selectedEvent.participants - 8} mais
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map(event => {
                const Icon = EVENT_ICONS[event.type];
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="bg-muted/20 hover:bg-muted/40 rounded-xl p-4 border border-border cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${event.color}15` }}>
                        <Icon className="w-5 h-5" style={{ color: event.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-display font-semibold text-foreground text-sm truncate">{event.title}</h4>
                          {event.status === "live" && (
                            <span className="text-[9px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full animate-pulse shrink-0">LIVE</span>
                          )}
                          {event.status === "ended" && (
                            <span className="text-[9px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">Encerrado</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-medium text-foreground">{event.startTime}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                          <MapPin className="w-2.5 h-2.5" />{event.location}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                          <Users2 className="w-2.5 h-2.5" />{event.participants}/{event.maxParticipants}
                        </div>
                      </div>
                    </div>
                    {event.reward && (
                      <div className="mt-2 flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-[10px] font-medium text-yellow-600 dark:text-yellow-400">{event.reward}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
