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

const SCALE = 4; // pixels per tile
const W = MAP_COLS * SCALE;
const H = MAP_ROWS * SCALE;

export function MiniMap({ player, agents, rooms }: MiniMapProps) {
  const roomRects = useMemo(
    () =>
      rooms.map((r) => ({
        id: r.id,
        name: r.name,
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
      className="absolute bottom-20 right-3 z-20 glass-panel rounded-xl p-1.5 shadow-lg"
    >
      <div className="relative" style={{ width: W, height: H }}>
        {/* Background */}
        <div
          className="absolute inset-0 rounded-lg"
          style={{ backgroundColor: "hsl(222 47% 11% / 0.6)" }}
        />

        {/* Rooms */}
        {roomRects.map((r) => (
          <div
            key={r.id}
            className="absolute rounded-[2px] border"
            style={{
              left: r.x,
              top: r.y,
              width: r.w,
              height: r.h,
              backgroundColor: r.color + "88",
              borderColor: r.wall + "66",
            }}
          />
        ))}

        {/* Hallways (simplified lines) */}
        {/* Horizontal mid */}
        <div
          className="absolute"
          style={{
            left: 1 * SCALE,
            top: 12 * SCALE,
            width: 39 * SCALE,
            height: 2 * SCALE,
            backgroundColor: "hsl(210 20% 92% / 0.3)",
          }}
        />
        {/* Vertical left */}
        <div
          className="absolute"
          style={{
            left: 12 * SCALE,
            top: 1 * SCALE,
            width: 2 * SCALE,
            height: 33 * SCALE,
            backgroundColor: "hsl(210 20% 92% / 0.3)",
          }}
        />
        {/* Vertical center */}
        <div
          className="absolute"
          style={{
            left: 27 * SCALE,
            top: 1 * SCALE,
            width: 2 * SCALE,
            height: 33 * SCALE,
            backgroundColor: "hsl(210 20% 92% / 0.3)",
          }}
        />

        {/* Agents */}
        {agents.map((a) => (
          <div
            key={a.id}
            className="absolute rounded-full"
            style={{
              left: a.x * SCALE - 2,
              top: a.y * SCALE - 2,
              width: 5,
              height: 5,
              backgroundColor: a.color,
              boxShadow: `0 0 3px ${a.color}`,
              transition: "left 0.3s, top 0.3s",
            }}
          />
        ))}

        {/* Player (larger, pulsing) */}
        <div
          className="absolute rounded-full"
          style={{
            left: player.x * SCALE - 3,
            top: player.y * SCALE - 3,
            width: 7,
            height: 7,
            backgroundColor: "#4F46E5",
            boxShadow: "0 0 6px #4F46E5, 0 0 12px #4F46E580",
            transition: "left 0.1s, top 0.1s",
          }}
        />
        {/* Player direction indicator */}
        <div
          className="absolute"
          style={{
            left: player.x * SCALE - 1,
            top: player.y * SCALE - 1,
            width: 2,
            height: 8,
            backgroundColor: "#FFFFFF",
            borderRadius: 1,
            transformOrigin: "1px 1px",
            transform: `rotate(${player.angle * (180 / Math.PI)}deg)`,
            transition: "transform 0.1s",
            opacity: 0.7,
          }}
        />

        {/* Label */}
        <div className="absolute top-0.5 left-1">
          <span className="text-[7px] font-display font-bold text-white/60 uppercase tracking-wider">
            Mini-mapa
          </span>
        </div>
      </div>
    </motion.div>
  );
}
