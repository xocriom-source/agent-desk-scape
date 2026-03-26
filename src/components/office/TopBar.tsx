import { useState, useEffect, useCallback } from "react";
import {
  Settings, LogOut, Palette, Home, Clock,
  MessageSquare, CheckCircle2, Radio, ImageIcon, BarChart3,
  Store, Vote, Sparkles, Database, Shield, MapPin, Star,
  Eye, Calendar, Globe, Map, Landmark, ChevronDown, Wifi,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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

interface MenuGroup {
  id: string;
  label: string;
  icon: typeof MessageSquare;
  items: { label: string; icon: typeof MessageSquare; onClick?: () => void; badge?: number }[];
}

function LocalClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  const timeStr = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="glass-panel rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 shadow-lg">
      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-xs font-semibold text-foreground">{timeStr}</span>
    </div>
  );
}

function ToolbarGroup({ group, isOpen, onToggle }: { group: MenuGroup; isOpen: boolean; onToggle: () => void }) {
  const Icon = group.icon;
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all text-xs font-medium ${
          isOpen ? "bg-primary/20 text-primary" : "hover:bg-muted/30 text-foreground"
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="hidden md:inline">{group.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-1 left-0 min-w-[160px] rounded-xl glass-panel border border-border overflow-hidden z-50 shadow-xl"
          >
            {group.items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted/40 transition-colors"
                >
                  <ItemIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full font-bold">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopBar({
  agentCount, activeCount, nearbyAgent,
  onCustomize, onRoomEditor, onLogout,
  onOpenFeed, onOpenTasks, onOpenMessaging, onOpenGallery,
  onOpenAnalytics, onOpenMarketplace, onOpenGovernance, onOpenStudios,
  onOpenMemory, onOpenCommand, onOpenArtifacts, onOpenNPCs,
  onOpenObservation, onOpenDistricts, onOpenEvents, onOpenCityChat,
  notifications = {},
}: TopBarProps) {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }, []);

  const menuGroups: MenuGroup[] = [
    {
      id: "explore",
      label: "Explorar",
      icon: Map,
      items: [
        { label: "Explorar Cidade", icon: Map, onClick: () => navigate("/city-explore") },
        { label: "Marketplace", icon: Landmark, onClick: () => navigate("/marketplace/businesses") },
        { label: "Distritos", icon: MapPin, onClick: onOpenDistricts },
      ],
    },
    {
      id: "social",
      label: "Social",
      icon: MessageSquare,
      items: [
        { label: "Feed", icon: MessageSquare, onClick: onOpenFeed, badge: notifications.feed },
        { label: "Mensagens", icon: Radio, onClick: onOpenMessaging, badge: notifications.messages },
        { label: "Chat da Cidade", icon: Globe, onClick: onOpenCityChat },
        { label: "Eventos", icon: Calendar, onClick: onOpenEvents, badge: notifications.events },
      ],
    },
    {
      id: "work",
      label: "Trabalho",
      icon: CheckCircle2,
      items: [
        { label: "Tarefas", icon: CheckCircle2, onClick: onOpenTasks, badge: notifications.tasks },
        { label: "Analytics", icon: BarChart3, onClick: onOpenAnalytics },
        { label: "Marketplace", icon: Store, onClick: onOpenMarketplace },
        { label: "Command Center", icon: Shield, onClick: onOpenCommand },
      ],
    },
    {
      id: "create",
      label: "Criar",
      icon: Sparkles,
      items: [
        { label: "Galeria", icon: ImageIcon, onClick: onOpenGallery },
        { label: "Estúdios", icon: Sparkles, onClick: onOpenStudios },
        { label: "Artefatos", icon: Sparkles, onClick: onOpenArtifacts },
      ],
    },
    {
      id: "agents",
      label: "Agentes",
      icon: Star,
      items: [
        { label: "NPCs", icon: Star, onClick: onOpenNPCs },
        { label: "Memória IA", icon: Database, onClick: onOpenMemory },
        { label: "Governança", icon: Vote, onClick: onOpenGovernance, badge: notifications.governance },
        { label: "Observation Lab", icon: Eye, onClick: onOpenObservation },
      ],
    },
  ];

  return (
    <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2">
      {/* Left: Logo + Clock */}
      <div className="flex items-center gap-2 pointer-events-auto shrink-0">
        <div className="glass-panel rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
          <img src={logoOriginal} alt="Logo" className="w-6 h-6" />
          <span className="font-display font-bold text-foreground text-sm hidden sm:block">The Good City</span>
        </div>
        <LocalClock />
      </div>

      {/* Center: Grouped menus */}
      <div className="flex-1 min-w-0 pointer-events-auto flex justify-center">
        <div className="glass-panel rounded-xl flex items-center gap-0.5 px-1.5 py-1 shadow-lg">
          {menuGroups.map((g) => (
            <ToolbarGroup
              key={g.id}
              group={g}
              isOpen={openMenuId === g.id}
              onToggle={() => toggle(g.id)}
            />
          ))}
        </div>
      </div>

      {/* Right: Status + Actions */}
      <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
        {nearbyAgent && (
          <div className="glass-panel rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-lg border border-accent/30">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: nearbyAgent.color }} />
            <span className="text-xs text-foreground font-medium">{nearbyAgent.name}</span>
            <kbd className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">ESPAÇO</kbd>
          </div>
        )}

        <div className="glass-panel rounded-xl px-2.5 py-1.5 flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-medium text-foreground">{activeCount}</span>
          <div className="w-px h-3.5 bg-border" />
          <Wifi className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{agentCount}</span>
        </div>

        <div className="flex items-center gap-1">
          {onRoomEditor && (
            <button onClick={onRoomEditor} className="glass-panel rounded-xl p-2 hover:bg-muted/30 transition-all shadow-lg" title="Editor" aria-label="Editor de Salas">
              <Home className="w-4 h-4 text-foreground" />
            </button>
          )}
          {onCustomize && (
            <button onClick={onCustomize} className="glass-panel rounded-xl p-2 hover:bg-muted/30 transition-all shadow-lg" title="Personalizar" aria-label="Personalizar">
              <Palette className="w-4 h-4 text-foreground" />
            </button>
          )}
          <button className="glass-panel rounded-xl p-2 hover:bg-muted/30 transition-all shadow-lg" title="Configurações" aria-label="Configurações">
            <Settings className="w-4 h-4 text-foreground" />
          </button>
          {onLogout && (
            <button onClick={onLogout} className="glass-panel rounded-xl p-2 hover:bg-destructive/20 transition-all shadow-lg" title="Sair" aria-label="Sair">
              <LogOut className="w-4 h-4 text-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
