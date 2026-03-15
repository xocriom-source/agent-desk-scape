import { useMemo, useState, useCallback, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Users2, Trophy, Megaphone, Plane, Search, ShoppingBag, MessageCircle, Target, Car, Award, Briefcase, Dna, Users, Zap, Bot, Globe, Monitor, Video, Hash, Eye, BarChart3, Calendar, Gamepad2, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { CityExploreScene } from "@/components/office/3d/CityExploreScene";
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
import { UserStatusSystem, type UserStatus } from "@/components/collaboration/UserStatusSystem";
import { TeleportSystem } from "@/components/collaboration/TeleportSystem";
import { PersonalAgent } from "@/components/collaboration/PersonalAgent";
import { TeamAgents } from "@/components/collaboration/TeamAgents";
import { PublicWorkspaces } from "@/components/collaboration/PublicWorkspaces";
import { MessengerHub } from "@/components/collaboration/MessengerHub";
import { AgentTraining } from "@/components/collaboration/AgentTraining";
import { MeetingSystem } from "@/components/workspace/MeetingSystem";
import { TeamChatSystem } from "@/components/workspace/TeamChatSystem";
import { FocusMode, type FocusModeType } from "@/components/workspace/FocusMode";
import { TeamAnalytics } from "@/components/workspace/TeamAnalytics";
import { VirtualEvents } from "@/components/workspace/VirtualEvents";
import { ScreenSharing } from "@/components/workspace/ScreenSharing";
import { ToolIntegrations } from "@/components/workspace/ToolIntegrations";
import { TeamEngagement } from "@/components/workspace/TeamEngagement";
import type { TransportType } from "@/types/building";
import logo from "@/assets/logo.png";

export default function CityExplore() {
  const navigate = useNavigate();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showAds, setShowAds] = useState(false);
  const [showVehicleShop, setShowVehicleShop] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [flyMode, setFlyMode] = useState(false);
  const [inVehicle, setInVehicle] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<TransportType>("car");
  const [vehicleColor, setVehicleColor] = useState("#4A90D9");
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 0, 5]);
  const [showIntro, setShowIntro] = useState(true);
  const [cityReady, setCityReady] = useState(false);

  // Collaboration states
  const [showProximity, setShowProximity] = useState(false);
  const [showObjects, setShowObjects] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showTeleport, setShowTeleport] = useState(false);
  const [showPersonalAgent, setShowPersonalAgent] = useState(false);
  const [showTeamAgents, setShowTeamAgents] = useState(false);
  const [showPublicSpaces, setShowPublicSpaces] = useState(false);
  const [showMessenger, setShowMessenger] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus>("available");

  // Workspace states
  const [showMeeting, setShowMeeting] = useState(false);
  const [showTeamChat, setShowTeamChat] = useState(false);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showScreenShare, setShowScreenShare] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showEngagement, setShowEngagement] = useState(false);
  const [focusMode, setFocusMode] = useState<FocusModeType>("normal");

  const userName = useMemo(() => {
    const stored = localStorage.getItem("agentoffice_user");
    return stored ? JSON.parse(stored).name || "Chefe" : "Chefe";
  }, []);

  const cityData = useMemo(() => {
    const stored = localStorage.getItem("agentoffice_city");
    return stored ? JSON.parse(stored) : { name: "São Paulo", flag: "🇧🇷" };
  }, []);

  const userId = useMemo(() => {
    const stored = localStorage.getItem("agentoffice_user");
    return stored ? JSON.parse(stored).email || "" : "";
  }, []);

  const { visibleBuildings, userBuilding } = useCityBuildings(userId);

  const handleVehicleSelect = useCallback((type: TransportType, color: string) => {
    setCurrentVehicle(type);
    setVehicleColor(color);
  }, []);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const handleCityReady = useCallback(() => {
    setCityReady(true);
    const el = document.getElementById("city-loader");
    if (el) el.style.display = "none";
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none" style={{ backgroundColor: "#0A0C14" }}>
      {/* Cinematic Intro */}
      {showIntro && (
        <CinematicIntro
          cityName={cityData.name}
          cityFlag={cityData.flag}
          playerName={userName}
          onComplete={handleIntroComplete}
        />
      )}

      {/* Loading overlay */}
      {!showIntro && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none" id="city-loader">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500 font-mono tracking-wider">LOADING CITY...</p>
          </div>
        </div>
      )}

      {/* 3D City Scene */}
      <Suspense fallback={null}>
        <CityExploreScene
          playerName={userName}
          flyMode={flyMode}
          inVehicle={inVehicle}
          vehicleType={currentVehicle}
          vehicleColor={vehicleColor}
          onVehicleToggle={setInVehicle}
          onBuildingClick={(id) => navigate(`/building/${id}`)}
          onReady={handleCityReady}
        />
      </Suspense>

      {/* HUD - only show after intro */}
      {!showIntro && (
        <>
          {/* Top HUD */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-0 left-0 right-0 z-40"
          >
            <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate("/city")} className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50">
                  <img src={logo} alt="" className="w-5 h-5" />
                  <span className="text-sm font-bold text-white">{cityData.flag} {cityData.name}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">Live</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-amber-700/30">
                  <span className="text-xs">🪙</span>
                  <span className="text-xs font-bold text-amber-400 font-mono">1,250</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {inVehicle && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-400/20 backdrop-blur-md border border-emerald-400/50 text-emerald-400 text-xs font-medium font-mono">
                    <Car className="w-3.5 h-3.5" />
                    <span className="text-[8px] bg-black/40 px-1 py-0.5 rounded">[E]</span>
                  </div>
                )}

                <button onClick={() => setFlyMode(!flyMode)} className={`flex items-center gap-1 px-2.5 py-2 rounded-xl backdrop-blur-md border text-xs font-medium transition-all ${flyMode ? "bg-emerald-400/20 border-emerald-400/50 text-emerald-400" : "bg-black/60 border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80"}`}>
                  <Plane className="w-3.5 h-3.5" />
                </button>

                <button onClick={() => setShowMissions(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium">
                  <Target className="w-3.5 h-3.5" />
                  <span className="text-[8px] bg-red-500 text-white px-1 rounded-sm font-bold">3</span>
                </button>

                <button onClick={() => setShowChat(!showChat)} className={`flex items-center gap-1 px-2.5 py-2 rounded-xl backdrop-blur-md border text-xs font-medium transition-all ${showChat ? "bg-emerald-400/20 border-emerald-400/50 text-emerald-400" : "bg-black/60 border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80"}`}>
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>

                <button onClick={() => setShowProximity(!showProximity)} className={`flex items-center gap-1 px-2.5 py-2 rounded-xl backdrop-blur-md border text-xs font-medium transition-all ${showProximity ? "bg-emerald-400/20 border-emerald-400/50 text-emerald-400" : "bg-black/60 border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80"}`}>
                  <Users className="w-3.5 h-3.5" />
                </button>

                <button onClick={() => setShowTeleport(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-cyan-700/30 text-cyan-400 hover:bg-cyan-400/10 transition-all text-xs font-medium">
                  <Zap className="w-3.5 h-3.5" />
                </button>

                <button onClick={() => setShowPersonalAgent(!showPersonalAgent)} className={`flex items-center gap-1 px-2.5 py-2 rounded-xl backdrop-blur-md border text-xs font-medium transition-all ${showPersonalAgent ? "bg-violet-400/20 border-violet-400/50 text-violet-400" : "bg-black/60 border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80"}`}>
                  <Bot className="w-3.5 h-3.5" />
                </button>

                <button onClick={() => setShowPublicSpaces(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium">
                  <Globe className="w-3.5 h-3.5" />
                </button>

                <button onClick={() => setShowStatus(!showStatus)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium">
                  <div className={`w-2.5 h-2.5 rounded-full ${userStatus === "available" ? "bg-emerald-400" : userStatus === "focused" ? "bg-amber-400" : userStatus === "in-meeting" ? "bg-red-400" : "bg-gray-500"}`} />
                </button>

                <button onClick={() => setShowVehicleShop(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </button>

                <button onClick={() => setShowMarketplace(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-amber-700/30 text-amber-400 hover:bg-amber-400/10 transition-all text-xs font-medium">
                  <Briefcase className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowRanking(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium">
                  <Award className="w-3.5 h-3.5" />
                </button>
                {/* Workspace tools */}
                <button onClick={() => setShowMeeting(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-red-700/30 text-red-400 hover:bg-red-400/10 transition-all text-xs font-medium" title="Reuniões">
                  <Video className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowTeamChat(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium" title="Team Chat">
                  <Hash className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowFocusMode(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium" title="Foco">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowAnalytics(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium" title="Analytics">
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowEvents(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium" title="Eventos">
                  <Calendar className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowScreenShare(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium" title="Compartilhar">
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowIntegrations(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium" title="Integrações">
                  <Link2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowEngagement(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium" title="Engajamento">
                  <Gamepad2 className="w-3.5 h-3.5" />
                </button>

                <button onClick={() => navigate("/ecosystem")} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-violet-700/30 text-violet-400 hover:bg-violet-400/10 transition-all text-xs font-medium" title="Ecosystem">
                  <Dna className="w-3.5 h-3.5" />
                </button>

                <button onClick={() => setShowLeaderboard(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium">
                  <Trophy className="w-3.5 h-3.5" />
                </button>

                <button onClick={() => setShowAds(true)} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium">
                  <Megaphone className="w-3.5 h-3.5" />
                </button>

                <button onClick={() => navigate("/find-building")} className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium">
                  <Search className="w-3.5 h-3.5" />
                </button>

                <button onClick={() => navigate("/office")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/80 backdrop-blur-md border border-primary/50 text-white hover:bg-primary transition-all text-xs font-medium">
                  <Building2 className="w-3.5 h-3.5" />
                  Prédio
                </button>
              </div>
            </div>
          </motion.div>

          {/* Flight mode popup */}
          {flyMode && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
              <div className="bg-gray-950/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl px-8 py-6 text-center shadow-2xl">
                <h3 className="text-sm font-bold text-gray-300 tracking-widest mb-4 font-mono">FLIGHT CONTROLS</h3>
                <p className="text-[10px] text-gray-500 mb-3 font-mono">CLICK THE SCREEN TO LOCK MOUSE</p>
                <div className="space-y-2 text-xs font-mono">
                  {[["W A S D", "MOVE"], ["MOUSE", "LOOK"], ["SPACE", "UP"], ["CTRL", "DOWN"], ["SHIFT", "BOOST"]].map(([k, a]) => (
                    <div key={k} className="flex justify-between gap-8">
                      <span className="text-white font-bold">{k}</span>
                      <span className="text-gray-500">{a}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setFlyMode(false)} className="mt-4 px-6 py-2.5 bg-primary text-white text-xs font-bold tracking-wider rounded-lg hover:bg-primary/80 transition-colors font-mono">
                  LET'S FLY!
                </button>
              </div>
            </motion.div>
          )}

          {/* Chat panel */}
          <CityChat isOpen={showChat} onClose={() => setShowChat(false)} />

          {/* Mini Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute top-20 left-4 z-40"
          >
            <CityMiniMap
              playerPos={playerPos}
              buildings={visibleBuildings}
              userBuildingId={userBuilding?.id}
            />
          </motion.div>

          {/* Activity Ticker */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40">
            <CityActivityTicker />
          </motion.div>

          {/* Bottom controls */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-gray-700/50">
              {[["WASD", "andar"], ["CLICK", "ir"], ["SCROLL", "zoom"], ["E", "veículo"], ["DRAG", "câmera"]].map(([k, a], i) => (
                <span key={k} className="text-[10px] text-gray-400 flex items-center gap-1">
                  {i > 0 && <span className="text-gray-600 mr-1">•</span>}
                  <span className="text-white font-bold">{k}</span> {a}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Building count */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="absolute bottom-4 left-4 z-40">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50">
              <Users2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] text-gray-300">{visibleBuildings.length} prédios</span>
            </div>
          </motion.div>

          {/* Lo-fi */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute bottom-4 right-4 z-40">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 cursor-pointer hover:bg-black/80 transition-all">
              <span className="text-[10px] text-gray-400">▶ LO-FI</span>
            </div>
          </motion.div>

          {/* Overlay Panels */}
          <CityLeaderboard isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
          <CityRanking isOpen={showRanking} onClose={() => setShowRanking(false)} />
          <CityAdPlacement isOpen={showAds} onClose={() => setShowAds(false)} />
          <VehicleShop isOpen={showVehicleShop} onClose={() => setShowVehicleShop(false)} currentVehicle={currentVehicle} onSelect={handleVehicleSelect} />
          <DailyMissions isOpen={showMissions} onClose={() => setShowMissions(false)} />
          <CityMarketplace isOpen={showMarketplace} onClose={() => setShowMarketplace(false)} />

          {/* Collaboration Panels */}
          <ProximityChat isOpen={showProximity} onClose={() => setShowProximity(false)} playerPos={playerPos} />
          <InteractiveObjects isOpen={showObjects} onClose={() => setShowObjects(false)} />
          <UserStatusSystem isOpen={showStatus} onClose={() => setShowStatus(false)} currentStatus={userStatus} onStatusChange={setUserStatus} userName={userName} />
          <TeleportSystem isOpen={showTeleport} onClose={() => setShowTeleport(false)} onTeleport={setPlayerPos} />
          <PersonalAgent isOpen={showPersonalAgent} onClose={() => setShowPersonalAgent(false)} />
          <TeamAgents isOpen={showTeamAgents} onClose={() => setShowTeamAgents(false)} />
          <PublicWorkspaces isOpen={showPublicSpaces} onClose={() => setShowPublicSpaces(false)} />
          <MessengerHub isOpen={showMessenger} onClose={() => setShowMessenger(false)} />
          <AgentTraining isOpen={showTraining} onClose={() => setShowTraining(false)} />
        </>
      )}
    </div>
  );
}
