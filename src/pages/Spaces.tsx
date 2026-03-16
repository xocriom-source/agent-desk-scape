import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Search, Calendar, MoreVertical, Globe, Star, Trash2 } from "lucide-react";
import logo from "@/assets/logo.png";

interface SpaceData {
  id: string;
  name: string;
  city: string;
  type: string;
  agents: number;
  lastVisit: string;
  color: string;
  emoji: string;
}

const SPACE_STORAGE_KEY = "agentoffice_spaces";

function loadSpaces(): SpaceData[] {
  try {
    const saved = localStorage.getItem(SPACE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  // Default first space
  const defaultSpace: SpaceData = {
    id: "space-" + Date.now(),
    name: localStorage.getItem("buildingName") || "Meu Escritório",
    city: localStorage.getItem("selectedCity") || "São Paulo",
    type: localStorage.getItem("buildingType") || "corporate",
    agents: 8,
    lastVisit: new Date().toLocaleDateString("pt-BR"),
    color: "#4F46E5",
    emoji: "🏢",
  };
  localStorage.setItem(SPACE_STORAGE_KEY, JSON.stringify([defaultSpace]));
  return [defaultSpace];
}

function saveSpaces(spaces: SpaceData[]) {
  localStorage.setItem(SPACE_STORAGE_KEY, JSON.stringify(spaces));
}

const TYPE_EMOJIS: Record<string, string> = {
  corporate: "🏢",
  studio: "🎨",
  research: "🔬",
  hub: "🤝",
};

export default function Spaces() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [spaces, setSpaces] = useState<SpaceData[]>(loadSpaces);
  const [filter, setFilter] = useState<"recent" | "created">("recent");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Listen for new spaces created via onboarding
  useEffect(() => {
    const pending = localStorage.getItem("pendingNewSpace");
    if (pending) {
      try {
        const newSpace: SpaceData = JSON.parse(pending);
        setSpaces(prev => {
          const updated = [newSpace, ...prev];
          saveSpaces(updated);
          return updated;
        });
      } catch {}
      localStorage.removeItem("pendingNewSpace");
    }
  }, []);

  const userName = (() => {
    try {
      const u = localStorage.getItem("agentoffice_user");
      if (u) return JSON.parse(u).name || "Usuário";
    } catch {}
    return "Usuário";
  })();

  const handleEnterSpace = (space: SpaceData) => {
    localStorage.setItem("buildingName", space.name);
    localStorage.setItem("currentSpaceId", space.id);
    // Update last visit
    setSpaces(prev => {
      const updated = prev.map(s =>
        s.id === space.id ? { ...s, lastVisit: "agora" } : s
      );
      saveSpaces(updated);
      return updated;
    });
    navigate("/lobby");
  };

  const handleDeleteSpace = (id: string) => {
    if (spaces.length <= 1) return;
    setSpaces(prev => {
      const updated = prev.filter(s => s.id !== id);
      saveSpaces(updated);
      return updated;
    });
    setMenuOpen(null);
  };

  const filteredSpaces = spaces.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#1A1B2E]">
      {/* Top nav bar */}
      <nav className="border-b border-border/30 bg-[#1E1F33]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <img src={logo} alt="Logo" className="w-9 h-9" />
              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
                <Calendar className="w-4 h-4" />
                Eventos
              </button>
              <button className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                <Star className="w-4 h-4" />
                Meus Espaços
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
                <Globe className="w-4 h-4" />
                Português
              </button>
              <button
                onClick={() => navigate("/onboarding")}
                className="flex items-center gap-2 border border-primary text-primary hover:bg-primary/10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Criar Espaço
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-end gap-4 mb-8">
          <div className="flex bg-[#252640] rounded-full p-1">
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
              type="text"
              placeholder="Pesquisar"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#252640] border border-border/30 rounded-full text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
            />
          </div>
        </div>

        {/* Spaces grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredSpaces.map((space, i) => (
            <motion.div
              key={space.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group"
            >
              {/* Space card thumbnail */}
              <div
                onClick={() => handleEnterSpace(space)}
                className="relative rounded-xl overflow-hidden border-2 border-primary/30 hover:border-primary/60 transition-all aspect-[4/3] cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${space.color}22, ${space.color}44)` }}
              >
                {/* Mini rooms preview */}
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

                {/* Online badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-full px-2 py-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-white font-medium">{space.agents}</span>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-foreground font-medium text-sm bg-black/50 px-3 py-1.5 rounded-lg">Entrar</span>
                </div>
              </div>

              {/* Card info */}
              <div className="flex items-center justify-between mt-2 px-1">
                <div>
                  <h3 className="text-foreground font-medium text-sm">
                    {TYPE_EMOJIS[space.type] || space.emoji} {space.name}
                  </h3>
                  <p className="text-muted-foreground text-xs">{space.city}</p>
                </div>
                <div className="flex items-center gap-2 relative">
                  <span className="text-muted-foreground text-xs">{space.lastVisit}</span>
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
                      {spaces.length > 1 && (
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

          {/* Create new space card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: filteredSpaces.length * 0.08 }}
            onClick={() => navigate("/onboarding")}
            className="cursor-pointer group"
          >
            <div className="rounded-xl border-2 border-dashed border-border/40 hover:border-primary/50 transition-all aspect-[4/3] flex flex-col items-center justify-center gap-3 bg-[#1E1F33]/50 hover:bg-[#252640]/50">
              <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <span className="text-muted-foreground text-sm group-hover:text-foreground transition-colors">Criar novo espaço</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
