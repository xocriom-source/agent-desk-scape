import { memo } from "react";
import type { FurnitureItem } from "@/types/agent";

const FURNITURE_STYLES: Record<string, { bg: string; icon: string }> = {
  desk: { bg: "hsl(30, 30%, 45%)", icon: "🖥️" },
  chair: { bg: "hsl(220, 10%, 40%)", icon: "🪑" },
  plant: { bg: "hsl(130, 40%, 35%)", icon: "🌿" },
  bookshelf: { bg: "hsl(25, 35%, 40%)", icon: "📚" },
  coffee: { bg: "hsl(20, 30%, 30%)", icon: "☕" },
  monitor: { bg: "hsl(220, 20%, 25%)", icon: "🖥️" },
};

interface FurnitureTileProps {
  item: FurnitureItem;
  cellSize: number;
}

export const FurnitureTile = memo(function FurnitureTile({
  item,
  cellSize,
}: FurnitureTileProps) {
  const style = FURNITURE_STYLES[item.type];

  return (
    <div
      className="absolute rounded-lg flex items-center justify-center pixel-shadow opacity-80"
      style={{
        left: item.position.x * cellSize + 4,
        top: item.position.y * cellSize + 4,
        width: item.size.w * cellSize - 8,
        height: item.size.h * cellSize - 8,
        background: style.bg,
      }}
    >
      <span className="text-2xl">{style.icon}</span>
    </div>
  );
});
