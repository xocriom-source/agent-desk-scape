import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OfficeCanvas } from "@/components/office/OfficeCanvas";
import { TopBar } from "@/components/office/TopBar";
import { ActionBar } from "@/components/office/ActionBar";
import { ActivityLog } from "@/components/office/ActivityLog";
import { AgentPanel } from "@/components/office/AgentPanel";
import { CharacterCustomizer, type PlayerConfig } from "@/components/office/CharacterCustomizer";
import { RoomEditor } from "@/components/office/RoomEditor";
import { useOfficeState } from "@/hooks/useOfficeState";
import { ROOMS, setRooms, type RoomDef, DEFAULT_ROOMS } from "@/data/officeMap";

const Index = () => {
  const navigate = useNavigate();
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showRoomEditor, setShowRoomEditor] = useState(false);
  const [rooms, setLocalRooms] = useState<RoomDef[]>(() => [...DEFAULT_ROOMS]);
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
    if (!user) { navigate("/"); return; }
    const parsed = JSON.parse(user);
    setPlayerConfig((prev) => ({ ...prev, name: parsed.name || "Chefe" }));
  }, [navigate]);

  const {
    agents, player, selectedAgent, setSelectedAgent,
    showActivityLog, toggleActivityLog, allLogs, nearbyAgent, movePlayer,
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

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-canvas select-none">
      <TopBar
        agentCount={agents.length}
        activeCount={agents.filter((a) => a.status === "active").length}
        nearbyAgent={nearbyAgent}
        onCustomize={() => setShowCustomizer(true)}
        onRoomEditor={() => setShowRoomEditor(true)}
        onLogout={() => {
          localStorage.removeItem("agentoffice_user");
          navigate("/");
        }}
      />

      <OfficeCanvas
        agents={agents}
        player={{ ...player, name: playerConfig.name }}
        playerConfig={playerConfig}
        selectedAgentId={selectedAgent?.id}
        onAgentClick={setSelectedAgent}
      />

      <ActivityLog logs={allLogs} isOpen={showActivityLog} onToggle={toggleActivityLog} />
      <AgentPanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      <ActionBar onMove={movePlayer} />

      <CharacterCustomizer
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        onSave={handleSaveCharacter}
        initial={playerConfig}
      />

      <RoomEditor
        isOpen={showRoomEditor}
        onClose={() => setShowRoomEditor(false)}
        rooms={rooms}
        onUpdateRooms={handleUpdateRooms}
      />
    </div>
  );
};

export default Index;
