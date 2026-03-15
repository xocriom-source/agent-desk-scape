import { Settings, User, Wifi } from "lucide-react";
import logo from "@/assets/logo.png";

interface TopBarProps {
  agentCount: number;
}

export function TopBar({ agentCount }: TopBarProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
      {/* Logo */}
      <div className="glass-panel rounded-xl px-4 py-2 flex items-center gap-3 pointer-events-auto">
        <img src={logo} alt="AgentOffice" className="w-8 h-8" />
        <span className="font-display font-bold text-primary-foreground text-sm">
          AgentOffice
        </span>
      </div>

      {/* Status & Settings */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="glass-panel rounded-xl px-3 py-2 flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-display text-primary-foreground">
            {agentCount} agentes online
          </span>
        </div>

        <button className="glass-panel rounded-xl p-2 hover:bg-card/20 transition-colors">
          <User className="w-4 h-4 text-primary-foreground" />
        </button>

        <button className="glass-panel rounded-xl p-2 hover:bg-card/20 transition-colors">
          <Settings className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
}
