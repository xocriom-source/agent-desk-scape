import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Star, Code, Users, Zap, ChevronLeft, ChevronRight } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  name: string;
  handle: string;
  category: string;
  score: number;
  avatar?: string;
}

const DEVELOPER_TABS = ["CONTRIBUIDORES", "ESTRELAS", "ARQUITETOS", "REALIZADORES", "RECRUTADORES", "XP"];
const GAME_TABS = ["VOO", "SPEEDRUN", "DIÁRIAS", "DROPS"];
const TIME_FILTERS = ["HOJE", "ESTA SEMANA", "TODOS"];

const MOCK_DEVELOPERS: LeaderboardEntry[] = [
  { rank: 1, name: "André Silva", handle: "@andresilva", category: "TypeScript", score: 30267669 },
  { rank: 2, name: "Maria Santos", handle: "@mariasantos", category: "Python", score: 12726495 },
  { rank: 3, name: "Carlos Lima", handle: "@carloslima", category: "Rust", score: 3003229 },
  { rank: 4, name: "Julia Costa", handle: "@juliacosta", category: "Go", score: 2227759 },
  { rank: 5, name: "Pedro Mendes", handle: "@pedromendes", category: "Java", score: 2064413 },
  { rank: 6, name: "Ana Ferreira", handle: "@anaferreira", category: "TypeScript", score: 1912506 },
  { rank: 7, name: "Lucas Oliveira", handle: "@lucasoliveira", category: "JavaScript", score: 1785225 },
  { rank: 8, name: "Beatriz Rocha", handle: "@beatrizrocha", category: "C#", score: 1422604 },
  { rank: 9, name: "Rafael Souza", handle: "@rafaelsouza", category: "Kotlin", score: 1013234 },
  { rank: 10, name: "Camila Alves", handle: "@camilaalves", category: "Swift", score: 876543 },
];

