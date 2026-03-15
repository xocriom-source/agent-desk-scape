import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Clock, Zap, Star, Trophy, Target } from "lucide-react";

interface Mission {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  total: number;
  completed: boolean;
  category: "explore" | "social" | "build" | "agent";
  emoji: string;
}

const CATEGORY_STYLES = {
  explore: { label: "EXPLORAR", color: "text-blue-400", bg: "bg-blue-400/10" },
  social: { label: "SOCIAL", color: "text-pink-400", bg: "bg-pink-400/10" },
  build: { label: "CONSTRUIR", color: "text-amber-400", bg: "bg-amber-400/10" },
  agent: { label: "AGENTES", color: "text-purple-400", bg: "bg-purple-400/10" },
};

function getDailyMissions(): Mission[] {
  const day = new Date().getDate();
  return [
    { id: "m1", title: "Explorador Urbano", description: "Visite 3 distritos diferentes", reward: 50, progress: 1, total: 3, completed: false, category: "explore", emoji: "🗺️" },
    { id: "m2", title: "Socializar", description: "Envie 5 mensagens no chat da cidade", reward: 30, progress: 2, total: 5, completed: false, category: "social", emoji: "💬" },
    { id: "m3", title: "Construtor", description: "Personalize 1 item do seu prédio", reward: 40, progress: 0, total: 1, completed: false, category: "build", emoji: "🏗️" },
    { id: "m4", title: "Gerente de Agentes", description: "Atribua 2 tarefas aos seus agentes", reward: 60, progress: 1, total: 2, completed: false, category: "agent", emoji: "🤖" },
    { id: "m5", title: "Passeio de Veículo", description: "Percorra 500m em qualquer veículo", reward: 35, progress: 200, total: 500, completed: false, category: "explore", emoji: "🚗" },
    { id: "m6", title: "Primeiro Contato", description: "Visite o prédio de outro jogador", reward: 25, progress: day % 2 === 0 ? 1 : 0, total: 1, completed: day % 2 === 0, category: "social", emoji: "👋" },
  ];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  coins?: number;
}

export function DailyMissions({ isOpen, onClose, coins = 1250 }: Props) {
  const missions = useMemo(() => getDailyMissions(), []);
  const completedCount = missions.filter(m => m.completed).length;
  const totalReward = missions.reduce((s, m) => s + m.reward, 0);
  const earnedReward = missions.filter(m => m.completed).reduce((s, m) => s + m.reward, 0);

  // Hours until reset
  const now = new Date();
  const hoursLeft = 23 - now.getHours();
  const minsLeft = 59 - now.getMinutes();

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
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-[#2A2A20] bg-[#0D0E0A] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-black tracking-wider text-white" style={{ fontFamily: "monospace" }}>
                MISSÕES <span className="text-[#C8D880]">DIÁRIAS</span>
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-900/20 border border-amber-700/30">
                  <span className="text-xs">🪙</span>
                  <span className="text-xs font-bold text-amber-400" style={{ fontFamily: "monospace" }}>{coins.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500" style={{ fontFamily: "monospace" }}>
                  <Clock className="w-3 h-3" />
                  RESET EM {hoursLeft}H {minsLeft}M
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="px-6 pb-4">
              <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-400 tracking-widest font-bold" style={{ fontFamily: "monospace" }}>
                    PROGRESSO DO DIA
                  </span>
                  <span className="text-xs font-bold text-[#C8D880]" style={{ fontFamily: "monospace" }}>
                    {completedCount}/{missions.length}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                  <div
                    className="h-full rounded-full bg-[#C8D880] transition-all"
                    style={{ width: `${(completedCount / missions.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-gray-600" style={{ fontFamily: "monospace" }}>
                  <span>🪙 {earnedReward} ganhas</span>
                  <span>🪙 {totalReward} total possível</span>
                </div>

                {/* Bonus for completing all */}
                {completedCount === missions.length ? (
                  <div className="mt-3 text-center py-2 rounded-lg bg-[#C8D880]/10 border border-[#C8D880]/30">
                    <span className="text-xs font-bold text-[#C8D880]" style={{ fontFamily: "monospace" }}>
                      🎉 TODAS COMPLETAS! BÔNUS: 🪙 100
                    </span>
                  </div>
                ) : (
                  <div className="mt-3 text-center py-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
                    <span className="text-[10px] text-gray-500" style={{ fontFamily: "monospace" }}>
                      COMPLETE TODAS PARA 🪙 100 DE BÔNUS
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Missions List */}
            <div className="px-6 pb-6 space-y-2">
              {missions.map((m, i) => {
                const cat = CATEGORY_STYLES[m.category];
                const pct = Math.min((m.progress / m.total) * 100, 100);
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-xl border p-4 transition-all ${
                      m.completed
                        ? "border-[#C8D880]/30 bg-[#C8D880]/5"
                        : "border-gray-800 bg-gray-900/30 hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{m.emoji}</span>
                        <div>
                          <h3 className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>
                            {m.title.toUpperCase()}
                          </h3>
                          <p className="text-[10px] text-gray-500">{m.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded ${cat.bg} ${cat.color}`}
                          style={{ fontFamily: "monospace" }}
                        >
                          {cat.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-3">
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                          <div
                            className={`h-full rounded-full transition-all ${m.completed ? "bg-[#C8D880]" : "bg-gray-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-gray-600 mt-0.5 block" style={{ fontFamily: "monospace" }}>
                          {m.progress}/{m.total}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {m.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#C8D880]" />
                        ) : (
                          <span className="text-xs font-bold text-amber-400" style={{ fontFamily: "monospace" }}>
                            🪙 {m.reward}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
