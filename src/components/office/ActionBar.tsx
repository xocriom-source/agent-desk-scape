import { Bot, Armchair, Plus, Zap, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  { icon: Plus, label: "Novo Agente", accent: true },
  { icon: Bot, label: "Agentes" },
  { icon: Armchair, label: "Mobília" },
  { icon: Zap, label: "Automações" },
  { icon: LayoutGrid, label: "Layout" },
];

export function ActionBar() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="glass-panel rounded-2xl px-2 py-2 flex items-center gap-1"
      >
        {actions.map((action) => (
          <button
            key={action.label}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all group ${
              action.accent
                ? "bg-accent/20 hover:bg-accent/30"
                : "hover:bg-muted/30"
            }`}
          >
            <action.icon
              className={`w-5 h-5 group-hover:scale-110 transition-transform ${
                action.accent ? "text-accent" : "text-foreground"
              }`}
            />
            <span
              className={`text-[10px] font-display font-medium ${
                action.accent ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
              } transition-colors`}
            >
              {action.label}
            </span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
