import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { Agent, AgentLog, Player } from "@/types/agent";
import { isWalkable, getRoomAt } from "@/data/officeMap";

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

type Tile = { x: number; y: number };

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
        {
          id: `log-${i}-0`,
          timestamp: new Date(Date.now() - 60000),
          message: "Conectado ao escritório virtual",
          type: "success" as const,
        },
        {
          id: `log-${i}-1`,
          timestamp: new Date(),
          message: `Iniciou: ${TASKS[i].slice(0, 40)}...`,
          type: "info" as const,
        },
      ],
    };
  });
}

function keyToMoveDelta(keys: Set<string>) {
  const has = (k: string) => keys.has(k) || keys.has(k.toLowerCase()) || keys.has(k.toUpperCase());
  let dx = 0;
  let dy = 0;

  if (has("ArrowUp") || has("w")) dy -= 1;
  if (has("ArrowDown") || has("s")) dy += 1;
  if (has("ArrowLeft") || has("a")) dx -= 1;
  if (has("ArrowRight") || has("d")) dx += 1;

  return { dx, dy };
}

function bfsPath(start: Tile, goal: Tile): Tile[] {
  if (start.x === goal.x && start.y === goal.y) return [];
  if (!isWalkable(goal.x, goal.y)) return [];

  const key = (t: Tile) => `${t.x},${t.y}`;
  const q: Tile[] = [start];
  const prev = new Map<string, string>();
  const seen = new Set<string>([key(start)]);

  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (q.length) {
    const cur = q.shift()!;
    for (const d of dirs) {
      const nx = cur.x + d.x;
      const ny = cur.y + d.y;
      if (!isWalkable(nx, ny)) continue;
      const n: Tile = { x: nx, y: ny };
      const nk = key(n);
      if (seen.has(nk)) continue;
      seen.add(nk);
      prev.set(nk, key(cur));
      if (nx === goal.x && ny === goal.y) {
        // reconstruct
        const path: Tile[] = [];
        let curKey = nk;
        while (curKey !== key(start)) {
          const [x, y] = curKey.split(",").map(Number);
          path.push({ x, y });
          curKey = prev.get(curKey)!;
        }
        path.reverse();
        return path;
      }
      q.push(n);
    }
  }

  return [];
}

export function useOfficeState(playerName: string = "Você") {
  const [agents, setAgents] = useState<Agent[]>(createAgents);
  const [player, setPlayer] = useState<Player>({ x: 14, y: 25, name: playerName });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [nearbyAgent, setNearbyAgent] = useState<Agent | null>(null);

  // Click-to-move path
  const pathRef = useRef<Tile[]>([]);
  const walkingInterval = useRef<number>(0);

  const clearPath = useCallback(() => {
    pathRef.current = [];
    if (walkingInterval.current) {
      clearInterval(walkingInterval.current);
      walkingInterval.current = 0;
    }
  }, []);

  const tryMovePlayer = useCallback((dx: number, dy: number) => {
    setPlayer((p) => {
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (!isWalkable(nx, ny)) return p;
      return { ...p, x: nx, y: ny };
    });
  }, []);

  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      // manual movement cancels click-to-move
      clearPath();

      // Allow diagonal feeling: attempt x then y
      if (dx !== 0) tryMovePlayer(Math.sign(dx), 0);
      if (dy !== 0) tryMovePlayer(0, Math.sign(dy));
    },
    [tryMovePlayer, clearPath]
  );

  const setPlayerDestination = useCallback((x: number, y: number) => {
    if (chatOpen) return;

    const start = { x: player.x, y: player.y };
    const goal = { x, y };
    const path = bfsPath(start, goal);
    if (!path.length) return;

    pathRef.current = path;
    if (!walkingInterval.current) {
      walkingInterval.current = window.setInterval(() => {
        const next = pathRef.current.shift();
        if (!next) {
          clearPath();
          return;
        }
        setPlayer((p) => ({ ...p, x: next.x, y: next.y }));
      }, 85);
    }
  }, [player.x, player.y, chatOpen, clearPath]);

  // Key repeat movement (hold keys)
  const keysDown = useRef<Set<string>>(new Set());
  const moveInterval = useRef<number>(0);

  useEffect(() => {
    const processKeys = () => {
      if (chatOpen) return;
      const { dx, dy } = keyToMoveDelta(keysDown.current);
      if (dx === 0 && dy === 0) return;
      movePlayer(dx, dy);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        chatOpen ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const moveKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "w",
        "a",
        "s",
        "d",
        "W",
        "A",
        "S",
        "D",
      ];

      if (moveKeys.includes(e.key)) {
        e.preventDefault();
        keysDown.current.add(e.key);
        processKeys();
        if (!moveInterval.current) {
          moveInterval.current = window.setInterval(processKeys, 80);
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
          const dirs = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 },
          ];
          const shuffled = dirs.sort(() => Math.random() - 0.5);
          for (const d of shuffled) {
            const nx = agent.x + d.dx;
            const ny = agent.y + d.dy;
            if (isWalkable(nx, ny)) {
              const room = getRoomAt(nx, ny);
              const newStatus: Agent["status"] =
                Math.random() > 0.7
                  ? "thinking"
                  : Math.random() > 0.4
                    ? "active"
                    : Math.random() > 0.5
                      ? "busy"
                      : "idle";

              const msgs = [
                "Processando dados...",
                "Aguardando API...",
                "Tarefa concluída!",
                "Analisando...",
                "Compilando...",
                "Sincronizando...",
                "Deploy em andamento...",
              ];
              const newLog: AgentLog = {
                id: `log-${agent.id}-${Date.now()}`,
                timestamp: new Date(),
                message: msgs[Math.floor(Math.random() * msgs.length)],
                type: (["info", "success", "warning"] as const)[Math.floor(Math.random() * 3)],
              };

              return {
                ...agent,
                x: nx,
                y: ny,
                status: newStatus,
                room: room?.name || "Corredor",
                logs: [newLog, ...agent.logs].slice(0, 15),
              };
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
    if (!selectedAgent) return;
    const updated = agents.find((a) => a.id === selectedAgent.id);
    if (updated) setSelectedAgent(updated);
  }, [agents, selectedAgent]);

  const allLogs = useMemo(
    () =>
      agents
        .flatMap((a) => a.logs.map((l) => ({ ...l, agentName: a.name, agentColor: a.color })))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 40),
    [agents]
  );

  return {
    agents,
    player,
    selectedAgent,
    setSelectedAgent,
    showActivityLog,
    toggleActivityLog: () => setShowActivityLog((p) => !p),
    allLogs,
    chatOpen,
    setChatOpen,
    nearbyAgent,
    movePlayer,
    setPlayerDestination,
  };
}
