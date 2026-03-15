import { memo } from "react";
import type { Agent, FurnitureItem } from "@/types/agent";
import { AgentSprite } from "./AgentSprite";
import { FurnitureTile } from "./FurnitureTile";

const GRID_COLS = 14;
const GRID_ROWS = 9;
const CELL_SIZE = 64;

interface OfficeCanvasProps {
  agents: Agent[];
  furniture: FurnitureItem[];
  onAgentClick: (agent: Agent) => void;
  selectedAgentId?: string;
}

export const OfficeCanvas = memo(function OfficeCanvas({
  agents,
  furniture,
  onAgentClick,
  selectedAgentId,
}: OfficeCanvasProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-auto bg-canvas">
      <div
        className="relative"
        style={{
          width: GRID_COLS * CELL_SIZE,
          height: GRID_ROWS * CELL_SIZE,
        }}
      >
        {/* Grid floor */}
        {Array.from({ length: GRID_ROWS }).map((_, row) =>
          Array.from({ length: GRID_COLS }).map((_, col) => (
            <div
              key={`${row}-${col}`}
              className="absolute border border-canvas-grid/50 rounded-sm"
              style={{
                left: col * CELL_SIZE,
                top: row * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                background:
                  (row + col) % 2 === 0
                    ? "hsl(var(--floor-tile))"
                    : "hsl(var(--floor-accent))",
              }}
            />
          ))
        )}

        {/* Furniture */}
        {furniture.map((item) => (
          <FurnitureTile key={item.id} item={item} cellSize={CELL_SIZE} />
        ))}

        {/* Agents */}
        {agents.map((agent) => (
          <AgentSprite
            key={agent.id}
            agent={agent}
            cellSize={CELL_SIZE}
            isSelected={agent.id === selectedAgentId}
            onClick={() => onAgentClick(agent)}
          />
        ))}
      </div>
    </div>
  );
});
