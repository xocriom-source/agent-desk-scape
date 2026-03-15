import { useState, useCallback, useEffect } from "react";
import type { Agent, AgentLog, Player } from "@/types/agent";
import { isWalkable, ROOMS, getRoomAt } from "@/data/officeMap";

const AGENT_CONFIGS = [
  { name: "Atlas", role: "Pesquisador IA", color: "#3B82F6", emoji: "🔬" },
  { name: "Nova", role: "Escritora IA", color: "#22C55E", emoji: "✍️" },
  { name: "Pixel", role: "Desenvolvedor IA", color: "#F97316", emoji: "💻" },
  { name: "Cipher", role: "Analista de Dados", color: "#A855F7", emoji: "📊" },
  { name: "Luna", role: "Designer IA", color: "#EC4899", emoji: "🎨" },
  { name: "Spark", role: "Suporte Técnico", color: "#06B6D4", emoji: "🔧" },
  { name: "Bolt", role: "DevOps IA", color: "#EAB308", emoji: "⚡" },
  { name: "Echo", role: "QA Tester IA", color: "#14B8A6", emoji: "🧪" },
];

const TASKS = [
  "Analisando tendências de mercado com NLP...",
  "Redigindo artigo sobre machine learning...",
  "Refatorando API de autenticação...",
  "Processando dashboard de métricas...",
  "Criando protótipo de interface...",
  "Resolvendo tickets de clientes...",
  "Monitorando infraestrutura cloud...",
  "Executando testes automatizados...",
];

const AGENT_STARTS = [
  { x: 3, y: 3 },
  { x: 5, y: 4 },
  { x: 7, y: 4 },
  { x: 9, y: 7 },
  { x: 19, y: 4 },
  { x: 3, y: 15 },
  { x: 19, y: 12 },
  { x: 13, y: 15 },
];

function createAgents(): Agent[] {
  return AGENT_CONFIGS.map((cfg, i) => {
    const start = AGENT_STARTS[i];
    const room = getRoomAt(start.x, start.y);
    return {
      id: `agent-${i}`,
      name: cfg.name,
      role: cfg.role,
      color: cfg.color,
      status: (["active", "thinking", "idle", "busy"] as const)[i % 4],
      avatar: i,
      x: start.x,
      y: start.y,
      targetX: start.x,
      targetY: start.y,
      tasks: [TASKS[i], TASKS[(i + 2) % 8]],
      currentTask: TASKS[i],
      room: room?.name || "Corredor",
      logs: [
        { id: `log-${i}-0`, timestamp: new Date(Date.now() - 60000), message: "Conectado ao escritório virtual", type: "success" as const },
        { id: `log-${i}-1`, timestamp: new Date(), message: `Iniciou: ${TASKS[i].slice(0, 40)}...`, type: "info" as const },
      ],
    };
  });
}

export function useOfficeState(playerName: string = "Você") {
  const [agents, setAgents] = useState<Agent[]>(createAgents);
  const [player, setPlayer] = useState<Player>({ x: 14, y: 18, name: playerName });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [nearbyAgent, setNearbyAgent] = useState<Agent | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (Math.random() > 0.25) return agent;
          const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
          const shuffled = dirs.sort(() => Math.random() - 0.5);
          for (const d of shuffled) {
            const nx = agent.x + d.dx;
            const ny = agent.y + d.dy;
            if (isWalkable(nx, ny)) {
              const room = getRoomAt(nx, ny);
              const newStatus: Agent["status"] = Math.random() > 0.7 ? "thinking" : Math.random() > 0.4 ? "active" : Math.random() > 0.5 ? "busy" : "idle";
              const msgs = ["Processando dados...", "Aguardando API...", "Tarefa concluída!", "Analisando...", "Compilando...", "Sincronizando..."];
              const newLog: AgentLog = {
                id: `log-${agent.id}-${Date.now()}`,
                timestamp: new Date(),
                message: msgs[Math.floor(Math.random() * msgs.length)],
                type: (["info", "success", "warning"] as const)[Math.floor(Math.random() * 3)],
              };
              return { ...agent, x: nx, y: ny, status: newStatus, room: room?.name || "Corredor", logs: [newLog, ...agent.logs].slice(0, 15) };
            }
          }
          return agent;
        })
      );
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const nearby = agents.find((a) => Math.abs(a.x - player.x) <= 1 && Math.abs(a.y - player.y) <= 1);
    setNearbyAgent(nearby || null);
  }, [player, agents]);

  useEffect(() => {
    if (selectedAgent) {
      const updated = agents.find((a) => a.id === selectedAgent.id);
      if (updated) setSelectedAgent(updated);
    }
  }, [agents, selectedAgent]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    setPlayer((p) => {
      const nx = p.x + dx;
      const ny = p.y + dy;
      return isWalkable(nx, ny) ? { ...p, x: nx, y: ny } : p;
    });
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (chatOpen) return;
      switch (e.key) {
        case "ArrowUp": case "w": case "W": e.preventDefault(); movePlayer(0, -1); break;
        case "ArrowDown": case "s": case "S": e.preventDefault(); movePlayer(0, 1); break;
        case "ArrowLeft": case "a": case "A": e.preventDefault(); movePlayer(-1, 0); break;
        case "ArrowRight": case "d": case "D": e.preventDefault(); movePlayer(1, 0); break;
        case " ":
          e.preventDefault();
          if (nearbyAgent) { setSelectedAgent(nearbyAgent); setChatOpen(true); }
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [movePlayer, chatOpen, nearbyAgent]);

  const allLogs = agents
    .flatMap((a) => a.logs.map((l) => ({ ...l, agentName: a.name, agentColor: a.color })))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 40);

  return {
    agents, player, selectedAgent, setSelectedAgent,
    showActivityLog, toggleActivityLog: () => setShowActivityLog((p) => !p),
    allLogs, chatOpen, setChatOpen, nearbyAgent, movePlayer,
  };
}
