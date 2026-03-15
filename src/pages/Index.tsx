import { OfficeCanvas } from "@/components/office/OfficeCanvas";
import { TopBar } from "@/components/office/TopBar";
import { ActionBar } from "@/components/office/ActionBar";
import { ActivityLog } from "@/components/office/ActivityLog";
import { AgentPanel } from "@/components/office/AgentPanel";
import { useOfficeState } from "@/hooks/useOfficeState";

const Index = () => {
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
  } = useOfficeState();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-canvas select-none">
      <TopBar
        agentCount={agents.length}
        activeCount={agents.filter((a) => a.status === "active").length}
        nearbyAgent={nearbyAgent}
      />

      <OfficeCanvas
        agents={agents}
        player={player}
        selectedAgentId={selectedAgent?.id}
        onAgentClick={setSelectedAgent}
      />

      <ActivityLog
        logs={allLogs}
        isOpen={showActivityLog}
        onToggle={toggleActivityLog}
      />

      <AgentPanel
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />

      <ActionBar onMove={movePlayer} />
    </div>
  );
};

export default Index;
