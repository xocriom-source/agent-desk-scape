import { Bot, Armchair, Plus, Zap, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface ActionBarProps {
  onMove: (dx: number, dy: number) => void;
}

const tools = [
  { icon: Plus, label: "Novo Agente", accent: true },
  { icon: Bot, label: "Agentes" },
  { icon: Armchair, label: "Mobília" },
  { icon: Zap, label: "Automações" },
];

export function ActionBar({ onMove }: ActionBarProps) {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-end gap-3">
      {/* D-Pad for mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="glass-panel rounded-2xl p-2 shadow-lg flex flex-col items-center gap-1 md:hidden"
      >
        <button onClick={() => onMove(0, -1)} className="p-2.5 rounded-lg hover:bg-muted/30 active:bg-muted/50 active:scale-95 transition-all">
          <ArrowUp className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex gap-1">
          <button onClick={() => onMove(-1, 0)} className="p-2.5 rounded-lg hover:bg-muted/30 active:bg-muted/50 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <button onClick={() => onMove(1, 0)} className="p-2.5 rounded-lg hover:bg-muted/30 active:bg-muted/50 active:scale-95 transition-all">
            <ArrowRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
        <button onClick={() => onMove(0, 1)} className="p-2.5 rounded-lg hover:bg-muted/30 active:bg-muted/50 active:scale-95 transition-all">
          <ArrowDown className="w-5 h-5 text-foreground" />
        </button>
      </motion.div>

      {/* Tools bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="glass-panel rounded-2xl px-2 py-2 flex items-center gap-1 shadow-lg"
      >
        {tools.map((action) => (
          <button
            key={action.label}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all group ${
              action.accent ? "bg-accent/20 hover:bg-accent/30" : "hover:bg-muted/30"
            }`}
          >
            <action.icon className={`w-5 h-5 group-hover:scale-110 transition-transform ${action.accent ? "text-accent" : "text-foreground"}`} />
            <span className={`text-[10px] font-display font-medium ${action.accent ? "text-accent" : "text-muted-foreground group-hover:text-foreground"} transition-colors`}>
              {action.label}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Controls hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="glass-panel rounded-2xl px-3 py-2 shadow-lg hidden md:block"
      >
        <p className="text-[10px] text-muted-foreground font-display">
          <span className="font-semibold text-foreground">WASD/←↑↓→</span> mover •{" "}
          <span className="font-semibold text-foreground">SCROLL</span> zoom •{" "}
          <span className="font-semibold text-foreground">ARRASTAR</span> câmera •{" "}
          <span className="font-semibold text-foreground">ESPAÇO</span> interagir
        </p>
      </motion.div>
    </div>
  );
}
