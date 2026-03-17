import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Users2, ArrowLeft, Search, Eye, ArrowRight,
  Crown, Star, Home, Landmark, Briefcase, Globe,
  TreePine, Droplets, Lamp, Coffee
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

interface BuildingData {
  id: string;
  ownerName: string;
  type: "corporate" | "studio" | "research" | "hub";
  floors: number;
  agents: number;
  reputation: number;
  x: number;
  y: number;
  color: string;
  isOwn?: boolean;
}

const BUILDING_ICONS = {
  corporate: Building2,
  studio: Home,
  research: Landmark,
  hub: Briefcase,
};

const BUILDING_LABELS = {
  corporate: "Escritório",
  studio: "Studio",
  research: "Laboratório",
  hub: "Hub",
};

const STYLE_TO_TYPE: Record<string, BuildingData["type"]> = {
  corporate: "corporate",
  studio: "studio",
  research: "research",
  hub: "hub",
};

const TYPE_COLORS: Record<string, string> = {
  corporate: "hsl(220 70% 50%)",
  studio: "hsl(330 70% 55%)",
  research: "hsl(270 70% 55%)",
  hub: "hsl(45 80% 50%)",
};

// Plaza elements positioned in the center 4x4 area
const PLAZA_ELEMENTS = [
  { type: "fountain", x: 4.5, y: 4.5, icon: Droplets, label: "Fonte da Praça", color: "hsl(200 80% 55%)" },
  { type: "tree", x: 3.5, y: 3.5, icon: TreePine, label: "Carvalho", color: "hsl(142 60% 40%)" },
  { type: "tree", x: 5.5, y: 3.5, icon: TreePine, label: "Cerejeira", color: "hsl(330 50% 55%)" },
  { type: "tree", x: 3.5, y: 5.5, icon: TreePine, label: "Pinheiro", color: "hsl(142 70% 35%)" },
  { type: "tree", x: 5.5, y: 5.5, icon: TreePine, label: "Bambu", color: "hsl(80 60% 40%)" },
  { type: "bench", x: 4, y: 3.2, icon: Coffee, label: "Banco Norte", color: "hsl(30 40% 45%)" },
  { type: "bench", x: 5, y: 5.8, icon: Coffee, label: "Banco Sul", color: "hsl(30 40% 45%)" },
  { type: "lamp", x: 3.2, y: 4.5, icon: Lamp, label: "Poste Oeste", color: "hsl(45 80% 55%)" },
  { type: "lamp", x: 5.8, y: 4.5, icon: Lamp, label: "Poste Leste", color: "hsl(45 80% 55%)" },
];

