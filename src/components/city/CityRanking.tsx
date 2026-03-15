import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Building2, Eye, Star, TrendingUp, Users, Flame } from "lucide-react";

interface RankingEntry {
  rank: number;
  name: string;
  owner: string;
  district: string;
  value: number;
  valueLabel: string;
  emoji: string;
}

const TABS = [
  { id: "visited", label: "MAIS VISITADOS", icon: Eye },
  { id: "popular", label: "MAIS POPULARES", icon: TrendingUp },
  { id: "beautiful", label: "MAIS BONITOS", icon: Star },
  { id: "active", label: "MAIS ATIVOS", icon: Flame },
];

const MOCK_DATA: Record<string, RankingEntry[]> = {
  visited: [
    { rank: 1, name: "TechFlow HQ", owner: "André Silva", district: "Tech", value: 2847, valueLabel: "visitas", emoji: "🏢" },
    { rank: 2, name: "Creative Labs", owner: "Maria Santos", district: "Creator", value: 2103, valueLabel: "visitas", emoji: "🎨" },
    { rank: 3, name: "NovaStar Inc", owner: "Carlos Lima", district: "Startup", value: 1856, valueLabel: "visitas", emoji: "🚀" },
    { rank: 4, name: "Digital Agency", owner: "Julia Costa", district: "Agency", value: 1542, valueLabel: "visitas", emoji: "📐" },
    { rank: 5, name: "CloudBase", owner: "Pedro Mendes", district: "Tech", value: 1320, valueLabel: "visitas", emoji: "☁️" },
    { rank: 6, name: "PixelForge", owner: "Ana Ferreira", district: "Creator", value: 1180, valueLabel: "visitas", emoji: "🖼️" },
    { rank: 7, name: "Startup Garage", owner: "Lucas Oliveira", district: "Startup", value: 1045, valueLabel: "visitas", emoji: "🔧" },
    { rank: 8, name: "DataVault", owner: "Beatriz Rocha", district: "Tech", value: 920, valueLabel: "visitas", emoji: "📊" },
    { rank: 9, name: "BrandHouse", owner: "Rafael Souza", district: "Agency", value: 810, valueLabel: "visitas", emoji: "🎯" },
    { rank: 10, name: "InnoLab", owner: "Camila Alves", district: "Startup", value: 745, valueLabel: "visitas", emoji: "💡" },
  ],
  popular: [
    { rank: 1, name: "NovaStar Inc", owner: "Carlos Lima", district: "Startup", value: 4821, valueLabel: "seguidores", emoji: "🚀" },
    { rank: 2, name: "TechFlow HQ", owner: "André Silva", district: "Tech", value: 3950, valueLabel: "seguidores", emoji: "🏢" },
    { rank: 3, name: "Creative Labs", owner: "Maria Santos", district: "Creator", value: 3210, valueLabel: "seguidores", emoji: "🎨" },
    { rank: 4, name: "PixelForge", owner: "Ana Ferreira", district: "Creator", value: 2780, valueLabel: "seguidores", emoji: "🖼️" },
    { rank: 5, name: "CloudBase", owner: "Pedro Mendes", district: "Tech", value: 2450, valueLabel: "seguidores", emoji: "☁️" },
    { rank: 6, name: "Digital Agency", owner: "Julia Costa", district: "Agency", value: 2100, valueLabel: "seguidores", emoji: "📐" },
    { rank: 7, name: "DataVault", owner: "Beatriz Rocha", district: "Tech", value: 1920, valueLabel: "seguidores", emoji: "📊" },
    { rank: 8, name: "BrandHouse", owner: "Rafael Souza", district: "Agency", value: 1650, valueLabel: "seguidores", emoji: "🎯" },
  ],
  beautiful: [
    { rank: 1, name: "Creative Labs", owner: "Maria Santos", district: "Creator", value: 98, valueLabel: "% aprovação", emoji: "🎨" },
    { rank: 2, name: "PixelForge", owner: "Ana Ferreira", district: "Creator", value: 96, valueLabel: "% aprovação", emoji: "🖼️" },
    { rank: 3, name: "NovaStar Inc", owner: "Carlos Lima", district: "Startup", value: 95, valueLabel: "% aprovação", emoji: "🚀" },
    { rank: 4, name: "TechFlow HQ", owner: "André Silva", district: "Tech", value: 93, valueLabel: "% aprovação", emoji: "🏢" },
    { rank: 5, name: "BrandHouse", owner: "Rafael Souza", district: "Agency", value: 91, valueLabel: "% aprovação", emoji: "🎯" },
    { rank: 6, name: "CloudBase", owner: "Pedro Mendes", district: "Tech", value: 89, valueLabel: "% aprovação", emoji: "☁️" },
  ],
  active: [
    { rank: 1, name: "TechFlow HQ", owner: "André Silva", district: "Tech", value: 342, valueLabel: "ações/dia", emoji: "🏢" },
    { rank: 2, name: "NovaStar Inc", owner: "Carlos Lima", district: "Startup", value: 298, valueLabel: "ações/dia", emoji: "🚀" },
    { rank: 3, name: "Digital Agency", owner: "Julia Costa", district: "Agency", value: 256, valueLabel: "ações/dia", emoji: "📐" },
    { rank: 4, name: "CloudBase", owner: "Pedro Mendes", district: "Tech", value: 234, valueLabel: "ações/dia", emoji: "☁️" },
    { rank: 5, name: "Creative Labs", owner: "Maria Santos", district: "Creator", value: 210, valueLabel: "ações/dia", emoji: "🎨" },
    { rank: 6, name: "Startup Garage", owner: "Lucas Oliveira", district: "Startup", value: 189, valueLabel: "ações/dia", emoji: "🔧" },
    { rank: 7, name: "DataVault", owner: "Beatriz Rocha", district: "Tech", value: 167, valueLabel: "ações/dia", emoji: "📊" },
  ],
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CityRanking({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState("visited");
  const entries = MOCK_DATA[tab] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-8 pb-4 text-center">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center justify-center gap-3 mb-2">
                <Trophy className="w-8 h-8 text-amber-400" />
                <h1 className="text-3xl font-black tracking-wider text-white font-mono">
                  RANKING
                </h1>
              </div>
              <p className="text-xs text-gray-500 tracking-widest uppercase font-mono">
                Os melhores prédios da cidade
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 px-6 pb-4 flex-wrap justify-center">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-wider rounded-lg border transition-all font-mono ${
                    tab === t.id
                      ? "bg-amber-400/10 text-amber-400 border-amber-400/50"
                      : "bg-transparent text-gray-500 border-gray-800 hover:border-gray-600 hover:text-gray-300"
                  }`}
                >
                  <t.icon className="w-3 h-3" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Podium (top 3) */}
            {entries.length >= 3 && (
              <div className="flex items-end justify-center gap-4 px-6 pb-4">
                {[entries[1], entries[0], entries[2]].map((e, idx) => {
                  const heights = [80, 100, 64];
                  const medals = ["🥈", "🥇", "🥉"];
                  return (
                    <motion.div
                      key={e.rank}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <span className="text-2xl mb-2">{medals[idx]}</span>
                      <span className="text-lg mb-1">{e.emoji}</span>
                      <div
                        className="w-20 rounded-t-lg flex flex-col items-center justify-end pb-2"
                        style={{
                          height: heights[idx],
                          background: idx === 1
                            ? "linear-gradient(180deg, hsl(45 80% 50% / 0.3), hsl(45 80% 50% / 0.1))"
                            : "linear-gradient(180deg, hsl(220 20% 25% / 0.5), hsl(220 20% 20% / 0.3))",
                          border: idx === 1 ? "1px solid hsl(45 80% 50% / 0.3)" : "1px solid hsl(220 20% 30%)",
                        }}
                      >
                        <span className="text-[9px] font-bold text-white font-mono truncate max-w-[70px]">{e.name}</span>
                        <span className="text-[8px] text-gray-500 font-mono">{e.value.toLocaleString()}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* List */}
            <div className="overflow-y-auto max-h-[40vh] px-6 pb-6">
              {entries.map((entry) => (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: entry.rank * 0.03 }}
                  className="flex items-center gap-3 px-3 py-3 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
                >
                  <span className={`w-6 text-center text-sm font-bold font-mono ${entry.rank <= 3 ? "text-amber-400" : "text-gray-500"}`}>
                    {entry.rank}
                  </span>
                  <span className="text-lg">{entry.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white font-mono truncate">{entry.name}</div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {entry.owner} · {entry.district}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold font-mono ${entry.rank <= 3 ? "text-amber-400" : "text-white"}`}>
                      {entry.value.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-gray-600 font-mono">{entry.valueLabel}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
