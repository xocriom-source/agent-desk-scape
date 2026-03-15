import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { CharacterCustomizer, type PlayerConfig } from "@/components/office/CharacterCustomizer";
import { RoomEditor } from "@/components/office/RoomEditor";
import { useOfficeState } from "@/hooks/useOfficeState";
import { ROOMS, setRooms, FURNITURE, setFurniture, type RoomDef, type FurnitureItem, DEFAULT_ROOMS, DEFAULT_FURNITURE } from "@/data/officeMap";
import type { Agent } from "@/types/agent";

const Index = () => {
  const navigate = useNavigate();
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showRoomEditor, setShowRoomEditor] = useState(false);
  const [rooms, setLocalRooms] = useState<RoomDef[]>(() => [...DEFAULT_ROOMS]);
  const [furnitureItems, setLocalFurniture] = useState<FurnitureItem[]>(() => [...DEFAULT_FURNITURE]);
  const [editMode, setEditMode] = useState(false);
  const [profileAgent, setProfileAgent] = useState<Agent | null>(null);
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
  const [hoveredFurnitureId, setHoveredFurnitureId] = useState<string | null>(null);
  const [showFeed, setShowFeed] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showStudios, setShowStudios] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showGovernance, setShowGovernance] = useState(false);
  const [playerConfig, setPlayerConfig] = useState<PlayerConfig>({
    name: "Chefe",
    color: "#4F46E5",
    hairStyle: "spiky",
    outfitStyle: "suit",
    skinTone: "medium",
    accessory: "none",
  });

  useEffect(() => {
    const user = localStorage.getItem("agentoffice_user");
    if (!user) { 
      console.log("[AgentOffice] No user found, redirecting to landing");
      navigate("/"); 
      return; 
    }
    const parsed = JSON.parse(user);
    console.log("[AgentOffice] User loaded:", parsed.name);
    setPlayerConfig((prev) => ({ ...prev, name: parsed.name || "Chefe" }));
  }, [navigate]);

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
  } = useOfficeState(playerConfig.name);

  const handleSaveCharacter = (config: PlayerConfig) => {
    setPlayerConfig(config);
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
        onCustomize={() => setShowCustomizer(true)}
        onRoomEditor={() => { setShowRoomEditor(true); setEditMode(true); }}
        onLogout={() => {
          localStorage.removeItem("agentoffice_user");
          navigate("/");
        }}
        onOpenFeed={() => setShowFeed(true)}
        onOpenTasks={() => setShowTasks(true)}
        onOpenMessaging={() => setShowMessaging(true)}
        onOpenGallery={() => setShowGallery(true)}
        onOpenStudios={() => setShowStudios(true)}
        onOpenAnalytics={() => setShowAnalytics(true)}
        onOpenMarketplace={() => setShowMarketplace(true)}
        onOpenGovernance={() => setShowGovernance(true)}
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

      <ActivityLog logs={allLogs} isOpen={showActivityLog} onToggle={toggleActivityLog} />
      <AgentPanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} onViewProfile={(a) => setProfileAgent(a)} />
      <ObserverCard agent={profileAgent} isOpen={!!profileAgent} onClose={() => setProfileAgent(null)} />
      
      {/* New systems */}
      <SocialFeed agents={agents} isOpen={showFeed} onClose={() => setShowFeed(false)} />
      <TaskBoard agents={agents} isOpen={showTasks} onClose={() => setShowTasks(false)} />
      <AgentMessaging agents={agents} isOpen={showMessaging} onClose={() => setShowMessaging(false)} />
      <AgentGallery agents={agents} isOpen={showGallery} onClose={() => setShowGallery(false)} />
      <CreativeStudios agents={agents} isOpen={showStudios} onClose={() => setShowStudios(false)} />
      <AnalyticsDashboard agents={agents} isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} />
      <AgentMarketplace agents={agents} isOpen={showMarketplace} onClose={() => setShowMarketplace(false)} />
      <AIGovernance agents={agents} isOpen={showGovernance} onClose={() => setShowGovernance(false)} />

      {!editMode && <ActionBar onMove={movePlayer} />}
      {!editMode && <MiniMap player={player} agents={agents} rooms={rooms} />}

      <CharacterCustomizer
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        onSave={handleSaveCharacter}
        initial={playerConfig}
      />

      <RoomEditor
        isOpen={showRoomEditor}
        onClose={() => { setShowRoomEditor(false); setEditMode(false); setSelectedFurnitureId(null); }}
        rooms={rooms}
        onUpdateRooms={handleUpdateRooms}
        furniture={furnitureItems}
        onUpdateFurniture={handleUpdateFurniture}
      />
    </div>
  );
};

export default Index;
