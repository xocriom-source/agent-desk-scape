import { useState, useCallback, useEffect, useRef } from "react";
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
  { x: 4, y: 4 }, { x: 7, y: 4 }, { x: 4, y: 7 }, { x: 7, y: 7 },
  { x: 20, y: 3 }, { x: 3, y: 16 }, { x: 32, y: 13 }, { x: 16, y: 29 },
];

function createAgents(): Agent[] {
  return AGENT_CONFIGS.map((cfg, i) => {
    const start = AGENT_STARTS[i];
    const room = getRoomAt(start.x, start.y);
    return {
      id: `agent-${i}`,
      name: cfg.name, role: cfg.role, color: cfg.color,
      status: (["active", "thinking", "idle", "busy"] as const)[i % 4],
      avatar: i, x: start.x, y: start.y, targetX: start.x, targetY: start.y,
      tasks: [TASKS[i], TASKS[(i + 2) % 8]], currentTask: TASKS[i],
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
  const [player, setPlayer] = useState<Player>({ x: 14, y: 25, name: playerName });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [nearbyAgent, setNearbyAgent] = useState<Agent | null>(null);

  // Movement with key-repeat support (hold arrow key = continuous movement)
  const keysDown = useRef<Set<string>>(new Set());
  const moveInterval = useRef<number>(0);

  const movePlayer = useCallback((dx: number, dy: number) => {
    setPlayer((p) => {
      const nx = p.x + dx;
      const ny = p.y + dy;
      return isWalkable(nx, ny) ? { ...p, x: nx, y: ny } : p;
    });
  }, []);

  // Process held keys for smooth movement
  useEffect(() => {
    const processKeys = () => {
      if (chatOpen) return;
      const keys = keysDown.current;
      if (keys.has("ArrowUp")) movePlayer(0, -1);
      else if (keys.has("ArrowDown")) movePlayer(0, 1);
      else if (keys.has("ArrowLeft")) movePlayer(-1, 0);
      else if (keys.has("ArrowRight")) movePlayer(1, 0);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (chatOpen) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        if (!keysDown.current.has(e.key)) {
          keysDown.current.add(e.key);
          // Immediate first move
          processKeys();
          // Start repeat
          if (!moveInterval.current) {
            moveInterval.current = window.setInterval(processKeys, 120);
          }
        }
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (nearbyAgent) {
          setSelectedAgent(nearbyAgent);
          setChatOpen(true);
        }
      }
      if (e.key === "Escape") {
        setSelectedAgent(null);
        setChatOpen(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current.delete(e.key);
      if (keysDown.current.size === 0 && moveInterval.current) {
        clearInterval(moveInterval.current);
        moveInterval.current = 0;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (moveInterval.current) clearInterval(moveInterval.current);
    };
  }, [movePlayer, chatOpen, nearbyAgent]);

  // Agent movement
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (Math.random() > 0.3) return agent;
          const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
          const shuffled = dirs.sort(() => Math.random() - 0.5);
          for (const d of shuffled) {
            const nx = agent.x + d.dx;
            const ny = agent.y + d.dy;
            if (isWalkable(nx, ny)) {
              const room = getRoomAt(nx, ny);
              const newStatus: Agent["status"] = Math.random() > 0.7 ? "thinking" : Math.random() > 0.4 ? "active" : Math.random() > 0.5 ? "busy" : "idle";
              const msgs = ["Processando dados...", "Aguardando API...", "Tarefa concluída!", "Analisando...", "Compilando...", "Sincronizando...", "Deploy em andamento..."];
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
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  // Nearby detection
  useEffect(() => {
    const nearby = agents.find((a) => Math.abs(a.x - player.x) <= 2 && Math.abs(a.y - player.y) <= 2);
    setNearbyAgent(nearby || null);
  }, [player, agents]);

  // Sync selected agent
  useEffect(() => {
    if (selectedAgent) {
      const updated = agents.find((a) => a.id === selectedAgent.id);
      if (updated) setSelectedAgent(updated);
    }
  }, [agents, selectedAgent]);

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
