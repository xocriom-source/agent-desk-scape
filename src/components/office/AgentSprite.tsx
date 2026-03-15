import { memo } from "react";
import { motion } from "framer-motion";
import type { Agent } from "@/types/agent";

const AVATAR_COLORS = [
  "hsl(200, 80%, 55%)",  // blue
  "hsl(90, 60%, 45%)",   // green
  "hsl(25, 90%, 55%)",   // orange
  "hsl(270, 60%, 55%)",  // purple
  "hsl(0, 70%, 55%)",    // red
  "hsl(175, 60%, 50%)",  // teal
];

const AVATAR_EMOJIS = ["🎧", "🔬", "💻", "📊", "🎨", "📞"];

interface AgentSpriteProps {
  agent: Agent;
  cellSize: number;
  isSelected: boolean;
  onClick: () => void;
}

export const AgentSprite = memo(function AgentSprite({
  agent,
  cellSize,
  isSelected,
  onClick,
}: AgentSpriteProps) {
  const statusColors: Record<string, string> = {
    active: "bg-accent",
    idle: "bg-agent-idle",
    thinking: "bg-agent-thinking",
  };

  return (
    <motion.button
      onClick={onClick}
      className="absolute flex flex-col items-center cursor-pointer group"
      style={{
        left: agent.position.x * cellSize,
        top: agent.position.y * cellSize,
        width: cellSize,
        height: cellSize,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      {/* Selection ring */}
      {isSelected && (
        <motion.div
          className="absolute inset-1 rounded-full border-2 border-primary"
          layoutId="agent-ring"
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Thinking glow */}
      {agent.status === "thinking" && (
        <div
          className="absolute inset-2 rounded-full agent-thinking"
          style={{ background: AVATAR_COLORS[agent.avatar], opacity: 0.3 }}
        />
      )}

      {/* Agent body */}
      <div
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-lg pixel-shadow mt-1 ${
          agent.status === "idle" ? "" : "agent-float"
        }`}
        style={{ background: AVATAR_COLORS[agent.avatar] }}
      >
        <span>{AVATAR_EMOJIS[agent.avatar]}</span>

        {/* Status dot */}
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${statusColors[agent.status]}`}
        />
      </div>

      {/* Name tag */}
      <span className="text-[9px] font-display font-semibold text-foreground bg-card/80 px-1.5 rounded mt-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        {agent.name}
      </span>
    </motion.button>
  );
});
