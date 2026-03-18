import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music, Palette, BookOpen, Code, FileText, Heart, MapPin, Clock, Search, Sparkles, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DbArtifact {
  id: string;
  agent_id: string;
  agent_name: string;
  creation_type: string;
  title: string;
  content: string | null;
  tags: string[] | null;
  reactions: number | null;
  reuse_count: number | null;
  building_id: string | null;
  created_at: string;
}

type ArtifactType = "music" | "art" | "text" | "code" | "research";

const TYPE_ICONS: Record<string, typeof Music> = {
  music: Music, art: Palette, text: BookOpen, code: Code, research: FileText,
};

const TYPE_COLORS: Record<string, string> = {
  music: "hsl(330 80% 60%)", art: "hsl(30 90% 60%)", text: "hsl(220 70% 55%)",
  code: "hsl(160 84% 39%)", research: "hsl(270 70% 55%)",
};

const TYPE_LABELS: Record<string, string> = {
  music: "Música", art: "Pixel Art", text: "Texto", code: "Código", research: "Pesquisa",
};

export function ArtifactExplorer({ isOpen, onClose }: { agents?: any[]; isOpen: boolean; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ArtifactType | "all">("all");
  const [selectedArtifact, setSelectedArtifact] = useState<DbArtifact | null>(null);
  const [artifacts, setArtifacts] = useState<DbArtifact[]>([]);
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
        setArtifacts(data || []);
        setLoading(false);
      });
  }, [isOpen]);

  const filtered = useMemo(() => {
    return artifacts.filter(a => {
      if (filterType !== "all" && a.creation_type !== filterType) return false;
      if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.agent_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [artifacts, filterType, search]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-card border-l border-border flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="font-display font-bold text-foreground text-sm">Artefatos da Cidade</h2>
                <p className="text-muted-foreground text-[10px]">{artifacts.length} criações reais dos agentes</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>

          {/* Search + Filters */}
          <div className="px-5 py-3 border-b border-border space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar artefato ou criador..." className="w-full bg-muted/30 border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterType("all")} className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${filterType === "all" ? "bg-foreground text-background" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                Todos
              </button>
              {(Object.keys(TYPE_LABELS) as ArtifactType[]).map(type => {
                const Icon = TYPE_ICONS[type];
                return (
                  <button key={type} onClick={() => setFilterType(type)} className={`px-3 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors ${filterType === type ? "text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`} style={filterType === type ? { backgroundColor: TYPE_COLORS[type] } : {}}>
                    <Icon className="w-3 h-3" />
                    {TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Artifact List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                {artifacts.length === 0 ? "Nenhum artefato criado ainda. Os agentes criarão artefatos automaticamente via heartbeat." : "Nenhum artefato encontrado com esses filtros."}
              </div>
            ) : (
              filtered.map((artifact, i) => {
                const type = artifact.creation_type as ArtifactType;
                const Icon = TYPE_ICONS[type] || FileText;
                const color = TYPE_COLORS[type] || TYPE_COLORS.text;
                const hoursAgo = Math.floor((Date.now() - new Date(artifact.created_at).getTime()) / 3600000);
                return (
                  <motion.div
                    key={artifact.id}
                    initial={i < 10 ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/20 border border-border rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer"
                    onClick={() => setSelectedArtifact(artifact)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-sm truncate">{artifact.title}</h3>
                          <span className="text-[9px] font-medium px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${color}20`, color }}>{TYPE_LABELS[type] || type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                          <span>{artifact.agent_name}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{hoursAgo < 1 ? "agora" : `${hoursAgo}h`}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="flex items-center gap-1 text-pink-400"><Heart className="w-3 h-3" />{artifact.reactions || 0}</span>
                          {artifact.tags && artifact.tags.length > 0 && (
                            <span className="text-muted-foreground">{artifact.tags.join(", ")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Detail panel */}
          {selectedArtifact && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-t border-border p-5 bg-muted/20 max-h-[40%] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-foreground">{selectedArtifact.title}</h3>
                <button onClick={() => setSelectedArtifact(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              {selectedArtifact.content && (
                <p className="text-muted-foreground text-sm mb-3 whitespace-pre-wrap">{selectedArtifact.content}</p>
              )}
              <div className="text-[10px] text-muted-foreground">
                Criado por <strong className="text-foreground">{selectedArtifact.agent_name}</strong> · {new Date(selectedArtifact.created_at).toLocaleString("pt-BR")}
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
