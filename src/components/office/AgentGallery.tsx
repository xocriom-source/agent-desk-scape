import { motion, AnimatePresence } from "framer-motion";
import { X, Music, Palette, BookOpen, Code, FlaskConical, Heart, Grid3X3, List, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const TYPE_CONFIG: Record<string, { icon: typeof Music; label: string; color: string; bg: string }> = {
  music: { icon: Music, label: "Música", color: "text-[#FF6BB5]", bg: "bg-[#FF6BB5]/10" },
  art: { icon: Palette, label: "Arte", color: "text-[#4ECDC4]", bg: "bg-[#4ECDC4]/10" },
  text: { icon: BookOpen, label: "Texto", color: "text-primary", bg: "bg-primary/10" },
  code: { icon: Code, label: "Código", color: "text-accent", bg: "bg-accent/10" },
  research: { icon: FlaskConical, label: "Pesquisa", color: "text-[#FFB347]", bg: "bg-[#FFB347]/10" },
};

interface DbCreation {
  id: string;
  agent_id: string;
  agent_name: string;
  creation_type: string;
  title: string;
  content: string | null;
  tags: string[] | null;
  reactions: number | null;
  created_at: string;
}

const VISUAL_PLACEHOLDERS: Record<string, string[]> = {
  music: ["🎹", "🎸", "🎵", "🎼", "🎧"],
  art: ["🖼️", "🎨", "🖌️", "🪄", "✨"],
  text: ["📖", "✍️", "📝", "📜", "🗒️"],
  code: ["💻", "⚙️", "🔧", "📦", "🛠️"],
  research: ["🔬", "📊", "🧪", "📈", "🔎"],
};

interface AgentGalleryProps {
  agents?: any[];
  isOpen: boolean;
  onClose: () => void;
}

export function AgentGallery({ isOpen, onClose }: AgentGalleryProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [items, setItems] = useState<DbCreation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    supabase
      .from("agent_creations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [isOpen]);

  const filtered = typeFilter === "all" ? items : items.filter(a => a.creation_type === typeFilter);

  const typeCounts = items.reduce<Record<string, number>>((acc, a) => {
    acc[a.creation_type] = (acc[a.creation_type] || 0) + 1;
    return acc;
  }, {});

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
                <div className="w-10 h-10 rounded-xl bg-[#FF6BB5]/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-[#FF6BB5]" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-lg">Galeria de Artefatos</h2>
                  <p className="text-[11px] text-muted-foreground">{items.length} criações reais dos agentes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  {viewMode === "grid" ? <List className="w-4 h-4 text-muted-foreground" /> : <Grid3X3 className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Type filters */}
            <div className="px-6 py-3 border-b border-border/30 flex gap-1.5 overflow-x-auto">
              <button onClick={() => setTypeFilter("all")} className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${typeFilter === "all" ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
                Todos ({items.length})
              </button>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <button key={key} onClick={() => setTypeFilter(key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${typeFilter === key ? `${cfg.bg} ${cfg.color}` : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
                  <cfg.icon className="w-3 h-3" />
                  {cfg.label} ({typeCounts[key] || 0})
                </button>
              ))}
            </div>

            {/* Gallery content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">
                  {items.length === 0 ? "Nenhuma criação ainda. Agentes geram artefatos automaticamente." : "Nenhum artefato nesta categoria."}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filtered.map((item, i) => {
                    const cfg = TYPE_CONFIG[item.creation_type] || TYPE_CONFIG.text;
                    const Icon = cfg.icon;
                    const placeholder = VISUAL_PLACEHOLDERS[item.creation_type]?.[i % 5] || "📄";
                    return (
                      <motion.div
                        key={item.id}
                        initial={i < 8 ? { opacity: 0, scale: 0.9 } : false}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="rounded-xl border border-border/20 overflow-hidden hover:border-border/40 transition-all hover:shadow-lg group cursor-pointer"
                      >
                        <div className="aspect-square flex items-center justify-center text-4xl bg-muted/20">
                          <span className="opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all">{placeholder}</span>
                        </div>
                        <div className="p-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon className={`w-3 h-3 ${cfg.color}`} />
                            <span className={`text-[9px] font-medium ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          <p className="text-[11px] text-foreground font-medium truncate">{item.title}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[9px] text-muted-foreground">{item.agent_name}</span>
                            <div className="flex items-center gap-0.5">
                              <Heart className="w-2.5 h-2.5 text-destructive/50" />
                              <span className="text-[9px] text-muted-foreground">{item.reactions || 0}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filtered.map((item, i) => {
                    const cfg = TYPE_CONFIG[item.creation_type] || TYPE_CONFIG.text;
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={item.id}
                        initial={i < 10 ? { opacity: 0, x: -5 } : false}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors"
                      >
                        <div className={`p-1.5 rounded-lg ${cfg.bg}`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                          <span className="text-[10px] text-muted-foreground">{item.agent_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-destructive/50" />
                          <span className="text-[10px] text-muted-foreground">{item.reactions || 0}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
