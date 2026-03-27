/**
 * CityModeSwitcher — Premium animated toggle between Canvas and Flyover modes.
 * Shows shared world context (city, stats) regardless of active mode.
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Globe, Users, Building2, Zap } from "lucide-react";
import { useGameStore, type CityViewMode } from "@/stores/gameStore";

interface CityModeSwitcherProps {
  buildingCount: number;
  agentCount: number;
  activityCount: number;
}

export const CityModeSwitcher = memo(function CityModeSwitcher({
  buildingCount,
  agentCount,
  activityCount,
}: CityModeSwitcherProps) {
  const cityViewMode = useGameStore(s => s.ui.cityViewMode);
  const setCityViewMode = useGameStore(s => s.setCityViewMode);
  const currentCity = useGameStore(s => s.world.currentCity);

  const modes: { id: CityViewMode; label: string; icon: typeof LayoutGrid; desc: string }[] = [
    { id: "canvas", label: "Social View", icon: LayoutGrid, desc: "Isometric overview" },
    { id: "flyover", label: "Flyover 3D", icon: Globe, desc: "Explore in 3D" },
  ];

  return (
    <div className="flex items-center gap-3">
      {/* City context badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/80 backdrop-blur-md border border-border/50">
        <span className="text-sm font-bold text-foreground">
          {currentCity.flag} {currentCity.name}
        </span>
        <div className="w-px h-4 bg-border/60" />
        <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Building2 className="w-3 h-3" />
            {buildingCount}
          </span>
          <span className="flex items-center gap-0.5">
            <Users className="w-3 h-3" />
            {agentCount}
          </span>
          <span className="flex items-center gap-0.5">
            <Zap className="w-3 h-3 text-accent" />
            {activityCount}
          </span>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="relative flex items-center rounded-xl bg-card/80 backdrop-blur-md border border-border/50 p-0.5">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = cityViewMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => setCityViewMode(mode.id)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors z-10 ${
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={mode.desc}
            >
              {isActive && (
                <motion.div
                  layoutId="city-mode-pill"
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10 hidden sm:inline">{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
