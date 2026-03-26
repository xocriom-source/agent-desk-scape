/**
 * CityHUD — Clean, minimal heads-up display for Flyover mode.
 * Includes mode toggle to switch back to Canvas view.
 */

import { memo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Car, Plane, MessageCircle, Target, ShoppingBag,
  Bot, Settings, Map, Users,
  ChevronUp, X, Zap, LayoutGrid,
} from "lucide-react";
import { useGameStore, type PanelName } from "@/stores/gameStore";

const MENU_GROUPS = [
  {
    id: "nav",
    label: "Navegação",
    icon: Map,
    items: [
      { panel: "teleport" as PanelName, icon: Zap, label: "Teleporte" },
      { panel: "vehicleShop" as PanelName, icon: Car, label: "Veículos" },
    ],
  },
  {
    id: "social",
    label: "Social",
    icon: Users,
    items: [
      { panel: "chat" as PanelName, icon: MessageCircle, label: "Chat" },
      { panel: "proximity" as PanelName, icon: Users, label: "Próximos" },
    ],
  },
  {
    id: "work",
    label: "Trabalho",
    icon: Target,
    items: [
      { panel: "missions" as PanelName, icon: Target, label: "Missões" },
      { panel: "marketplace" as PanelName, icon: ShoppingBag, label: "Marketplace" },
      { panel: "personalAgent" as PanelName, icon: Bot, label: "Agente IA" },
    ],
  },
];

function GroupMenu({ group, onSelect, isOpen, onToggle }: {
  group: (typeof MENU_GROUPS)[0];
  onSelect: (panel: PanelName) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = group.icon;

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-md border transition-all text-xs font-medium ${
          isOpen
            ? "bg-primary/20 border-primary/40 text-primary"
            : "bg-card/60 border-border text-foreground hover:bg-muted/40"
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{group.label}</span>
        <ChevronUp className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full mb-1.5 left-0 min-w-[150px] rounded-xl glass-panel border border-border overflow-hidden z-50 shadow-xl"
          >
            {group.items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.panel}
                  onClick={() => onSelect(item.panel)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-foreground hover:bg-muted/40 transition-colors"
                >
                  <ItemIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const CityHUD = memo(function CityHUD() {
  const navigate = useNavigate();
  const {
    world, player, vehicle, ui,
    openPanel, setMovementMode, setCityViewMode,
  } = useGameStore();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleToggleMenu = useCallback((id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }, []);

  const handleSelectPanel = useCallback((panel: PanelName) => {
    openPanel(panel);
    setOpenMenuId(null);
  }, [openPanel]);

  const isFlying = player.movementMode === "fly";

  if (!ui.hudVisible || ui.showIntro) return null;

  return (
    <>
      {/* ── Top Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-40 pointer-events-none"
      >
        <div className="mx-auto max-w-5xl px-3 py-2.5 flex items-center justify-between pointer-events-auto">
          {/* Left: Back + City */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/city")}
              className="p-2 rounded-xl glass-panel border border-border text-foreground hover:bg-muted/30 transition-all"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel border border-border">
              <span className="text-sm font-bold text-foreground">
                {world.currentCity.flag} {world.currentCity.name}
              </span>
              <span className="text-[11px] text-accent bg-accent/10 px-1.5 py-0.5 rounded-full font-medium">
                Live
              </span>
            </div>
          </div>

          {/* Center: Grouped menus */}
          <div className="flex items-center gap-1.5">
            {MENU_GROUPS.map((group) => (
              <GroupMenu
                key={group.id}
                group={group}
                isOpen={openMenuId === group.id}
                onToggle={() => handleToggleMenu(group.id)}
                onSelect={handleSelectPanel}
              />
            ))}
          </div>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-1.5">
            {vehicle.isInVehicle && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent/20 backdrop-blur-md border border-accent/40 text-accent text-xs font-medium">
                <Car className="w-3.5 h-3.5" />
                <kbd className="text-[10px] bg-background/40 px-1 py-0.5 rounded">E Sair</kbd>
              </div>
            )}

            <button
              onClick={() => setMovementMode(isFlying ? "walk" : "fly")}
              className={`p-2 rounded-xl backdrop-blur-md border text-xs transition-all ${
                isFlying
                  ? "bg-accent/20 border-accent/40 text-accent"
                  : "glass-panel border-border text-foreground hover:bg-muted/30"
              }`}
              title="Modo Voo"
              aria-label="Alternar modo de voo"
            >
              <Plane className="w-3.5 h-3.5" />
            </button>

            <button
              className="p-2 rounded-xl glass-panel border border-border text-foreground hover:bg-muted/30 transition-all"
              title="Configurações"
              aria-label="Configurações"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Active panel close ── */}
      {ui.activePanel && (
        <button
          onClick={() => useGameStore.getState().closePanel()}
          className="absolute top-14 right-4 z-50 p-2 rounded-xl glass-panel border border-border text-foreground hover:bg-muted/30 transition-all"
          aria-label="Fechar painel"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* ── Bottom: Controls hint ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40"
      >
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass-panel border border-border text-xs text-muted-foreground">
          <span><kbd className="font-semibold text-foreground">WASD</kbd> Mover</span>
          <span className="text-border">|</span>
          <span><kbd className="font-semibold text-foreground">Mouse</kbd> Câmera</span>
          <span className="text-border">|</span>
          <span><kbd className="font-semibold text-foreground">E</kbd> Veículo</span>
        </div>
      </motion.div>
    </>
  );
});
