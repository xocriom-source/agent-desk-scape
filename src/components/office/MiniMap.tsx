import { useMemo, memo } from "react";
import { motion } from "framer-motion";
import type { Agent, Player } from "@/types/agent";
import type { RoomDef } from "@/data/officeMap";
import { MAP_COLS, MAP_ROWS } from "@/data/officeMap";

interface MiniMapProps {
  player: Player;
  agents: Agent[];
  rooms: RoomDef[];
}

const SCALE = 4;
const W = MAP_COLS * SCALE;
const H = MAP_ROWS * SCALE;

export const MiniMap = memo(function MiniMap({ player, agents, rooms }: MiniMapProps) {
  const roomRects = useMemo(
    () =>
      rooms.map((r) => ({
        id: r.id,
        x: r.x * SCALE,
        y: r.y * SCALE,
        w: r.w * SCALE,
        h: r.h * SCALE,
        color: r.floorColor,
        wall: r.wallColor,
      })),
    [rooms]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="absolute bottom-20 right-3 z-20 glass-panel rounded-xl p-2 shadow-lg border border-border"
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="rounded-lg overflow-hidden">
        {/* Background */}
        <rect width={W} height={H} fill="hsl(var(--background))" rx={4} opacity={0.8} />

        {/* Rooms */}
        {roomRects.map((r) => (
          <rect
            key={r.id}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill={r.color}
            fillOpacity={0.5}
            stroke={r.wall}
            strokeOpacity={0.4}
            strokeWidth={0.5}
            rx={1}
          />
        ))}

        {/* Agents */}
        {agents.map((a) => (
          <circle
            key={a.id}
            cx={a.x * SCALE}
            cy={a.y * SCALE}
            r={2.5}
            fill={a.color}
            opacity={0.8}
          />
        ))}

        {/* Player */}
        <circle
          cx={player.x * SCALE}
          cy={player.y * SCALE}
          r={3.5}
          fill="hsl(var(--primary))"
          stroke="hsl(var(--primary-foreground))"
          strokeWidth={1}
        />
        <circle
          cx={player.x * SCALE}
          cy={player.y * SCALE}
          r={6}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={0.5}
          opacity={0.3}
        />
      </svg>

      {/* Label */}
      <div className="text-center mt-1">
        <span className="text-[11px] font-display font-semibold text-muted-foreground uppercase tracking-wider">
          Mapa
        </span>
      </div>
    </motion.div>
  );
});
