/**
 * CityExplore — Main city exploration page.
 * Uses gameStore for all central state, CityHUD for UI, inputStore for input.
 * No more 20+ useState calls — everything flows through the centralized stores.
 */

import { useMemo, useCallback, Suspense, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { CityExploreScene } from "@/components/office/3d/CityExploreScene";
import { useOSMCity } from "@/hooks/useOSMCity";
import { CityHUD } from "@/components/city/CityHUD";
import { CityLocationSelector } from "@/components/city/CityLocationSelector";
import { CityLeaderboard } from "@/components/city/CityLeaderboard";
import { CityRanking } from "@/components/city/CityRanking";
import { CityAdPlacement } from "@/components/city/CityAdPlacement";
import { CityActivityTicker } from "@/components/city/CityActivityTicker";
import { VehicleShop } from "@/components/city/VehicleShop";
import { CityChat } from "@/components/city/CityChat";
import { DailyMissions } from "@/components/city/DailyMissions";
import { CityMiniMap } from "@/components/city/CityMiniMap";
import { CinematicIntro } from "@/components/city/CinematicIntro";
import { CityMarketplace } from "@/components/city/CityMarketplace";
import { useCityBuildings } from "@/hooks/useCityBuildings";
import { ProximityChat } from "@/components/collaboration/ProximityChat";
import { InteractiveObjects } from "@/components/collaboration/InteractiveObjects";
import { UserStatusSystem } from "@/components/collaboration/UserStatusSystem";
import { TeleportSystem } from "@/components/collaboration/TeleportSystem";
import { PersonalAgent } from "@/components/collaboration/PersonalAgent";
import { TeamAgents } from "@/components/collaboration/TeamAgents";
import { PublicWorkspaces } from "@/components/collaboration/PublicWorkspaces";
import { MessengerHub } from "@/components/collaboration/MessengerHub";
import { AgentTraining } from "@/components/collaboration/AgentTraining";
import { MeetingSystem } from "@/components/workspace/MeetingSystem";
import { TeamChatSystem } from "@/components/workspace/TeamChatSystem";
import { FocusMode } from "@/components/workspace/FocusMode";
import { TeamAnalytics } from "@/components/workspace/TeamAnalytics";
import { VirtualEvents } from "@/components/workspace/VirtualEvents";
import { ScreenSharing } from "@/components/workspace/ScreenSharing";
import { ToolIntegrations } from "@/components/workspace/ToolIntegrations";
import { TeamEngagement } from "@/components/workspace/TeamEngagement";
import type { TransportType } from "@/types/building";
import { useGameStore, type PanelName } from "@/stores/gameStore";
import { initInputListeners } from "@/stores/inputStore";
import { motion } from "framer-motion";

export default function CityExplore() {
  const navigate = useNavigate();

  // ── Centralized state from gameStore ──
  const activePanel = useGameStore(s => s.ui.activePanel);
  const showIntro = useGameStore(s => s.ui.showIntro);
  const cityReady = useGameStore(s => s.world.cityReady);
  const playerPos = useGameStore(s => s.player.position);
  const vehicle = useGameStore(s => s.vehicle);
  const world = useGameStore(s => s.world);
  const closePanel = useGameStore(s => s.closePanel);
  const openPanel = useGameStore(s => s.openPanel);
  const setShowIntro = useGameStore(s => s.setShowIntro);
  const setCityReady = useGameStore(s => s.setCityReady);
  const setPlayerPosition = useGameStore(s => s.setPlayerPosition);
  const enterVehicle = useGameStore(s => s.enterVehicle);

  // ── Init global input listeners once ──
  useEffect(() => {
    const cleanup = initInputListeners();
    console.log("[CityExplore:init] Input listeners initialized");
    return cleanup;
  }, []);

  // ── OSM real-world city hook ──
  const osmCity = useOSMCity();

  const userName = useMemo(() => {
    try {
      const stored = localStorage.getItem("agentoffice_user");
      return stored ? JSON.parse(stored).name || "Chefe" : "Chefe";
    } catch { return "Chefe"; }
  }, []);

  const { user } = useAuth();
  const userId = user?.id || "";

  const { visibleBuildings, userBuilding } = useCityBuildings(userId);

  const handleVehicleSelect = useCallback((type: TransportType, color: string) => {
    enterVehicle(type, color);
  }, [enterVehicle]);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, [setShowIntro]);

  const handleCityReady = useCallback(() => {
    setCityReady(true);
    const el = document.getElementById("city-loader");
    if (el) el.style.display = "none";
    console.log("[CityExplore:ready] City loaded");
  }, [setCityReady]);

  // Helper to check if a specific panel is open
  const isPanelOpen = (panel: PanelName) => activePanel === panel;

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-background">
      <SEOHead title="Explorar Cidade" description="Explore a cidade 3D com agentes IA, missões e economia virtual." path="/city-explore" />

      {/* Cinematic Intro */}
      {showIntro && (
        <CinematicIntro
          cityName={world.currentCity.name}
          cityFlag={world.currentCity.flag}
          playerName={userName}
          onComplete={handleIntroComplete}
        />
      )}

      {/* Loading overlay */}
      {!showIntro && !cityReady && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none" id="city-loader">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-muted-foreground font-mono tracking-wider">LOADING CITY...</p>
          </div>
        </div>
      )}

      {/* 3D City Scene */}
      <Suspense fallback={null}>
        <CityExploreScene
          playerName={userName}
          onBuildingClick={(id) => navigate(`/building/${id}`)}
          onReady={handleCityReady}
          osmBuildings={osmCity.data?.buildings}
          osmStreets={osmCity.data?.streets}
          osmTrees={osmCity.data?.trees}
          osmGreenAreas={osmCity.data?.greenAreas}
          osmBounds={osmCity.data?.bounds}
          isOSMMode={osmCity.isOSMMode}
        />
      </Suspense>

      {/* ── NEW UNIFIED HUD (replaces all old buttons) ── */}
      <CityHUD />

      {/* HUD additions that live outside the HUD component */}
      {!showIntro && (
        <>
          {/* Location selector (top left, next to back button) */}
          <div className="absolute top-14 left-4 z-40">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-panel border border-border">
              <CityLocationSelector
                loading={osmCity.loading}
                error={osmCity.error}
                activePreset={osmCity.activePreset}
                isOSMMode={osmCity.isOSMMode}
                onSelectPreset={osmCity.loadPreset}
                onCustomLocation={osmCity.loadCustomLocation}
                onSwitchToProcedural={osmCity.switchToProcedural}
                buildingCount={osmCity.data?.buildings.length || 0}
                streetCount={osmCity.data?.streets.length || 0}
              />
            </div>
          </div>

          {/* Mini Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute top-28 left-4 z-40"
          >
            <CityMiniMap
              playerPos={[playerPos[0], playerPos[1], playerPos[2]]}
              buildings={visibleBuildings}
              userBuildingId={userBuilding?.id}
            />
          </motion.div>

          {/* Activity Ticker */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30">
            <CityActivityTicker />
          </motion.div>

          {/* ── Overlay Panels (driven by gameStore.ui.activePanel) ── */}
          <CityLeaderboard isOpen={isPanelOpen("leaderboard")} onClose={closePanel} />
          <CityRanking isOpen={isPanelOpen("ranking")} onClose={closePanel} />
          <CityAdPlacement isOpen={isPanelOpen("ads")} onClose={closePanel} />
          <VehicleShop isOpen={isPanelOpen("vehicleShop")} onClose={closePanel} currentVehicle={vehicle.currentType} onSelect={handleVehicleSelect} />
          <DailyMissions isOpen={isPanelOpen("missions")} onClose={closePanel} />
          <CityMarketplace isOpen={isPanelOpen("marketplace")} onClose={closePanel} />
          <CityChat isOpen={isPanelOpen("chat")} onClose={closePanel} />

          {/* Collaboration Panels */}
          <ProximityChat isOpen={isPanelOpen("proximity")} onClose={closePanel} playerPos={[playerPos[0], playerPos[1], playerPos[2]]} />
          <InteractiveObjects isOpen={isPanelOpen("objects")} onClose={closePanel} />
          <UserStatusSystem isOpen={isPanelOpen("status")} onClose={closePanel} currentStatus="available" onStatusChange={() => {}} userName={userName} />
          <TeleportSystem isOpen={isPanelOpen("teleport")} onClose={closePanel} onTeleport={(pos) => setPlayerPosition(pos)} />
          <PersonalAgent isOpen={isPanelOpen("personalAgent")} onClose={closePanel} />
          <TeamAgents isOpen={isPanelOpen("teamAgents")} onClose={closePanel} />
          <PublicWorkspaces isOpen={isPanelOpen("publicSpaces")} onClose={closePanel} />
          <MessengerHub isOpen={isPanelOpen("messenger")} onClose={closePanel} />
          <AgentTraining isOpen={isPanelOpen("training")} onClose={closePanel} />

          {/* Workspace Panels */}
          <MeetingSystem isOpen={isPanelOpen("meeting")} onClose={closePanel} />
          <TeamChatSystem isOpen={isPanelOpen("teamChat")} onClose={closePanel} />
          <FocusMode isOpen={isPanelOpen("focusMode")} onClose={closePanel} currentMode="normal" onModeChange={() => {}} />
          <TeamAnalytics isOpen={isPanelOpen("analytics")} onClose={closePanel} />
          <VirtualEvents isOpen={isPanelOpen("events")} onClose={closePanel} />
          <ScreenSharing isOpen={isPanelOpen("screenShare")} onClose={closePanel} />
          <ToolIntegrations isOpen={isPanelOpen("integrations")} onClose={closePanel} />
          <TeamEngagement isOpen={isPanelOpen("engagement")} onClose={closePanel} />
        </>
      )}
    </div>
  );
}
