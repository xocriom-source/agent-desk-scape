import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Calendar, MoreVertical, Globe, Star, Trash2 } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/LoadingState";
import { SEOHead } from "@/components/SEOHead";
import { fetchUserBuildings, type BuildingSummary } from "@/services/buildingService";
import logoOriginal from "@/assets/logo-original.svg";

const TYPE_EMOJIS: Record<string, string> = {
  corporate: "🏢", studio: "🎨", research: "🔬", hub: "🤝",
};

const TYPE_COLORS: Record<string, string> = {
  corporate: "#3b82f6", studio: "#ec4899", research: "#8b5cf6", hub: "#f59e0b",
};

export default function Spaces() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [buildings, setBuildings] = useState<BuildingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"recent" | "created">("recent");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchUserBuildings(user.id).then(data => {
      setBuildings(data);
      setLoading(false);
    });
  }, [user]);

  const userName = profile?.display_name || "Usuário";

  const handleEnterSpace = (b: BuildingSummary) => {
    navigate("/lobby");
  };

  const handleDeleteSpace = async (id: string) => {
    if (buildings.length <= 1) return;
    const confirmed = window.confirm("Tem certeza que deseja excluir este espaço? Esta ação não pode ser desfeita.");
    if (!confirmed) {
      setMenuOpen(null);
      return;
    }
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.from("city_buildings").delete().eq("id", id).eq("owner_id", user!.id);
      if (error) throw error;
      setBuildings(prev => prev.filter(s => s.id !== id));
      const { toast } = await import("sonner");
      toast.success("Espaço excluído com sucesso");
    } catch (err) {
      const { toast } = await import("sonner");
      toast.error("Erro ao excluir espaço");
      console.error("[Spaces:deleteSpace]", err);
    }
    setMenuOpen(null);
  };

  const filteredSpaces = buildings.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Espaços" description="Gerencie todos os seus espaços virtuais no The Good City." path="/spaces" />
      {/* Top nav */}
      <nav className="border-b border-border/30 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <img src={logoOriginal} alt="Logo" className="w-9 h-9" />
              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
                <Calendar className="w-4 h-4" /> Eventos
              </button>
              <button className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                <Star className="w-4 h-4" /> Meus Espaços
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-foreground text-sm font-medium hidden sm:block">{userName}</span>
              </div>
              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
                <Globe className="w-4 h-4" /> Português
              </button>
              <button
                onClick={() => navigate("/onboarding?mode=new")}
                className="flex items-center gap-2 border border-primary text-primary hover:bg-primary/10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Criar Espaço
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-end gap-4 mb-8">
          <div className="flex bg-card rounded-full p-1">
            <button
              onClick={() => setFilter("recent")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === "recent" ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Visita mais recente
            </button>
            <button
              onClick={() => setFilter("created")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === "created" ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Espaços criados
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" placeholder="Pesquisar" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-card border border-border/30 rounded-full text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
            />
          </div>
        </div>

        {/* Spaces grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-2xl border border-border/30 bg-card overflow-hidden">
                  <div className="h-36 bg-muted animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="w-3/4 h-5 rounded bg-muted animate-pulse" />
                    <div className="w-1/2 h-3 rounded bg-muted animate-pulse" />
                    <div className="flex gap-2">
                      <div className="w-16 h-6 rounded-full bg-muted animate-pulse" />
                      <div className="w-16 h-6 rounded-full bg-muted animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {filteredSpaces.length === 0 && !loading && (
                <div className="col-span-full">
                  <EmptyState
                    title="Nenhum espaço encontrado"
                    description={search ? "Tente outra busca" : "Crie seu primeiro espaço para começar"}
                    action={
                      !search ? (
                        <button onClick={() => navigate("/onboarding")} className="text-xs text-primary font-medium">
                          Criar espaço →
                        </button>
                      ) : undefined
                    }
                  />
                </div>
              )}

              {filteredSpaces.map((space, i) => (
                <motion.div
                  key={space.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="group"
                >
                  <div
                    onClick={() => handleEnterSpace(space)}
                    className="relative rounded-xl overflow-hidden border-2 border-primary/30 hover:border-primary/60 transition-all aspect-[4/3] cursor-pointer"
                    style={{ background: `linear-gradient(135deg, ${space.primary_color || "#3b82f6"}22, ${space.primary_color || "#3b82f6"}44)` }}
                  >
                    <div className="absolute inset-0 p-3">
                      <div className="grid grid-cols-4 grid-rows-3 gap-1 h-full">
                        {Array.from({ length: 12 }).map((_, j) => (
                          <div
                            key={j}
                            className="rounded-sm"
                            style={{
                              backgroundColor: j < 8
                                ? `hsl(${(j * 40 + 180) % 360}, 30%, ${25 + j * 3}%)`
                                : "transparent",
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-full px-2 py-0.5">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      <span className="text-[10px] text-white font-medium">{space.floors}F</span>
                    </div>

                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-foreground font-medium text-sm bg-black/50 px-3 py-1.5 rounded-lg">Entrar</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 px-1">
                    <div>
                      <h3 className="text-foreground font-medium text-sm">
                        {TYPE_EMOJIS[space.style] || "🏢"} {space.name}
                      </h3>
                      <p className="text-muted-foreground text-xs">{space.city || "Sem cidade"}</p>
                    </div>
                    <div className="flex items-center gap-2 relative">
                      <span className="text-muted-foreground text-xs">
                        {new Date(space.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === space.id ? null : space.id); }}
                        className="p-1 rounded hover:bg-foreground/10 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {menuOpen === space.id && (
                        <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
                          <button
                            onClick={e => { e.stopPropagation(); handleEnterSpace(space); }}
                            className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                          >
                            Entrar
                          </button>
                          {buildings.length > 1 && (
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteSpace(space.id); }}
                              className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" /> Excluir
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Create new */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: filteredSpaces.length * 0.08 }}
                onClick={() => navigate("/onboarding?mode=new")}
                className="cursor-pointer group"
              >
                <div className="rounded-xl border-2 border-dashed border-border/40 hover:border-primary/50 transition-all aspect-[4/3] flex flex-col items-center justify-center gap-3 bg-card/50 hover:bg-card/80">
                  <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm group-hover:text-foreground transition-colors">Criar novo espaço</span>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
