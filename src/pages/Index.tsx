import { OfficeScene3D } from "@/components/office3d/OfficeScene3D";
import { TopBar } from "@/components/office/TopBar";
import { ActionBar } from "@/components/office/ActionBar";
import { ActivityLog } from "@/components/office/ActivityLog";
import { AgentPanel } from "@/components/office/AgentPanel";
import { useOfficeState } from "@/hooks/useOfficeState";

const Index = () => {
  const {
    agents,
    furniture,
    selectedAgent,
    selectAgent,
    showActivityLog,
    toggleActivityLog,
    allLogs,
  } = useOfficeState();

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <TopBar
        agentCount={agents.length}
        activeCount={agents.filter((a) => a.status === "active").length}
      />

      <OfficeScene3D
        agents={agents}
        furniture={furniture}
        selectedAgentId={selectedAgent?.id}
        onAgentClick={selectAgent}
      />

      <ActivityLog
        logs={allLogs}
        isOpen={showActivityLog}
        onToggle={toggleActivityLog}
      />

      <AgentPanel agent={selectedAgent} onClose={() => selectAgent(null)} />

      <ActionBar />
    </div>
  );
};

export default Index;
