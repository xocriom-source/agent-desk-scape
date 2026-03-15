import { Settings, User, Wifi } from "lucide-react";
import logo from "@/assets/logo.png";

interface TopBarProps {
  agentCount: number;
  activeCount: number;
}

export function TopBar({ agentCount, activeCount }: TopBarProps) {
  return (
    <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
      {/* Logo */}
      <div className="glass-panel rounded-2xl px-4 py-2.5 flex items-center gap-3 pointer-events-auto">
        <img src={logo} alt="AgentOffice" className="w-8 h-8" />
        <div>
          <span className="font-display font-bold text-foreground text-sm block leading-tight">
            AgentOffice
          </span>
          <span className="text-[10px] text-muted-foreground">Escritório Virtual</span>
        </div>
      </div>

      {/* Status & Settings */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="glass-panel rounded-2xl px-4 py-2.5 flex items-center gap-3">
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

        <button className="glass-panel rounded-2xl p-2.5 hover:bg-muted/30 transition-colors">
          <User className="w-4 h-4 text-foreground" />
        </button>

        <button className="glass-panel rounded-2xl p-2.5 hover:bg-muted/30 transition-colors">
          <Settings className="w-4 h-4 text-foreground" />
        </button>
      </div>
    </div>
  );
}
