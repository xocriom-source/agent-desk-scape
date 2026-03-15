import { Bot, Armchair, Plus, Zap, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";

const actions = [
  { icon: Plus, label: "Novo Agente", color: "text-accent" },
  { icon: Bot, label: "Agentes", color: "text-primary" },
  { icon: Armchair, label: "Mobília", color: "text-agent-idle" },
  { icon: Zap, label: "Automações", color: "text-agent-thinking" },
  { icon: LayoutGrid, label: "Layout", color: "text-muted-foreground" },
];

export function ActionBar() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="glass-panel rounded-2xl px-2 py-2 flex items-center gap-1"
      >
        {actions.map((action) => (
          <button
            key={action.label}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl hover:bg-card/15 transition-colors group"
          >
            <action.icon className={`w-5 h-5 ${action.color} group-hover:scale-110 transition-transform`} />
            <span className="text-[10px] font-display text-primary-foreground/70 group-hover:text-primary-foreground transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}
