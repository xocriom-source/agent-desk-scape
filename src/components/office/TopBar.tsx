import { useState, useEffect } from "react";
import { Settings, Wifi, LogOut, Palette, Home, Clock, MessageSquare, CheckCircle2, Radio, ImageIcon, BarChart3, Store, Vote, Sparkles, Database, Shield, MapPin, Star, Eye, Calendar, Globe, Map, Landmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoOriginal from "@/assets/logo-original.svg";
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
  onOpenAnalytics?: () => void;
  onOpenMarketplace?: () => void;
  onOpenGovernance?: () => void;
  onOpenStudios?: () => void;
  onOpenMemory?: () => void;
  onOpenCommand?: () => void;
  onOpenArtifacts?: () => void;
  onOpenNPCs?: () => void;
  onOpenObservation?: () => void;
  onOpenDistricts?: () => void;
  onOpenEvents?: () => void;
  onOpenCityChat?: () => void;
  notifications?: Record<string, number>;
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

function NavBtn({ onClick, title, icon: Icon, color, badge }: { onClick?: () => void; title: string; icon: typeof MessageSquare; color: string; badge?: number }) {
  return (
    <button onClick={onClick} className="relative p-2 rounded-xl hover:bg-muted/30 transition-colors shrink-0" title={title}>
      <Icon className="w-4 h-4" style={{ color }} />
      {badge && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 flex items-center justify-center bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full px-0.5">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

export function TopBar({ agentCount, activeCount, nearbyAgent, onCustomize, onRoomEditor, onLogout, onOpenFeed, onOpenTasks, onOpenMessaging, onOpenGallery, onOpenAnalytics, onOpenMarketplace, onOpenGovernance, onOpenStudios, onOpenMemory, onOpenCommand, onOpenArtifacts, onOpenNPCs, onOpenObservation, onOpenDistricts, onOpenEvents, onOpenCityChat, notifications = {} }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between pointer-events-none gap-2">
      <div className="flex items-center gap-2 pointer-events-auto flex-shrink-0">
        <div className="glass-panel rounded-2xl px-3 py-2 flex items-center gap-2 shadow-lg">
          <img src={logo} alt="AgentOffice" className="w-7 h-7" />
          <div>
            <span className="font-display font-bold text-foreground text-sm block leading-tight">The Good City</span>
            <span className="text-[10px] text-muted-foreground">Cidade Virtual de IA</span>
          </div>
        </div>
        <LocalClock />
      </div>

      {/* Feature buttons - scrollable on smaller screens */}
      <div className="flex-1 min-w-0 pointer-events-auto mx-2">
        <div className="glass-panel rounded-2xl flex items-center gap-0.5 px-1.5 py-1 shadow-lg overflow-x-auto scrollbar-hide">
          {/* City navigation */}
          <NavBtn onClick={() => navigate("/city-explore")} title="Explorar Cidade" icon={Map} color="#10B981" />
          <NavBtn onClick={() => navigate("/marketplace/businesses")} title="Business Marketplace" icon={Landmark} color="#F59E0B" />
          <div className="w-px h-5 bg-border/50 mx-0.5 shrink-0" />
          {onOpenFeed && <NavBtn onClick={onOpenFeed} title="Feed Social" icon={MessageSquare} color="hsl(239 84% 67%)" badge={notifications.feed} />}
          {onOpenTasks && <NavBtn onClick={onOpenTasks} title="Task Engine" icon={CheckCircle2} color="hsl(160 84% 39%)" badge={notifications.tasks} />}
          {onOpenMessaging && <NavBtn onClick={onOpenMessaging} title="Mensagens" icon={Radio} color="#4ECDC4" badge={notifications.messages} />}
          {onOpenGallery && <NavBtn onClick={onOpenGallery} title="Galeria" icon={ImageIcon} color="#FF6BB5" />}
          {onOpenStudios && <NavBtn onClick={onOpenStudios} title="Estúdios" icon={Sparkles} color="#FFB347" />}
          {onOpenAnalytics && <NavBtn onClick={onOpenAnalytics} title="Analytics" icon={BarChart3} color="#A78BFA" />}
          <div className="w-px h-5 bg-border/50 mx-0.5 shrink-0" />
          {onOpenMarketplace && <NavBtn onClick={onOpenMarketplace} title="Marketplace" icon={Store} color="hsl(160 84% 39%)" />}
          {onOpenGovernance && <NavBtn onClick={onOpenGovernance} title="Governança" icon={Vote} color="hsl(239 84% 67%)" badge={notifications.governance} />}
          {onOpenMemory && <NavBtn onClick={onOpenMemory} title="Memória" icon={Database} color="#06B6D4" />}
          {onOpenCommand && <NavBtn onClick={onOpenCommand} title="Command Center" icon={Shield} color="#EF4444" />}
          <div className="w-px h-5 bg-border/50 mx-0.5 shrink-0" />
          {onOpenArtifacts && <NavBtn onClick={onOpenArtifacts} title="Artefatos" icon={Sparkles} color="#F59E0B" />}
          {onOpenNPCs && <NavBtn onClick={onOpenNPCs} title="NPCs" icon={Star} color="#A78BFA" />}
          {onOpenObservation && <NavBtn onClick={onOpenObservation} title="Observation Lab" icon={Eye} color="#06B6D4" />}
          {onOpenDistricts && <NavBtn onClick={onOpenDistricts} title="Distritos" icon={MapPin} color="#10B981" />}
          {onOpenEvents && <NavBtn onClick={onOpenEvents} title="Eventos" icon={Calendar} color="#EF4444" badge={notifications.events} />}
          {onOpenCityChat && <NavBtn onClick={onOpenCityChat} title="Chat da Cidade" icon={Globe} color="#3B82F6" />}
        </div>
      </div>

      {nearbyAgent && (
        <div className="glass-panel rounded-2xl px-3 py-2 flex items-center gap-2 pointer-events-auto shadow-lg animate-pulse shrink-0">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: nearbyAgent.color }} />
          <span className="text-xs text-foreground font-medium">{nearbyAgent.name}</span>
          <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">ESPAÇO</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
        <div className="glass-panel rounded-2xl px-3 py-2 flex items-center gap-2 shadow-lg">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-display text-foreground font-medium">{activeCount}</span>
          </div>
          <div className="w-px h-3.5 bg-border" />
          <div className="flex items-center gap-1">
            <Wifi className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{agentCount}</span>
          </div>
        </div>

        {onRoomEditor && (
          <button onClick={onRoomEditor} className="glass-panel rounded-2xl p-2 hover:bg-muted/30 transition-colors shadow-lg" title="Editor de Salas">
            <Home className="w-4 h-4 text-foreground" />
          </button>
        )}
        {onCustomize && (
          <button onClick={onCustomize} className="glass-panel rounded-2xl p-2 hover:bg-muted/30 transition-colors shadow-lg" title="Personalizar">
            <Palette className="w-4 h-4 text-foreground" />
          </button>
        )}
        <button className="glass-panel rounded-2xl p-2 hover:bg-muted/30 transition-colors shadow-lg">
          <Settings className="w-4 h-4 text-foreground" />
        </button>
        {onLogout && (
          <button onClick={onLogout} className="glass-panel rounded-2xl p-2 hover:bg-destructive/20 transition-colors shadow-lg" title="Sair">
            <LogOut className="w-4 h-4 text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
