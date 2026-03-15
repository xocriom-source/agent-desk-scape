import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Users2, ArrowLeft, Search, Eye, ArrowRight,
  MapPin, Crown, Zap, Star, Home, Landmark, Briefcase, Globe
} from "lucide-react";
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

function generateBuildings(ownName: string): BuildingData[] {
  const names = [
    "TechFlow HQ", "Creative Labs", "DataPro Center", "AI Forge",
    "Neural Works", "ByteShift", "QuantumAI", "Pixel Forge",
    "DeepMind Hub", "CodeNest", "RoboLab", "SynthWave",
    "CloudPeak", "InnoVerse", "CyberDen", "LogicGate",
    "AlphaBot", "MetaCore", "FusionAI", "NexGen",
    "TitanOps", "OmegaLab", "PrimeNode", "ZenithAI",
  ];

  const types: BuildingData["type"][] = ["corporate", "studio", "research", "hub"];
  const colors = [
    "hsl(220 70% 50%)", "hsl(160 70% 45%)", "hsl(350 70% 50%)",
    "hsl(270 70% 55%)", "hsl(30 80% 50%)", "hsl(187 70% 45%)",
    "hsl(142 70% 45%)", "hsl(45 80% 50%)", "hsl(330 60% 55%)",
  ];

  const buildings: BuildingData[] = [];

  // Add own building
  buildings.push({
    id: "own",
    ownerName: ownName,
    type: "corporate",
    floors: 5,
    agents: 6,
    reputation: 75,
    x: 5,
    y: 4,
    color: "hsl(239 84% 67%)",
    isOwn: true,
  });

  // Generate NPC buildings on a grid
  const gridSize = 8;
  let nameIdx = 0;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (row === 4 && col === 5) continue; // skip own building spot
      if (Math.random() > 0.55) continue; // sparse city
      if (nameIdx >= names.length) break;

      buildings.push({
        id: `b-${row}-${col}`,
        ownerName: names[nameIdx],
        type: types[Math.floor(Math.random() * types.length)],
        floors: Math.floor(Math.random() * 15) + 1,
        agents: Math.floor(Math.random() * 12) + 1,
        reputation: Math.floor(Math.random() * 100),
        x: col,
        y: row,
        color: colors[nameIdx % colors.length],
        isOwn: false,
      });
      nameIdx++;
    }
  }

  return buildings;
}

export default function CityView() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingData | null>(null);

  const cityData = useMemo(() => {
    const stored = localStorage.getItem("agentoffice_city");
    return stored ? JSON.parse(stored) : { name: "São Paulo", country: "Brasil", flag: "🇧🇷" };
  }, []);

  const userName = useMemo(() => {
    const stored = localStorage.getItem("agentoffice_user");
    return stored ? JSON.parse(stored).name || "Chefe" : "Chefe";
  }, []);

  const buildings = useMemo(() => generateBuildings(userName), [userName]);

  const filtered = search
    ? buildings.filter(b => b.ownerName.toLowerCase().includes(search.toLowerCase()))
    : buildings;

  const handleEnterBuilding = (b: BuildingData) => {
    if (b.isOwn) {
      navigate("/office");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/world")} className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img src={logo} alt="" className="w-6 h-6" />
            <span className="font-display font-bold text-white">{cityData.flag} {cityData.name}</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              {buildings.length} prédios
            </span>
          </div>
          <button
            onClick={() => navigate("/office")}
            className="text-sm font-medium bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            Meu Prédio
          </button>
        </div>
      </div>

      <div className="pt-14 flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar */}
        <div className="w-full lg:w-80 border-r border-gray-800 bg-gray-900/50 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar prédio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.map((b) => {
              const Icon = BUILDING_ICONS[b.type];
              return (
                <div
                  key={b.id}
                  className={`rounded-xl p-3 cursor-pointer transition-all border ${
                    selectedBuilding?.id === b.id
                      ? "bg-gray-800 border-primary/50"
                      : b.isOwn
                      ? "bg-primary/10 border-primary/30 hover:bg-primary/15"
                      : "bg-gray-900/50 border-gray-800 hover:bg-gray-800/50"
                  }`}
                  onClick={() => setSelectedBuilding(b)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${b.color}20` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: b.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="font-semibold text-white text-xs truncate">{b.ownerName}</h4>
                        {b.isOwn && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-gray-500">{BUILDING_LABELS[b.type]} · {b.floors} andares</p>
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-0.5">
                      <Users2 className="w-3 h-3" />{b.agents}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main - City Grid */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-full max-w-3xl aspect-square">
              {/* Grid bg */}
              <div className="absolute inset-0 rounded-2xl border border-gray-800 bg-gray-900/20"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                  `,
                  backgroundSize: "12.5% 12.5%"
                }}
              />

              {/* Roads */}
              <div className="absolute inset-0">
                {[2, 5].map(row => (
                  <div key={`hr-${row}`} className="absolute left-0 right-0 h-[1.5%]" style={{ top: `${row * 12.5 + 6}%`, backgroundColor: "rgba(255,255,255,0.04)" }} />
                ))}
                {[3, 6].map(col => (
                  <div key={`vr-${col}`} className="absolute top-0 bottom-0 w-[1.5%]" style={{ left: `${col * 12.5 + 6}%`, backgroundColor: "rgba(255,255,255,0.04)" }} />
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
                      left: `${b.x * 12.5 + 6.25}%`,
                      top: `${b.y * 12.5 + 6.25}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    whileHover={{ scale: 1.3, zIndex: 50 }}
                    onClick={() => setSelectedBuilding(b)}
                  >
                    <div className="relative flex flex-col items-center">
                      {/* Building visual */}
                      <div
                        className={`rounded-lg flex items-center justify-center border-2 ${b.isOwn ? "border-primary shadow-lg shadow-primary/30" : "border-gray-700"}`}
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
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        <div className="bg-gray-800 text-white text-[9px] font-medium px-2 py-1 rounded-lg border border-gray-700">
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
              className="absolute bottom-6 right-6 w-72 bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-2xl z-40"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${selectedBuilding.color}20` }}>
                  {(() => { const Icon = BUILDING_ICONS[selectedBuilding.type]; return <Icon className="w-5 h-5" style={{ color: selectedBuilding.color }} />; })()}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="font-display font-bold text-white text-sm">{selectedBuilding.ownerName}</h3>
                    {selectedBuilding.isOwn && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                  </div>
                  <p className="text-gray-500 text-[10px]">{BUILDING_LABELS[selectedBuilding.type]} · {selectedBuilding.floors} andares</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-white">{selectedBuilding.agents}</div>
                  <div className="text-[9px] text-gray-500">Agentes</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-white">{selectedBuilding.floors}</div>
                  <div className="text-[9px] text-gray-500">Andares</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-white flex items-center justify-center gap-0.5">
                    <Star className="w-3 h-3 text-yellow-400" />{selectedBuilding.reputation}
                  </div>
                  <div className="text-[9px] text-gray-500">Rep.</div>
                </div>
              </div>

              {selectedBuilding.isOwn ? (
                <button
                  onClick={() => navigate("/office")}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 font-medium py-2.5 rounded-xl text-sm transition-colors"
                >
                  Entrar no meu prédio
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button className="w-full flex items-center justify-center gap-2 bg-gray-800 text-gray-300 hover:bg-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors">
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
