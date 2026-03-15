import { useMemo } from "react";
import type { CityBuilding } from "@/types/building";

interface Props {
  playerPos: [number, number, number];
  buildings: CityBuilding[];
  userBuildingId?: string;
  size?: number;
}

export function CityMiniMap({ playerPos, buildings, userBuildingId, size = 160 }: Props) {
  const dots = useMemo(() => {
    const scale = size / 80; // map ±35 scene coords to pixel space
    return buildings.slice(0, 60).map(b => ({
      id: b.id,
      x: (b.coordinates.x * 0.4 + 35) * scale,
      y: (b.coordinates.z * 0.4 + 35) * scale,
      isUser: b.id === userBuildingId,
      color: b.primaryColor,
    }));
  }, [buildings, userBuildingId, size]);

  const playerDot = useMemo(() => {
    const scale = size / 80;
    return {
      x: (playerPos[0] + 35) * scale,
      y: (playerPos[2] + 35) * scale,
    };
  }, [playerPos, size]);

  return (
    <div
      className="rounded-xl border border-gray-700/60 bg-black/70 backdrop-blur-md overflow-hidden"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={`g${i}`} x1={0} y1={i * size / 4} x2={size} y2={i * size / 4} stroke="#333" strokeWidth={0.5} />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={`gv${i}`} x1={i * size / 4} y1={0} x2={i * size / 4} y2={size} stroke="#333" strokeWidth={0.5} />
        ))}

        {/* Buildings */}
        {dots.map(d => (
          <rect
            key={d.id}
            x={d.x - 2}
            y={d.y - 2}
            width={d.isUser ? 5 : 3}
            height={d.isUser ? 5 : 3}
            fill={d.isUser ? "#C8D880" : "#555"}
            rx={0.5}
          />
        ))}

        {/* Player */}
        <circle
          cx={playerDot.x}
          cy={playerDot.y}
          r={4}
          fill="#10B981"
          stroke="#000"
          strokeWidth={1}
        />
        <circle
          cx={playerDot.x}
          cy={playerDot.y}
          r={7}
          fill="none"
          stroke="#10B981"
          strokeWidth={0.5}
          opacity={0.4}
        />
      </svg>

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 text-center py-0.5">
        <span className="text-[7px] text-gray-500 tracking-widest" style={{ fontFamily: "monospace" }}>
          MINIMAP
        </span>
      </div>
    </div>
  );
}
