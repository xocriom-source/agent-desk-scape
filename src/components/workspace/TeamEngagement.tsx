import { useState } from "react";
import { motion } from "framer-motion";
import { X, Gamepad2, Trophy, Coffee, Target, Star } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GAMES = [
  { id: "trivia", name: "Trivia Challenge", icon: "🧠", players: 4, desc: "Teste conhecimentos em equipe", active: true },
  { id: "draw", name: "Draw Together", icon: "🎨", players: 6, desc: "Desenhe e adivinhe", active: false },
  { id: "quiz", name: "Code Quiz", icon: "💻", players: 3, desc: "Quiz de programação", active: true },
];

const CHALLENGES = [
  { title: "Review Champion", desc: "Faça 5 code reviews esta semana", progress: 3, target: 5, reward: "🏆" },
  { title: "Social Butterfly", desc: "Converse com 10 colegas", progress: 7, target: 10, reward: "🦋" },
  { title: "Meeting Master", desc: "Participe de 3 reuniões", progress: 3, target: 3, reward: "⭐" },
];

export function TeamEngagement({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<"games" | "challenges" | "social">("challenges");
  const mainColor = "#6b8fc4";

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:h-[420px] z-50 rounded-2xl border overflow-hidden flex flex-col"
      style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.97)", backdropFilter: "blur(16px)" }}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4" style={{ color: mainColor }} />
          <span className="text-xs font-mono font-bold tracking-wider text-white">ENGAJAMENTO</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5"><X className="w-4 h-4 text-gray-500" /></button>
      </div>

      <div className="flex border-b" style={{ borderColor: `${mainColor}10` }}>
        {(["challenges", "games", "social"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-[10px] font-mono tracking-wider uppercase transition-colors"
            style={{ color: tab === t ? mainColor : "#6b7280", borderBottom: tab === t ? `2px solid ${mainColor}` : "2px solid transparent" }}
          >
            {t === "challenges" ? "🎯 Desafios" : t === "games" ? "🎮 Jogos" : "☕ Social"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tab === "challenges" && CHALLENGES.map((ch, i) => (
          <div key={i} className="p-3 rounded-xl border" style={{ borderColor: `${mainColor}10` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{ch.reward}</span>
                <div>
                  <p className="text-[11px] font-mono font-bold text-white">{ch.title}</p>
                  <p className="text-[9px] font-mono" style={{ color: `${mainColor}50` }}>{ch.desc}</p>
                </div>
              </div>
              {ch.progress >= ch.target && <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">COMPLETO</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-white/5">
                <div className="h-full rounded-full transition-all" style={{ width: `${(ch.progress / ch.target) * 100}%`, backgroundColor: ch.progress >= ch.target ? "#34d399" : mainColor }} />
              </div>
              <span className="text-[8px] font-mono text-gray-500">{ch.progress}/{ch.target}</span>
            </div>
          </div>
        ))}

        {tab === "games" && GAMES.map(g => (
          <div key={g.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: `${mainColor}10` }}>
            <span className="text-2xl">{g.icon}</span>
            <div className="flex-1">
              <p className="text-[11px] font-mono font-bold text-white">{g.name}</p>
              <p className="text-[9px] font-mono" style={{ color: `${mainColor}50` }}>{g.desc} · {g.players} jogando</p>
            </div>
            <button className="px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold tracking-wider" style={{ backgroundColor: g.active ? "#34d39920" : `${mainColor}15`, color: g.active ? "#34d399" : mainColor }}>
              {g.active ? "ENTRAR" : "INICIAR"}
            </button>
          </div>
        ))}

        {tab === "social" && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl border text-center" style={{ borderColor: `${mainColor}10` }}>
              <Coffee className="w-8 h-8 mx-auto mb-2" style={{ color: `${mainColor}30` }} />
              <p className="text-xs font-mono font-bold text-white">Coffee Break Virtual</p>
              <p className="text-[9px] font-mono mb-3" style={{ color: `${mainColor}50` }}>Encontre aleatoriamente um colega para bater papo</p>
              <button className="px-4 py-2 rounded-lg text-[10px] font-mono font-bold tracking-wider" style={{ backgroundColor: `${mainColor}20`, color: mainColor }}>
                ☕ INICIAR COFFEE BREAK
              </button>
            </div>
            <div className="p-4 rounded-xl border" style={{ borderColor: `${mainColor}10` }}>
              <p className="text-[9px] font-mono font-bold mb-2" style={{ color: `${mainColor}50` }}>ÁREAS SOCIAIS ATIVAS</p>
              {["Lounge Central", "Terraço", "Sala de Jogos"].map(area => (
                <div key={area} className="flex items-center justify-between py-2">
                  <span className="text-[10px] font-mono text-gray-300">{area}</span>
                  <span className="text-[8px] font-mono" style={{ color: `${mainColor}50` }}>{Math.floor(Math.random() * 8 + 1)} pessoas</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
