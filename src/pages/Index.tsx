import { OfficeCanvas } from "@/components/office/OfficeCanvas";
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
    <div className="relative w-screen h-screen overflow-hidden bg-canvas">
      <TopBar agentCount={agents.filter((a) => a.status === "active").length} />

      <OfficeCanvas
        agents={agents}
        furniture={furniture}
        onAgentClick={selectAgent}
        selectedAgentId={selectedAgent?.id}
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
