/**
 * CityHUD — Clean, categorized heads-up display.
 * Replaces the 20+ individual buttons with grouped menus.
 */

import { memo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Car, Plane, MessageCircle, Target, ShoppingBag,
  Briefcase, Bot, Globe, Settings, Map, Users, Gamepad2,
  ChevronUp, X, Zap,
} from "lucide-react";
import { useGameStore, type PanelName } from "@/stores/gameStore";

const MENU_GROUPS = [
  {
    id: "nav" as const,
    label: "Navegação",
    icon: Map,
    items: [
      { panel: "teleport" as PanelName, icon: Zap, label: "Teleporte", color: "text-cyan-400" },
      { panel: "vehicleShop" as PanelName, icon: Car, label: "Veículos", color: "text-blue-400" },
    ],
  },
  {
    id: "social" as const,
    label: "Social",
    icon: Users,
    items: [
      { panel: "chat" as PanelName, icon: MessageCircle, label: "Chat", color: "text-emerald-400" },
      { panel: "proximity" as PanelName, icon: Users, label: "Próximos", color: "text-green-400" },
      { panel: "publicSpaces" as PanelName, icon: Globe, label: "Espaços", color: "text-sky-400" },
    ],
  },
  {
    id: "work" as const,
    label: "Trabalho",
    icon: Briefcase,
    items: [
      { panel: "missions" as PanelName, icon: Target, label: "Missões", color: "text-red-400", badge: 3 },
      { panel: "marketplace" as PanelName, icon: ShoppingBag, label: "Marketplace", color: "text-amber-400" },
      { panel: "personalAgent" as PanelName, icon: Bot, label: "Agente IA", color: "text-violet-400" },
    ],
  },
  {
    id: "more" as const,
    label: "Mais",
    icon: Gamepad2,
    items: [
      { panel: "leaderboard" as PanelName, icon: Gamepad2, label: "Ranking", color: "text-yellow-400" },
      { panel: "settings" as PanelName, icon: Settings, label: "Config", color: "text-gray-400" },
    ],
  },
];

function GroupMenu({ group, onSelect, isOpen, onToggle }: {
  group: typeof MENU_GROUPS[0];
  onSelect: (panel: PanelName) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = group.icon;

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium"
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{group.label}</span>
        <ChevronUp className={`w-3 h-3 transition-transform ${isOpen ? "" : "rotate-180"}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1.5 left-0 min-w-[140px] rounded-xl bg-black/80 backdrop-blur-lg border border-white/10 overflow-hidden z-50"
          >
            {group.items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.panel}
                  onClick={() => { onSelect(item.panel); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ItemIcon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-[8px] bg-red-500 text-white px-1 rounded-sm font-bold">
                      {item.badge}
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

export const CityHUD = memo(function CityHUD() {
  const navigate = useNavigate();
  const {
    world, player, vehicle, ui,
    togglePanel, openPanel, setMovementMode,
    enterVehicle, exitVehicle, setShowIntro,
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
          {/* Left: Back + City info */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/city")}
              className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-gray-300 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
              <span className="text-sm font-bold text-white">
                {world.currentCity.flag} {world.currentCity.name}
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
                Live
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-amber-700/30">
              <span className="text-xs">🪙</span>
              <span className="text-xs font-bold text-amber-400 font-mono">1,250</span>
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
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-400/20 backdrop-blur-md border border-emerald-400/50 text-emerald-400 text-xs font-medium font-mono">
                <Car className="w-3.5 h-3.5" />
                <span className="text-[8px] bg-black/40 px-1 py-0.5 rounded">[E] Sair</span>
              </div>
            )}

            <button
              onClick={() => setMovementMode(isFlying ? "walk" : "fly")}
              className={`p-2 rounded-xl backdrop-blur-md border text-xs transition-all ${
                isFlying
                  ? "bg-emerald-400/20 border-emerald-400/50 text-emerald-400"
                  : "bg-black/60 border-white/10 text-gray-300 hover:text-white"
              }`}
              title="Modo Voo"
            >
              <Plane className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Active panel close button ── */}
      {ui.activePanel && (
        <button
          onClick={() => useGameStore.getState().closePanel()}
          className="absolute top-16 right-4 z-50 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-gray-300 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* ── Bottom: Mini objective + controls hint ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40"
      >
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/50 backdrop-blur-md border border-white/8 text-[10px] text-gray-400 font-mono">
          <span>WASD Mover</span>
          <span className="text-white/20">|</span>
          <span>Mouse Câmera</span>
          <span className="text-white/20">|</span>
          <span>E Veículo</span>
          <span className="text-white/20">|</span>
          <span>Click Destino</span>
        </div>
      </motion.div>
    </>
  );
});
