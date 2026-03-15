import { Settings, User, Wifi, Keyboard } from "lucide-react";
import logo from "@/assets/logo.png";
import type { Agent } from "@/types/agent";

interface TopBarProps {
  agentCount: number;
  activeCount: number;
  nearbyAgent: Agent | null;
}

export function TopBar({ agentCount, activeCount, nearbyAgent }: TopBarProps) {
  return (
    <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
      {/* Logo */}
      <div className="glass-panel rounded-2xl px-4 py-2.5 flex items-center gap-3 pointer-events-auto shadow-lg">
        <img src={logo} alt="AgentOffice" className="w-8 h-8" />
        <div>
          <span className="font-display font-bold text-foreground text-sm block leading-tight">
            AgentOffice
          </span>
          <span className="text-[10px] text-muted-foreground">Empresa Virtual de IA</span>
        </div>
      </div>

      {/* Proximity indicator */}
      {nearbyAgent && (
        <div className="glass-panel rounded-2xl px-4 py-2 flex items-center gap-2 pointer-events-auto shadow-lg animate-pulse">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: nearbyAgent.color }} />
          <span className="text-xs text-foreground font-medium">
            {nearbyAgent.name} está perto
          </span>
          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
            ESPAÇO para interagir
          </span>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="glass-panel rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-display text-foreground font-medium">
              {activeCount} ativos
            </span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {agentCount} agentes
            </span>
          </div>
        </div>

        <button className="glass-panel rounded-2xl p-2.5 hover:bg-muted/30 transition-colors shadow-lg">
          <Settings className="w-4 h-4 text-foreground" />
        </button>
      </div>
    </div>
  );
}
