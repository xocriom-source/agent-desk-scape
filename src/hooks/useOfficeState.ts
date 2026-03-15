import { useState, useCallback, useEffect, useRef } from "react";
import type { Agent, AgentLog, FurnitureItem } from "@/types/agent";

const AGENT_CONFIGS = [
  { name: "Atlas", role: "Pesquisador", color: "#4F8EF7", emoji: "🔬" },
  { name: "Nova", role: "Escritora", color: "#10B981", emoji: "✍️" },
  { name: "Pixel", role: "Desenvolvedor", color: "#F59E0B", emoji: "💻" },
  { name: "Cipher", role: "Analista", color: "#8B5CF6", emoji: "📊" },
  { name: "Luna", role: "Designer", color: "#EC4899", emoji: "🎨" },
  { name: "Spark", role: "Suporte", color: "#06B6D4", emoji: "📞" },
];

const TASKS = [
  "Analisando dados de mercado...",
  "Escrevendo relatório trimestral...",
  "Refatorando módulo de autenticação...",
  "Gerando wireframes de UI...",
  "Respondendo tickets de suporte...",
  "Pesquisando tendências de IA...",
];

const WALKABLE_POSITIONS = [
  { x: 2, z: 2 }, { x: 4, z: 2 }, { x: 6, z: 2 }, { x: 8, z: 2 },
  { x: 2, z: 4 }, { x: 4, z: 4 }, { x: 6, z: 4 }, { x: 8, z: 4 },
  { x: 2, z: 6 }, { x: 4, z: 6 }, { x: 6, z: 6 }, { x: 8, z: 6 },
  { x: 3, z: 3 }, { x: 5, z: 3 }, { x: 7, z: 3 }, { x: 5, z: 5 },
  { x: 3, z: 7 }, { x: 7, z: 7 }, { x: 5, z: 7 },
];

function createAgents(): Agent[] {
  return AGENT_CONFIGS.map((cfg, i) => ({
    id: `agent-${i}`,
    name: cfg.name,
    role: cfg.role,
    color: cfg.color,
    status: (["active", "thinking", "idle"] as const)[i % 3],
    avatar: i,
    position: { x: 2 + (i % 3) * 3, z: 2 + Math.floor(i / 3) * 4 },
    tasks: [TASKS[i], TASKS[(i + 1) % 6]],
    currentTask: TASKS[i],
    logs: [
      {
        id: `log-${i}-1`,
        timestamp: new Date(Date.now() - Math.random() * 3600000),
        message: `${cfg.name} iniciou: ${TASKS[i]}`,
        type: "info" as const,
      },
      {
        id: `log-${i}-2`,
        timestamp: new Date(),
        message: `${cfg.name} completou subtarefa com sucesso`,
        type: "success" as const,
      },
    ],
  }));
}

const defaultFurniture: FurnitureItem[] = [
  // Desks row 1
  { id: "d1", type: "desk", position: { x: 2, z: 1.5 }, rotation: 0, size: { w: 2, h: 1 } },
  { id: "d2", type: "desk", position: { x: 5, z: 1.5 }, rotation: 0, size: { w: 2, h: 1 } },
  { id: "d3", type: "desk", position: { x: 8, z: 1.5 }, rotation: 0, size: { w: 2, h: 1 } },
  // Desks row 2
  { id: "d4", type: "desk", position: { x: 2, z: 5.5 }, rotation: 0, size: { w: 2, h: 1 } },
  { id: "d5", type: "desk", position: { x: 5, z: 5.5 }, rotation: 0, size: { w: 2, h: 1 } },
  { id: "d6", type: "desk", position: { x: 8, z: 5.5 }, rotation: 0, size: { w: 2, h: 1 } },
  // Chairs
  { id: "c1", type: "chair", position: { x: 2, z: 2.5 }, rotation: Math.PI, size: { w: 0.6, h: 0.6 } },
  { id: "c2", type: "chair", position: { x: 5, z: 2.5 }, rotation: Math.PI, size: { w: 0.6, h: 0.6 } },
  { id: "c3", type: "chair", position: { x: 8, z: 2.5 }, rotation: Math.PI, size: { w: 0.6, h: 0.6 } },
  // Plants
  { id: "p1", type: "plant", position: { x: 0.5, z: 0.5 }, size: { w: 0.5, h: 0.5 } },
  { id: "p2", type: "plant", position: { x: 9.5, z: 0.5 }, size: { w: 0.5, h: 0.5 } },
  { id: "p3", type: "plant", position: { x: 0.5, z: 8.5 }, size: { w: 0.5, h: 0.5 } },
  // Meeting area
  { id: "w1", type: "whiteboard", position: { x: 5, z: 8.5 }, rotation: 0, size: { w: 2, h: 0.2 } },
  { id: "s1", type: "sofa", position: { x: 9.5, z: 4 }, rotation: Math.PI / 2, size: { w: 1, h: 2 } },
  // Server
  { id: "sv1", type: "server", position: { x: 0.5, z: 4 }, size: { w: 0.6, h: 1.5 } },
  // Coffee
  { id: "cf1", type: "coffee", position: { x: 9.5, z: 8.5 }, size: { w: 0.6, h: 0.6 } },
  // Monitors on desks
  { id: "m1", type: "monitor", position: { x: 2, z: 1.2 }, size: { w: 0.5, h: 0.3 } },
  { id: "m2", type: "monitor", position: { x: 5, z: 1.2 }, size: { w: 0.5, h: 0.3 } },
  { id: "m3", type: "monitor", position: { x: 8, z: 1.2 }, size: { w: 0.5, h: 0.3 } },
];

export function useOfficeState() {
  const [agents, setAgents] = useState<Agent[]>(createAgents);
  const [furniture] = useState<FurnitureItem[]>(defaultFurniture);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Simulate agent movement
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (Math.random() > 0.3) return agent;
          const target =
            WALKABLE_POSITIONS[Math.floor(Math.random() * WALKABLE_POSITIONS.length)];
          const newStatus: Agent["status"] =
            Math.random() > 0.6 ? "thinking" : Math.random() > 0.3 ? "active" : "idle";

          const newLog: AgentLog = {
            id: `log-${agent.id}-${Date.now()}`,
            timestamp: new Date(),
            message:
              newStatus === "thinking"
                ? `${agent.name} está processando tarefa...`
                : newStatus === "active"
                ? `${agent.name} moveu para nova posição`
                : `${agent.name} está aguardando`,
            type: newStatus === "thinking" ? "warning" : newStatus === "active" ? "info" : "success",
          };

          return {
            ...agent,
            position: target,
            status: newStatus,
            logs: [newLog, ...agent.logs].slice(0, 10),
          };
        })
      );
    }, 3000);

    return () => clearInterval(intervalRef.current);
  }, []);

  // Keep selectedAgent in sync
  useEffect(() => {
    if (selectedAgent) {
      const updated = agents.find((a) => a.id === selectedAgent.id);
      if (updated) setSelectedAgent(updated);
    }
  }, [agents, selectedAgent]);

  const allLogs = agents
    .flatMap((a) => a.logs.map((l) => ({ ...l, agentName: a.name, agentColor: a.color })))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 30);

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
