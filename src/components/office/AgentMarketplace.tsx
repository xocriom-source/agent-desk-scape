import { motion, AnimatePresence } from "framer-motion";
import { X, Store, Star, ShoppingCart, Tag, TrendingUp, Coins, Award, Users } from "lucide-react";
import type { Agent } from "@/types/agent";
import { useState } from "react";

interface MarketListing {
  id: string;
  agentName: string;
  agentColor: string;
  agentAvatar: number;
  type: "skill" | "artifact" | "service" | "collaboration";
  title: string;
  description: string;
  price: number;
  rating: number;
  buyers: number;
}

function generateListings(agents: Agent[]): MarketListing[] {
  const templates: Omit<MarketListing, "id" | "agentName" | "agentColor" | "agentAvatar">[] = [
    { type: "skill", title: "Análise de Sentimento Avançada", description: "Módulo de NLP treinado para detecção de emoções em texto", price: 150, rating: 4.8, buyers: 12 },
    { type: "artifact", title: "Dashboard Template Premium", description: "Template completo com 15 widgets de visualização", price: 200, rating: 4.9, buyers: 28 },
    { type: "service", title: "Code Review Automatizado", description: "Revisão completa de código com sugestões de melhoria", price: 80, rating: 4.5, buyers: 45 },
    { type: "collaboration", title: "Parceria de Pesquisa", description: "Colaboração de 1 semana em pesquisa de IA", price: 300, rating: 5.0, buyers: 5 },
    { type: "skill", title: "Geração de Pixel Art", description: "Skill de criação de pixel art em diversos estilos", price: 120, rating: 4.7, buyers: 18 },
    { type: "artifact", title: "Lo-fi Beat Pack", description: "10 faixas de lo-fi produzidas por IA para foco", price: 90, rating: 4.6, buyers: 34 },
    { type: "service", title: "Automação de CI/CD", description: "Setup completo de pipeline com monitoramento", price: 250, rating: 4.8, buyers: 15 },
    { type: "artifact", title: "Coleção: Rostos Digitais", description: "Série de 20 retratos digitais únicos", price: 180, rating: 4.9, buyers: 22 },
    { type: "service", title: "Teste E2E Completo", description: "Suíte de testes automatizados para seu projeto", price: 100, rating: 4.4, buyers: 30 },
    { type: "collaboration", title: "Mentoria em IA", description: "3 sessões de mentoria sobre técnicas de IA", price: 350, rating: 5.0, buyers: 8 },
  ];

  return templates.map((t, i) => {
    const agent = agents[i % agents.length];
    return {
      ...t,
      id: `listing-${i}`,
      agentName: agent.name,
      agentColor: agent.color,
      agentAvatar: agent.avatar,
    };
  });
}

const TYPE_CONFIG = {
  skill: { label: "Skill", color: "text-primary", bg: "bg-primary/10", emoji: "🧠" },
  artifact: { label: "Artefato", color: "text-[#FFB347]", bg: "bg-[#FFB347]/10", emoji: "✨" },
  service: { label: "Serviço", color: "text-accent", bg: "bg-accent/10", emoji: "⚙️" },
  collaboration: { label: "Collab", color: "text-[#FF6BB5]", bg: "bg-[#FF6BB5]/10", emoji: "🤝" },
};

interface AgentMarketplaceProps {
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
}

export function AgentMarketplace({ agents, isOpen, onClose }: AgentMarketplaceProps) {
  const [listings] = useState(() => generateListings(agents));
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"price" | "rating" | "popular">("popular");

  const filtered = typeFilter === "all" ? listings : listings.filter((l) => l.type === typeFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price") return a.price - b.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return b.buyers - a.buyers;
  });

  const EMOJIS = ["🔬", "✍️", "💻", "📊", "🎨", "🔧", "⚡", "🧪"];

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
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-lg">Agent Marketplace</h2>
                  <p className="text-[11px] text-muted-foreground">Economia autônoma de agentes</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-border/30 flex items-center gap-3">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${typeFilter === "all" ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                >
                  Todos
                </button>
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setTypeFilter(key)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1 ${typeFilter === key ? `${cfg.bg} ${cfg.color}` : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex gap-1">
                {(["popular", "rating", "price"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-2 py-1 rounded-lg text-[10px] transition-colors ${sortBy === s ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {s === "popular" ? "🔥 Popular" : s === "rating" ? "⭐ Rating" : "💰 Preço"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sorted.map((listing, i) => {
                  const cfg = TYPE_CONFIG[listing.type];
                  return (
                    <motion.div
                      key={listing.id}
                      initial={i < 6 ? { opacity: 0, y: 8 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="rounded-xl border border-border/20 p-4 hover:border-border/40 transition-all group cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: listing.agentColor }}>
                          {EMOJIS[listing.agentAvatar]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                              {cfg.emoji} {cfg.label}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-foreground">{listing.title}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{listing.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] text-muted-foreground">{listing.agentName}</span>
                            <div className="flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 text-[#FFD700]" />
                              <span className="text-[10px] text-foreground font-medium">{listing.rating}</span>
                            </div>
                            <span className="text-[9px] text-muted-foreground">{listing.buyers} compras</span>
                            <div className="ml-auto flex items-center gap-1">
                              <Coins className="w-3 h-3 text-[#FFB347]" />
                              <span className="text-xs font-bold text-foreground">{listing.price}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className="w-full mt-3 py-2 bg-primary/10 text-primary rounded-lg text-[11px] font-medium hover:bg-primary/20 transition-colors opacity-0 group-hover:opacity-100">
                        <ShoppingCart className="w-3 h-3 inline mr-1" />
                        Adquirir
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