export default function CityView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);
  const [dbBuildings, setDbBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBuildings() {
      const { data } = await supabase
        .from("city_buildings")
        .select("id, name, owner_id, style, floors, height, position_x, position_z, primary_color")
        .not("owner_id", "is", null);

      if (data) {
        const gridSize = 10;
        const mapped: BuildingData[] = data.map((b, i) => {
          const type = STYLE_TO_TYPE[b.style] || "corporate";
          // Map DB positions to grid coordinates (0-9)
          const x = Math.abs(Math.round(Number(b.position_x))) % gridSize;
          const y = Math.abs(Math.round(Number(b.position_z))) % gridSize;
          // Skip plaza area (3-6, 3-6) — offset if needed
          let finalX = x;
          let finalY = y;
          if (finalX >= 3 && finalX <= 6 && finalY >= 3 && finalY <= 6) {
            finalX = (finalX + 4) % gridSize;
          }

          return {
            id: b.id,
            ownerName: b.name,
            type,
            floors: b.floors || 3,
            agents: Math.floor(Math.random() * 12) + 1,
            reputation: Math.floor(Math.random() * 100),
            x: finalX,
            y: finalY,
            color: b.primary_color || TYPE_COLORS[type] || "hsl(220 70% 50%)",
            isOwn: b.owner_id === user?.id,
          };
        });
        setDbBuildings(mapped);
      }
      setLoading(false);
    }
    fetchBuildings();
  }, [user?.id]);

  const buildings = dbBuildings;

  const filtered = search
    ? buildings.filter(b => b.ownerName.toLowerCase().includes(search.toLowerCase()))
    : buildings;

  const cellSize = 10;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/world")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img src={logo} alt="" className="w-6 h-6" />
            <span className="font-display font-bold text-foreground">🏙️ Cidade</span>
            <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {buildings.length} prédios
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/city-explore")}
              className="text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/80 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              Explorar 3D
            </button>
            <button
              onClick={() => navigate("/office")}
              className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Meu Prédio
            </button>
          </div>
        </div>
      </div>

      <div className="pt-14 flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar */}
        <div className="w-full lg:w-80 border-r border-border bg-card/50 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar prédio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* Plaza entry */}
            <div className="rounded-xl p-3 bg-primary/10 border border-primary/30 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Droplets className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-xs">🏛️ Praça Central</h4>
                  <p className="text-[10px] text-primary">Ponto de encontro · Eventos ao vivo</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground">Carregando prédios...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">Nenhum prédio encontrado</div>
            ) : (
              filtered.map((b) => {
                const Icon = BUILDING_ICONS[b.type];
                return (
                  <div
                    key={b.id}
                    className={`rounded-xl p-3 cursor-pointer transition-all border ${
                      selectedBuilding?.id === b.id
                        ? "bg-accent border-primary/50"
                        : b.isOwn
                        ? "bg-primary/10 border-primary/30 hover:bg-primary/15"
                        : "bg-card/50 border-border hover:bg-accent/50"
                    }`}
                    onClick={() => setSelectedBuilding(b)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${b.color}20` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: b.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="font-semibold text-foreground text-xs truncate">{b.ownerName}</h4>
                          {b.isOwn && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{BUILDING_LABELS[b.type]} · {b.floors} andares</p>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Users2 className="w-3 h-3" />{b.agents}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main - City Grid with Plaza */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-full max-w-3xl aspect-square">
              {/* Grid bg */}
              <div className="absolute inset-0 rounded-2xl border border-border bg-card/20"
                style={{
                  backgroundImage: `
                    linear-gradient(hsl(var(--border) / 0.3) 1px, transparent 1px),
                    linear-gradient(90deg, hsl(var(--border) / 0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: `${cellSize}% ${cellSize}%`
                }}
              />

              {/* Roads */}
              <div className="absolute inset-0">
                {[2, 7].map(row => (
                  <div key={`hr-${row}`} className="absolute left-0 right-0 h-[1.5%]" style={{ top: `${row * cellSize + cellSize / 2}%`, backgroundColor: "hsl(var(--border) / 0.3)" }} />
                ))}
                {[2, 7].map(col => (
                  <div key={`vr-${col}`} className="absolute top-0 bottom-0 w-[1.5%]" style={{ left: `${col * cellSize + cellSize / 2}%`, backgroundColor: "hsl(var(--border) / 0.3)" }} />
                ))}
              </div>

              {/* ── Central Plaza (4x4 center area) ── */}
              <div
                className="absolute rounded-xl border border-primary/30"
                style={{
                  left: `${3 * cellSize}%`,
                  top: `${3 * cellSize}%`,
                  width: `${4 * cellSize}%`,
                  height: `${4 * cellSize}%`,
                  background: `
                    radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.12) 0%, hsl(var(--primary) / 0.03) 70%, transparent 100%),
                    repeating-conic-gradient(hsl(var(--border) / 0.1) 0% 25%, transparent 0% 50%) 0 0 / 20px 20px
                  `,
                }}
              >
                <div className="absolute top-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-[10px] font-bold text-primary/80 tracking-wider uppercase">🏛️ Praça Central</span>
                </div>

                {PLAZA_ELEMENTS.map((el, i) => {
                  const relX = ((el.x - 3) / 4) * 100;
                  const relY = ((el.y - 3) / 4) * 100;
                  return (
                    <motion.div
                      key={i}
                      className="absolute group cursor-default"
                      style={{ left: `${relX}%`, top: `${relY}%`, transform: "translate(-50%, -50%)" }}
                      whileHover={{ scale: 1.3 }}
                    >
                      <div className="relative flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${el.type === "fountain" ? "animate-pulse" : ""}`}
                          style={{ backgroundColor: `${el.color}30`, boxShadow: el.type === "fountain" ? `0 0 12px ${el.color}40` : "none" }}
                        >
                          <el.icon className="w-3 h-3" style={{ color: el.color }} />
                        </div>
                        <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                          <div className="bg-popover text-popover-foreground text-[8px] font-medium px-1.5 py-0.5 rounded border border-border">{el.label}</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {[0, 1, 2, 3].map(i => (
                  <motion.div
                    key={`npc-${i}`}
                    className="absolute w-2 h-2 rounded-full bg-primary/60"
                    animate={{
                      x: [0, (i % 2 ? 30 : -30), (i % 2 ? -20 : 20), 0],
                      y: [(i % 2 ? -20 : 20), 0, (i % 2 ? 25 : -25), (i % 2 ? -20 : 20)],
                    }}
                    transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "linear" }}
                    style={{ left: `${30 + i * 15}%`, top: `${35 + (i % 3) * 10}%` }}
                  />
                ))}
              </div>

              {/* Buildings on grid */}
              {buildings.map((b) => {
                const Icon = BUILDING_ICONS[b.type];
                const size = Math.min(b.floors * 0.6 + 3, 10);
                return (
                  <motion.div
                    key={b.id}
                    className="absolute cursor-pointer group"
                    style={{
                      left: `${b.x * cellSize + cellSize / 2}%`,
                      top: `${b.y * cellSize + cellSize / 2}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    whileHover={{ scale: 1.3, zIndex: 50 }}
                    onClick={() => setSelectedBuilding(b)}
                  >
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`rounded-lg flex items-center justify-center border-2 ${b.isOwn ? "border-primary shadow-lg shadow-primary/30" : "border-border"}`}
                        style={{
                          width: `${size * 4}px`,
                          height: `${size * 5}px`,
                          backgroundColor: `${b.color}30`,
                        }}
                      >
                        <Icon className="w-4 h-4" style={{ color: b.color }} />
                      </div>
                      {b.isOwn && (
                        <div className="absolute -top-3">
                          <Crown className="w-4 h-4 text-yellow-400 drop-shadow-lg" />
                        </div>
                      )}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        <div className="bg-popover text-popover-foreground text-[9px] font-medium px-2 py-1 rounded-lg border border-border">
                          {b.ownerName} {b.isOwn ? "(Você)" : ""}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Selected building detail */}
          {selectedBuilding && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute bottom-6 right-6 w-72 bg-card border border-border rounded-2xl p-5 shadow-2xl z-40"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${selectedBuilding.color}20` }}>
                  {(() => { const Icon = BUILDING_ICONS[selectedBuilding.type]; return <Icon className="w-5 h-5" style={{ color: selectedBuilding.color }} />; })()}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="font-display font-bold text-foreground text-sm">{selectedBuilding.ownerName}</h3>
                    {selectedBuilding.isOwn && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                  </div>
                  <p className="text-muted-foreground text-[10px]">{BUILDING_LABELS[selectedBuilding.type]} · {selectedBuilding.floors} andares</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-foreground">{selectedBuilding.agents}</div>
                  <div className="text-[9px] text-muted-foreground">Agentes</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-foreground">{selectedBuilding.floors}</div>
                  <div className="text-[9px] text-muted-foreground">Andares</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-foreground flex items-center justify-center gap-0.5">
                    <Star className="w-3 h-3 text-yellow-400" />{selectedBuilding.reputation}
                  </div>
                  <div className="text-[9px] text-muted-foreground">Rep.</div>
                </div>
              </div>

              {selectedBuilding.isOwn ? (
                <button
                  onClick={() => navigate("/office")}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  Entrar no meu prédio
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button className="w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground hover:bg-accent font-medium py-2.5 rounded-xl text-sm transition-colors">
                  <Eye className="w-4 h-4" />
                  Visitar prédio
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
