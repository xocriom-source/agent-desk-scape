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
    const scale = size / 80;
    return buildings.slice(0, 60).map((b) => ({
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
      className="rounded-xl glass-panel border border-border overflow-hidden shadow-lg"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background */}
        <rect width={size} height={size} fill="hsl(var(--background))" opacity={0.6} />

        {/* Grid */}
        {Array.from({ length: 5 }).map((_, i) => (
          <g key={i}>
            <line x1={0} y1={i * size / 4} x2={size} y2={i * size / 4} stroke="hsl(var(--border))" strokeWidth={0.5} />
            <line x1={i * size / 4} y1={0} x2={i * size / 4} y2={size} stroke="hsl(var(--border))" strokeWidth={0.5} />
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
            fill={d.isUser ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))"}
            opacity={d.isUser ? 1 : 0.5}
            rx={0.5}
          />
        ))}

        {/* Player */}
        <circle cx={playerDot.x} cy={playerDot.y} r={4} fill="hsl(var(--accent))" stroke="hsl(var(--background))" strokeWidth={1} />
        <circle cx={playerDot.x} cy={playerDot.y} r={7} fill="none" stroke="hsl(var(--accent))" strokeWidth={0.5} opacity={0.3} />
      </svg>

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 text-center py-1">
        <span className="text-[11px] font-display font-semibold text-muted-foreground uppercase tracking-wider">
          Mapa
        </span>
      </div>
    </div>
  );
}