const MOCK_GAME: LeaderboardEntry[] = [
  { rank: 1, name: "SkyPilot42", handle: "@skypilot42", category: "40/40", score: 240 },
  { rank: 2, name: "NeonRunner", handle: "@neonrunner", category: "40/40", score: 138 },
  { rank: 3, name: "CodeFlyer", handle: "@codeflyer", category: "40/40", score: 134 },
  { rank: 4, name: "PixelDash", handle: "@pixeldash", category: "40/40", score: 127 },
  { rank: 5, name: "ByteStorm", handle: "@bytestorm", category: "39/40", score: 126 },
  { rank: 6, name: "TurboNode", handle: "@turbonode", category: "40/40", score: 120 },
];

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  if (n >= 1000) return n.toLocaleString();
  return `${n} PX`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CityLeaderboard({ isOpen, onClose }: Props) {
  const [mainTab, setMainTab] = useState<"developers" | "game">("developers");
  const [devTab, setDevTab] = useState(0);
  const [gameTab, setGameTab] = useState(0);
  const [timeFilter, setTimeFilter] = useState(0);

  const entries = mainTab === "developers" ? MOCK_DEVELOPERS : MOCK_GAME;
  const tabs = mainTab === "developers" ? DEVELOPER_TABS : GAME_TABS;
  const activeTab = mainTab === "developers" ? devTab : gameTab;
  const setActiveTab = mainTab === "developers" ? setDevTab : setGameTab;

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
            className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-[#2A2A20] bg-[#0D0E0A] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-8 pb-4 text-center">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h1 className="text-4xl font-black tracking-wider text-white" style={{ fontFamily: "monospace" }}>
                LEADER<span className="text-[#C8D880]">BOARD</span>
              </h1>
              <p className="text-xs text-gray-500 mt-1 tracking-widest uppercase" style={{ fontFamily: "monospace" }}>
                Top agentes rankeados na cidade
              </p>
            </div>

            {/* Main tabs */}
            <div className="flex justify-center gap-2 px-6 pb-4">
              {(["developers", "game"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMainTab(tab)}
                  className={`px-6 py-2 text-xs font-bold tracking-wider rounded-lg border transition-all ${
                    mainTab === tab
                      ? "bg-white text-black border-white"
                      : "bg-transparent text-gray-400 border-gray-700 hover:border-gray-500"
                  }`}
                  style={{ fontFamily: "monospace" }}
                >
                  {tab === "developers" ? "AGENTES" : "JOGO"}
                </button>
              ))}
            </div>

            {/* Sub tabs */}
            <div className="flex justify-center gap-2 px-6 pb-2 flex-wrap">
              {tabs.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className={`px-4 py-1.5 text-[10px] font-bold tracking-wider rounded-md border transition-all ${
                    activeTab === i
                      ? "bg-[#C8D880]/10 text-[#C8D880] border-[#C8D880]"
                      : "bg-transparent text-gray-500 border-gray-800 hover:border-gray-600"
                  }`}
                  style={{ fontFamily: "monospace" }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Time filter (game tab) */}
            {mainTab === "game" && (
              <div className="flex justify-center gap-4 px-6 py-2">
                {TIME_FILTERS.map((f, i) => (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(i)}
                    className={`text-[10px] font-bold tracking-wider transition-colors ${
                      timeFilter === i ? "text-[#C8D880]" : "text-gray-500 hover:text-gray-300"
                    }`}
                    style={{ fontFamily: "monospace" }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}

            {mainTab === "game" && (
              <div className="px-6 py-2">
                <div className="flex items-center justify-center gap-3 text-gray-400 text-xs" style={{ fontFamily: "monospace" }}>
                  <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-white" />
                  <span className="text-white font-bold">MAR 15, 2026</span>
                  <span className="text-[#C8D880] text-[10px]">(HOJE)</span>
                  <ChevronRight className="w-4 h-4 cursor-pointer hover:text-white" />
                </div>
                <p className="text-center text-[10px] text-gray-600 mt-1" style={{ fontFamily: "monospace" }}>
                  MESMO DESAFIO PARA TODOS OS PILOTOS HOJE.
                </p>
                <button className="w-full mt-3 py-3 text-xs font-bold tracking-wider text-black bg-[#C8D880] rounded-lg border-2 border-[#C8D880] hover:bg-[#D8E890] transition-colors"
                  style={{ fontFamily: "monospace" }}
                >
                  ACEITAR O DESAFIO DE HOJE →
                </button>
              </div>
            )}

            {/* Table */}
            <div className="overflow-y-auto max-h-[45vh] px-6 pb-6">
              {/* Table header */}
              <div className="grid grid-cols-[40px_1fr_100px_120px] gap-2 px-3 py-2 text-[10px] text-gray-500 font-bold tracking-wider border-b border-gray-800"
                style={{ fontFamily: "monospace" }}
              >
                <span>#</span>
                <span>{mainTab === "game" ? "PILOTO" : "AGENTE"}</span>
                <span className="text-right">{mainTab === "game" ? "COLETADOS" : "LINGUAGEM"}</span>
                <span className="text-right">{mainTab === "game" ? "PONTOS" : "CONTRIBUIÇÕES"}</span>
              </div>

              {entries.map((entry) => (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: entry.rank * 0.05 }}
                  className="grid grid-cols-[40px_1fr_100px_120px] gap-2 items-center px-3 py-3 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
                >
                  <span className={`text-sm font-bold ${entry.rank <= 3 ? "text-[#C8D880]" : "text-gray-500"}`}
                    style={{ fontFamily: "monospace" }}
                  >
                    {entry.rank}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-sm">
                      {entry.rank <= 3 ? "🏆" : "👤"}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>
                        {entry.name.toUpperCase()}
                      </div>
                      <div className="text-[10px] text-gray-500" style={{ fontFamily: "monospace" }}>
                        {entry.handle}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400" style={{ fontFamily: "monospace" }}>
                    {entry.category}
                  </div>
                  <div className={`text-right text-sm font-bold ${entry.rank <= 3 ? "text-[#C8D880]" : "text-white"}`}
                    style={{ fontFamily: "monospace" }}
                  >
                    {formatNumber(entry.score)}
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
