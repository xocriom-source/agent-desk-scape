import { useMemo } from "react";
import type { CityBuilding } from "@/types/building";

interface Props {
  playerPos: [number, number, number];
  buildings: CityBuilding[];
  userBuildingId?: string;
  size?: number;
}

export function CityMiniMap({ playerPos, buildings, userBuildingId, size = 150 }: Props) {
  const dots = useMemo(() => {
    const scale = size / 80;
    return buildings.slice(0, 60).map((b) => ({
      id: b.id,
      x: (b.coordinates.x * 0.4 + 35) * scale,
      y: (b.coordinates.z * 0.4 + 35) * scale,
      isUser: b.id === userBuildingId,
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
      className="rounded-xl overflow-hidden shadow-lg relative"
      style={{
        width: size,
        height: size,
        background: "hsl(222 47% 8% / 0.85)",
        border: "1px solid hsl(0 0% 100% / 0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_, i) => (
          <g key={i}>
            <line x1={0} y1={i * size / 4} x2={size} y2={i * size / 4} stroke="hsl(0 0% 100% / 0.06)" strokeWidth={0.5} />
            <line x1={i * size / 4} y1={0} x2={i * size / 4} y2={size} stroke="hsl(0 0% 100% / 0.06)" strokeWidth={0.5} />
          </g>
        ))}

        {/* Buildings */}
        {dots.map((d) => (
          <rect
            key={d.id}
            x={d.x - (d.isUser ? 2.5 : 1.5)}
            y={d.y - (d.isUser ? 2.5 : 1.5)}
            width={d.isUser ? 5 : 3}
            height={d.isUser ? 5 : 3}
            fill={d.isUser ? "#10B981" : "hsl(0 0% 100% / 0.25)"}
            rx={0.5}
          />
        ))}

        {/* Player */}
        <circle cx={playerDot.x} cy={playerDot.y} r={4} fill="#10B981" />
        <circle cx={playerDot.x} cy={playerDot.y} r={7} fill="none" stroke="#10B981" strokeWidth={0.5} opacity={0.4} />
      </svg>

      {/* Label */}
      <div className="absolute bottom-1 left-0 right-0 text-center">
        <span className="text-[10px] font-display font-semibold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
          Mapa
        </span>
      </div>
    </div>
  );
}
