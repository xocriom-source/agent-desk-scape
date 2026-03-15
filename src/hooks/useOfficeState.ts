import { useState, useCallback } from "react";
import type { Agent, AgentLog, FurnitureItem } from "@/types/agent";

const AGENT_ROLES = ["Pesquisador", "Escritor", "Codificador", "Analista", "Designer", "Suporte"];
const AGENT_NAMES = ["Atlas", "Nova", "Pixel", "Cipher", "Luna", "Spark"];
const TASK_EXAMPLES = [
  "Analisando dados de mercado...",
  "Escrevendo relatório trimestral...",
  "Refatorando módulo de autenticação...",
  "Gerando wireframes de UI...",
  "Respondendo tickets de suporte...",
  "Pesquisando tendências de IA...",
];

function createMockAgents(): Agent[] {
  return AGENT_NAMES.map((name, i) => ({
    id: `agent-${i}`,
    name,
    role: AGENT_ROLES[i],
    status: (["active", "idle", "thinking"] as const)[i % 3],
    avatar: i,
    position: {
      x: 2 + (i % 3) * 4,
      y: 2 + Math.floor(i / 3) * 4,
    },
    tasks: [TASK_EXAMPLES[i], TASK_EXAMPLES[(i + 1) % 6]],
    currentTask: TASK_EXAMPLES[i],
    logs: [
      {
        id: `log-${i}-1`,
        timestamp: new Date(Date.now() - Math.random() * 3600000),
        message: `${name} iniciou: ${TASK_EXAMPLES[i]}`,
        type: "info" as const,
      },
      {
        id: `log-${i}-2`,
        timestamp: new Date(),
        message: `${name} completou subtarefa com sucesso`,
        type: "success" as const,
      },
    ],
  }));
}

const defaultFurniture: FurnitureItem[] = [
  { id: "f1", type: "desk", position: { x: 1, y: 1 }, size: { w: 3, h: 2 } },
  { id: "f2", type: "desk", position: { x: 5, y: 1 }, size: { w: 3, h: 2 } },
  { id: "f3", type: "desk", position: { x: 9, y: 1 }, size: { w: 3, h: 2 } },
  { id: "f4", type: "desk", position: { x: 1, y: 5 }, size: { w: 3, h: 2 } },
  { id: "f5", type: "desk", position: { x: 5, y: 5 }, size: { w: 3, h: 2 } },
  { id: "f6", type: "desk", position: { x: 9, y: 5 }, size: { w: 3, h: 2 } },
  { id: "f7", type: "plant", position: { x: 0, y: 0 }, size: { w: 1, h: 1 } },
  { id: "f8", type: "plant", position: { x: 12, y: 0 }, size: { w: 1, h: 1 } },
  { id: "f9", type: "bookshelf", position: { x: 13, y: 2 }, size: { w: 1, h: 3 } },
  { id: "f10", type: "coffee", position: { x: 13, y: 6 }, size: { w: 1, h: 1 } },
];

export function useOfficeState() {
  const [agents, setAgents] = useState<Agent[]>(createMockAgents);
  const [furniture] = useState<FurnitureItem[]>(defaultFurniture);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(true);

  const allLogs = agents
    .flatMap((a) => a.logs.map((l) => ({ ...l, agentName: a.name })))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 20);

  const selectAgent = useCallback((agent: Agent | null) => {
    setSelectedAgent(agent);
  }, []);

  const toggleActivityLog = useCallback(() => {
    setShowActivityLog((p) => !p);
  }, []);

  return {
    agents,
    furniture,
    selectedAgent,
    selectAgent,
    showActivityLog,
    toggleActivityLog,
    allLogs,
  };
}
