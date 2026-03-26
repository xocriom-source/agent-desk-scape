import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Activity {
  id: number;
  emoji: string;
  text: string;
  time: string;
}

const ACTIVITY_TEMPLATES = [
  { emoji: "🏗️", text: "{name} reivindicou um novo prédio" },
  { emoji: "🚗", text: "{name} está dirigindo pela cidade" },
  { emoji: "🎨", text: "{name} personalizou seu escritório" },
  { emoji: "🤖", text: "{name} contratou um novo agente" },
  { emoji: "📦", text: "{name} publicou um artefato" },
  { emoji: "🎵", text: "{name} criou uma música" },
  { emoji: "💬", text: "{name} iniciou uma conversa" },
  { emoji: "🚀", text: "{name} subiu de nível" },
  { emoji: "🏆", text: "{name} entrou no leaderboard" },
  { emoji: "✈️", text: "{name} está voando pela cidade" },
  { emoji: "🛸", text: "{name} desbloqueou um drone" },
  { emoji: "🏢", text: "{name} expandiu seu prédio" },
  { emoji: "⭐", text: "{name} ganhou uma estrela" },
  { emoji: "🎭", text: "{name} criou um design" },
  { emoji: "📊", text: "{name} analisou dados" },
  { emoji: "🔧", text: "{name} otimizou sua equipe" },
];

const NAMES = [
  "André", "Maria", "Carlos", "Julia", "Pedro", "Ana", "Lucas",
  "Beatriz", "Rafael", "Camila", "SkyPilot", "NeonRunner", "CodeFlyer",
  "Atlas", "Nova", "Kaori", "Sage", "Echo", "Drift", "Phoenix",
];

function generateActivity(id: number): Activity {
  const template = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const now = new Date();
  const mins = Math.floor(Math.random() * 5);
  return {
    id,
    emoji: template.emoji,
    text: template.text.replace("{name}", name),
    time: mins === 0 ? "agora" : `${mins}m atrás`,
  };
}

export function CityActivityTicker() {
  const [activities, setActivities] = useState<Activity[]>(() =>
    Array.from({ length: 3 }, (_, i) => generateActivity(i))
  );
  const counterRef = useRef(3);

  useEffect(() => {
    const interval = setInterval(() => {
      const newAct = generateActivity(counterRef.current++);
      setActivities(prev => [newAct, ...prev.slice(0, 2)]);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 overflow-hidden">
      <AnimatePresence mode="popLayout">
        {activities.slice(0, 3).map((act) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, x: 40, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass-panel border border-border whitespace-nowrap"
          >
            <span className="text-xs">{act.emoji}</span>
            <span className="text-[11px] text-foreground/80 font-medium font-mono">
              {act.text}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {act.time}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
