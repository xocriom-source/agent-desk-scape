import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FeatureGate } from "@/components/plan/FeatureGate";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { OfficeScene } from "@/components/office/3d/OfficeScene";
import { TopBar } from "@/components/office/TopBar";
import { ActionBar } from "@/components/office/ActionBar";
import { ActivityLog } from "@/components/office/ActivityLog";
import { MiniMap } from "@/components/office/MiniMap";
import { AgentPanel } from "@/components/office/AgentPanel";
import { ObserverCard } from "@/components/office/ObserverCard";
import { SocialFeed } from "@/components/office/SocialFeed";
import { TaskBoard } from "@/components/office/TaskBoard";
import { AgentMessaging } from "@/components/office/AgentMessaging";
import { AgentGallery } from "@/components/office/AgentGallery";
import { CreativeStudios } from "@/components/office/CreativeStudios";
import { AnalyticsDashboard } from "@/components/office/AnalyticsDashboard";
import { AgentMarketplace } from "@/components/office/AgentMarketplace";
import { AIGovernance } from "@/components/office/AIGovernance";
import { AgentMemory } from "@/components/office/AgentMemory";
import { CommandCenter } from "@/components/office/CommandCenter";
import { CharacterCustomizer, type PlayerConfig } from "@/components/office/CharacterCustomizer";
import { RoomEditor } from "@/components/office/RoomEditor";
import { ArtifactExplorer } from "@/components/office/ArtifactExplorer";
import { CityNPCs } from "@/components/office/CityNPCs";
import { ObservationLab } from "@/components/office/ObservationLab";
import { DistrictInfo } from "@/components/office/DistrictInfo";
import { CityEvents } from "@/components/office/CityEvents";
import { CityChat } from "@/components/office/CityChat";
import { useOfficeState } from "@/hooks/useOfficeState";
import { usePanelState } from "@/hooks/office/usePanelState";
import { useAuth } from "@/contexts/AuthContext";
import { ROOMS, setRooms, FURNITURE, setFurniture, getRoomAt, type RoomDef, type FurnitureItem, DEFAULT_ROOMS, DEFAULT_FURNITURE } from "@/data/officeMap";
import { tileFromFloat } from "@/hooks/office/movementUtils";
import type { Agent } from "@/types/agent";

