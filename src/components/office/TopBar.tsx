import { useState, useEffect } from "react";
import { Settings, Wifi, LogOut, Palette, Home, Clock, MessageSquare, CheckCircle2, Radio, ImageIcon } from "lucide-react";
import logo from "@/assets/logo.png";
import type { Agent } from "@/types/agent";

interface TopBarProps {
  agentCount: number;
  activeCount: number;
  nearbyAgent: Agent | null;
  onCustomize?: () => void;
  onRoomEditor?: () => void;
  onLogout?: () => void;
  onOpenFeed?: () => void;
  onOpenTasks?: () => void;
  onOpenMessaging?: () => void;
  onOpenGallery?: () => void;
}

function LocalClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()?.replace(/_/g, " ") || "";

  return (
    <div className="glass-panel rounded-2xl px-3 py-2 flex items-center gap-2 shadow-lg">
      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-bold text-foreground">{timeStr}</span>
        <span className="text-[9px] text-muted-foreground">{dateStr} · {tzName}</span>
      </div>
    </div>
  );
}

export function TopBar({ agentCount, activeCount, nearbyAgent, onCustomize, onRoomEditor, onLogout, onOpenFeed, onOpenTasks, onOpenMessaging, onOpenGallery }: TopBarProps) {
  return (
    <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="glass-panel rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
          <img src={logo} alt="AgentOffice" className="w-8 h-8" />
          <div>
            <span className="font-display font-bold text-foreground text-sm block leading-tight">AgentOffice</span>
            <span className="text-[10px] text-muted-foreground">Empresa Virtual de IA</span>
          </div>
        </div>
        <LocalClock />

        {/* New feature buttons */}
        <div className="glass-panel rounded-2xl flex items-center gap-0.5 px-1 py-1 shadow-lg">
          {onOpenFeed && (
            <button onClick={onOpenFeed} className="p-2 rounded-xl hover:bg-muted/30 transition-colors" title="Feed Social">
              <MessageSquare className="w-4 h-4 text-primary" />
            </button>
          )}
          {onOpenTasks && (
            <button onClick={onOpenTasks} className="p-2 rounded-xl hover:bg-muted/30 transition-colors" title="Task Engine">
              <CheckCircle2 className="w-4 h-4 text-accent" />
            </button>
          )}
          {onOpenMessaging && (
            <button onClick={onOpenMessaging} className="p-2 rounded-xl hover:bg-muted/30 transition-colors" title="Mensagens">
              <Radio className="w-4 h-4 text-[#4ECDC4]" />
            </button>
          )}
          {onOpenGallery && (
            <button onClick={onOpenGallery} className="p-2 rounded-xl hover:bg-muted/30 transition-colors" title="Galeria">
              <ImageIcon className="w-4 h-4 text-[#FF6BB5]" />
            </button>
          )}
        </div>
      </div>

      {nearbyAgent && (
        <div className="glass-panel rounded-2xl px-4 py-2 flex items-center gap-2 pointer-events-auto shadow-lg animate-pulse">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: nearbyAgent.color }} />
          <span className="text-xs text-foreground font-medium">{nearbyAgent.name} está perto</span>
          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">ESPAÇO para interagir</span>
        </div>
      )}

      <div className="flex items-center gap-2 pointer-events-auto">
        <div className="glass-panel rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-display text-foreground font-medium">{activeCount} ativos</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{agentCount} agentes</span>
          </div>
        </div>

        {onRoomEditor && (
          <button onClick={onRoomEditor} className="glass-panel rounded-2xl p-2.5 hover:bg-muted/30 transition-colors shadow-lg" title="Editor de Salas">
            <Home className="w-4 h-4 text-foreground" />
          </button>
        )}

        {onCustomize && (
          <button onClick={onCustomize} className="glass-panel rounded-2xl p-2.5 hover:bg-muted/30 transition-colors shadow-lg" title="Personalizar personagem">
            <Palette className="w-4 h-4 text-foreground" />
          </button>
        )}

        <button className="glass-panel rounded-2xl p-2.5 hover:bg-muted/30 transition-colors shadow-lg">
          <Settings className="w-4 h-4 text-foreground" />
        </button>

        {onLogout && (
          <button onClick={onLogout} className="glass-panel rounded-2xl p-2.5 hover:bg-destructive/20 transition-colors shadow-lg" title="Sair">
            <LogOut className="w-4 h-4 text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
