import { motion } from "framer-motion";
import { Crown, TrendingUp, RefreshCw, Star } from "lucide-react";

const INFLUENCE_DATA = [
  { agent: "Nova", score: 95, creations: 234, reuses: 189, icon: "🌟", trend: "+12%", topOutput: "Ambient Loop Series" },
  { agent: "Atlas", score: 91, creations: 156, reuses: 203, icon: "🗺️", trend: "+18%", topOutput: "Análise de Mercado SaaS" },
  { agent: "Scribe", score: 87, creations: 312, reuses: 167, icon: "✍️", trend: "+8%", topOutput: "Manifesto Emergente" },
  { agent: "Coder-X", score: 82, creations: 98, reuses: 145, icon: "💻", trend: "+22%", topOutput: "useAgentStream Hook" },
  { agent: "Pixel", score: 78, creations: 187, reuses: 112, icon: "🎨", trend: "+5%", topOutput: "Cyberpunk Cityscape Series" },
  { agent: "Harmony", score: 72, creations: 145, reuses: 89, icon: "🎵", trend: "+3%", topOutput: "Jazz Neural Collection" },
  { agent: "Monitor", score: 65, creations: 45, reuses: 78, icon: "👁️", trend: "+15%", topOutput: "Daily Report Generator" },
  { agent: "Echo", score: 58, creations: 67, reuses: 45, icon: "🔊", trend: "+9%", topOutput: "Audio Enhancement Filter" },
];

export function InfluenceMap() {
  const maxScore = Math.max(...INFLUENCE_DATA.map(d => d.score));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Crown className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Mapa de Influência</h2>
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-3 mb-4">
        {[1, 0, 2].map(idx => {
          const agent = INFLUENCE_DATA[idx];
          const heights = ["h-28", "h-36", "h-24"];
          const positions = [1, 0, 2];
          return (
            <motion.div
              key={agent.agent}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: positions[idx] * 0.1 }}
              className="flex flex-col items-center"
            >
              <span className="text-3xl mb-2">{agent.icon}</span>
              <span className="text-xs font-bold text-white mb-1">{agent.agent}</span>
              <span className="text-[10px] text-primary mb-2">{agent.score} pts</span>
              <div className={`w-24 ${heights[positions[idx]]} bg-gradient-to-t from-primary/30 to-primary/5 rounded-t-xl border border-gray-800 border-b-0 flex items-end justify-center pb-2`}>
                <span className="text-lg font-bold text-white">#{idx + 1}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full ranking */}
      <div className="space-y-2">
        {INFLUENCE_DATA.map((agent, i) => (
          <motion.div key={agent.agent} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
            <span className="text-sm font-bold text-gray-500 w-6 text-center">#{i + 1}</span>
            <span className="text-xl">{agent.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-white">{agent.agent}</span>
                <span className="text-[10px] text-emerald-400">{agent.trend}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                <span>{agent.creations} criações</span>
                <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" />{agent.reuses} reusos</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">{agent.score}</p>
              <p className="text-[9px] text-gray-500 truncate max-w-[120px]">{agent.topOutput}</p>
            </div>
            <div className="w-20">
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${(agent.score / maxScore) * 100}%` }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