const Index = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { openPanel, open, close, isOpen } = usePanelState();
  const [rooms, setLocalRooms] = useState<RoomDef[]>(() => [...DEFAULT_ROOMS]);
  const [furnitureItems, setLocalFurniture] = useState<FurnitureItem[]>(() => [...DEFAULT_FURNITURE]);
  const [editMode, setEditMode] = useState(false);
  const [profileAgent, setProfileAgent] = useState<Agent | null>(null);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [hoveredFurnitureId, setHoveredFurnitureId] = useState<string | null>(null);
  const [notifCounts] = useState({ feed: 3, tasks: 2, messages: 5, governance: 1, events: 2 });
  const [playerConfig, setPlayerConfig] = useState<PlayerConfig>(() => {
    try {
      const saved = localStorage.getItem("playerConfig");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: profile?.display_name || "Chefe",
      color: "#4F46E5",
      hairStyle: "spiky",
      outfitStyle: "suit",
      skinTone: "medium",
      accessory: "none",
    };
  });

  // Sync player name with auth profile (no localStorage auth check needed - ProtectedRoute handles it)
  useEffect(() => {
    if (profile?.display_name) {
      setPlayerConfig((prev) => ({ ...prev, name: profile.display_name || prev.name }));
    }
  }, [profile?.display_name]);

  const {
    agents,
    player,
    selectedAgent,
    setSelectedAgent,
    showActivityLog,
    toggleActivityLog,
    allLogs,
    nearbyAgent,
    movePlayer,
    setPlayerDestination,
    nearbyInteractable,
    activeInteraction,
    interactionMessage,
    interact,
  } = useOfficeState(playerConfig.name);

  // Current room detection for HUD
  const currentRoom = useMemo(() => {
    const pTile = tileFromFloat(player.x, player.y);
    return getRoomAt(pTile.x, pTile.y);
  }, [player.x, player.y]);

  // Agent activity notifications
  const lastArtifactCount = useRef(agents.reduce((sum, a) => sum + a.totalCreations, 0));
  const lastCollabCount = useRef(agents.reduce((sum, a) => sum + a.totalCollaborations, 0));

  useEffect(() => {
    const newArtifacts = agents.reduce((sum, a) => sum + a.totalCreations, 0);
    const newCollabs = agents.reduce((sum, a) => sum + a.totalCollaborations, 0);

    if (newArtifacts > lastArtifactCount.current) {
      const creator = agents.find(a => a.artifacts[0]?.createdAt && Date.now() - a.artifacts[0].createdAt.getTime() < 3000);
      if (creator) {
        toast(`🎨 ${creator.name} criou: ${creator.artifacts[0]?.title}`, {
          description: `Na sala ${creator.room}`,
          duration: 4000,
        });
      }
    }
    if (newCollabs > lastCollabCount.current) {
      const collaber = agents.find(a => a.totalCollaborations > 0);
      if (collaber) {
        toast(`🤝 Nova colaboração detectada!`, {
          description: `${collaber.name} na ${collaber.room}`,
          duration: 3000,
        });
      }
    }

    lastArtifactCount.current = newArtifacts;
    lastCollabCount.current = newCollabs;
  }, [agents]);

  const handleSaveCharacter = (config: PlayerConfig) => {
    setPlayerConfig(config);
    localStorage.setItem("playerConfig", JSON.stringify(config));
    localStorage.setItem("playerName", config.name);
    const user = localStorage.getItem("agentoffice_user");
    if (user) {
      const parsed = JSON.parse(user);
      parsed.name = config.name;
      localStorage.setItem("agentoffice_user", JSON.stringify(parsed));
    }
  };

  const handleUpdateRooms = (newRooms: RoomDef[]) => {
    setLocalRooms(newRooms);
    setRooms(newRooms);
  };

  const handleUpdateFurniture = (items: FurnitureItem[]) => {
    setLocalFurniture(items);
    setFurniture(items);
  };

  const handleFurnitureClick = (id: string) => {
    if (editMode) {
      setSelectedFurnitureId(prev => prev === id ? null : id);
    }
  };

  const handleDeleteSelectedFurniture = () => {
    if (selectedFurnitureId) {
      handleUpdateFurniture(furnitureItems.filter(f => f.id !== selectedFurnitureId));
      setSelectedFurnitureId(null);
    }
  };

  const handleMoveFurniture = (dx: number, dz: number) => {
    if (selectedFurnitureId) {
      handleUpdateFurniture(furnitureItems.map(f =>
        f.id === selectedFurnitureId ? { ...f, x: f.x + dx, y: f.y + dz } : f
      ));
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-canvas select-none">
      <TopBar
        agentCount={agents.length}
        activeCount={agents.filter((a) => a.status === "active").length}
        nearbyAgent={nearbyAgent}
        onCustomize={() => open("customizer")}
        onRoomEditor={() => { open("roomEditor"); setEditMode(true); }}
        onLogout={async () => {
          await signOut();
          navigate("/login");
        }}
        onOpenFeed={() => open("feed")}
        onOpenTasks={() => open("tasks")}
        onOpenMessaging={() => open("messaging")}
        onOpenGallery={() => open("gallery")}
        onOpenStudios={() => open("studios")}
        onOpenAnalytics={() => open("analytics")}
        onOpenMarketplace={() => open("marketplace")}
        onOpenGovernance={() => open("governance")}
        onOpenMemory={() => open("memory")}
        onOpenCommand={() => open("command")}
        onOpenArtifacts={() => open("artifacts")}
        onOpenNPCs={() => open("npcs")}
        onOpenObservation={() => open("observation")}
        onOpenDistricts={() => open("districts")}
        onOpenEvents={() => open("events")}
        onOpenCityChat={() => open("cityChat")}
        notifications={notifCounts}
      />

      <OfficeScene
        agents={agents}
        player={{ ...player, name: playerConfig.name }}
        rooms={rooms}
        furniture={furnitureItems}
        playerConfig={playerConfig}
        selectedAgentId={selectedAgent?.id}
        onAgentClick={setSelectedAgent}
        editMode={editMode}
        selectedFurnitureId={selectedFurnitureId}
        hoveredFurnitureId={hoveredFurnitureId}
        onFurnitureClick={handleFurnitureClick}
        onFurnitureHover={setHoveredFurnitureId}
        onMapClick={(x, y) => setPlayerDestination(x, y)}
      />

      {/* Edit mode toolbar */}
      {editMode && selectedFurnitureId && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 glass-panel rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl">
          <span className="text-xs font-medium text-foreground">Mover item:</span>
          <div className="flex gap-1">
            <button onClick={() => handleMoveFurniture(-1, 0)} className="px-2 py-1 bg-muted rounded-lg text-sm hover:bg-muted/70">←</button>
            <button onClick={() => handleMoveFurniture(0, -1)} className="px-2 py-1 bg-muted rounded-lg text-sm hover:bg-muted/70">↑</button>
            <button onClick={() => handleMoveFurniture(0, 1)} className="px-2 py-1 bg-muted rounded-lg text-sm hover:bg-muted/70">↓</button>
            <button onClick={() => handleMoveFurniture(1, 0)} className="px-2 py-1 bg-muted rounded-lg text-sm hover:bg-muted/70">→</button>
          </div>
          <button onClick={handleDeleteSelectedFurniture} className="px-3 py-1 bg-destructive/10 text-destructive rounded-lg text-xs font-medium hover:bg-destructive/20">
            Excluir
          </button>
          <button onClick={() => setSelectedFurnitureId(null)} className="px-3 py-1 bg-muted rounded-lg text-xs hover:bg-muted/70">
            Fechar
          </button>
        </div>
      )}

      {/* Current room indicator */}
      {!editMode && currentRoom && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="px-3 py-1 glass-panel rounded-full text-xs font-medium text-foreground/80 shadow-sm animate-in fade-in duration-500">
            📍 {currentRoom.name}
          </div>
        </div>
      )}

      <ActivityLog logs={allLogs} isOpen={showActivityLog} onToggle={toggleActivityLog} />
      <AgentPanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} onViewProfile={(a) => setProfileAgent(a)} />
      <ObserverCard agent={profileAgent} isOpen={!!profileAgent} onClose={() => setProfileAgent(null)} />
      
      {/* Panels - conditionally rendered to save memory */}
      {isOpen("feed") && <SocialFeed agents={agents} isOpen onClose={close} />}
      {isOpen("tasks") && <TaskBoard agents={agents} isOpen onClose={close} />}
      {isOpen("messaging") && <AgentMessaging agents={agents} isOpen onClose={close} />}
      {isOpen("gallery") && <AgentGallery agents={agents} isOpen onClose={close} />}
      {isOpen("studios") && <CreativeStudios agents={agents} isOpen onClose={close} />}
      {isOpen("analytics") && <AnalyticsDashboard agents={agents} isOpen onClose={close} />}
      {isOpen("marketplace") && <AgentMarketplace agents={agents} isOpen onClose={close} />}
      {isOpen("governance") && <AIGovernance agents={agents} isOpen onClose={close} />}
      {isOpen("memory") && <AgentMemory agents={agents} isOpen onClose={close} />}
      {isOpen("command") && <CommandCenter agents={agents} isOpen onClose={close} />}
      {isOpen("artifacts") && <ArtifactExplorer agents={agents} isOpen onClose={close} />}
      {isOpen("npcs") && <CityNPCs isOpen onClose={close} />}
      {isOpen("observation") && <ObservationLab agents={agents} isOpen onClose={close} />}
      {isOpen("districts") && <DistrictInfo isOpen onClose={close} />}
      {isOpen("events") && <CityEvents agents={agents} isOpen onClose={close} />}
      {isOpen("cityChat") && <CityChat agents={agents} isOpen onClose={close} />}

      {!editMode && <ActionBar onMove={movePlayer} />}
      {!editMode && <MiniMap player={player} agents={agents} rooms={rooms} />}

      {/* Furniture interaction prompt */}
      {!editMode && nearbyInteractable && !activeInteraction && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={interact}
            className="px-4 py-2 bg-primary/90 text-primary-foreground rounded-xl text-sm font-medium shadow-lg hover:bg-primary transition-colors flex items-center gap-2 backdrop-blur-sm border border-primary/30"
          >
            <span className="text-base">{nearbyInteractable.emoji}</span>
            <span>{nearbyInteractable.label}</span>
            <kbd className="ml-1 px-1.5 py-0.5 bg-primary-foreground/20 rounded text-[10px] font-mono">SPACE</kbd>
          </button>
        </div>
      )}

      {/* Active interaction feedback */}
      {activeInteraction && interactionMessage && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in duration-200">
          <div className="px-5 py-2.5 bg-accent/90 text-accent-foreground rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm border border-accent/30">
            {interactionMessage}
          </div>
        </div>
      )}

      <CharacterCustomizer
        isOpen={isOpen("customizer")}
        onClose={close}
        onSave={handleSaveCharacter}
        initial={playerConfig}
      />

      <RoomEditor
        isOpen={isOpen("roomEditor")}
        onClose={() => { close(); setEditMode(false); setSelectedFurnitureId(null); }}
        rooms={rooms}
        onUpdateRooms={handleUpdateRooms}
        furniture={furnitureItems}
        onUpdateFurniture={handleUpdateFurniture}
      />
    </div>
  );
};

export default Index;
