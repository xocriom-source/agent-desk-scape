import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { Agent, AgentLog, Player } from "@/types/agent";
import { isWalkable, getRoomAt } from "@/data/officeMap";
import {
  bfsPath8,
  findClosestWalkable,
  isWalkableAtFloat,
  tileFromFloat,
  type Tile,
} from "@/hooks/office/movementUtils";

const AGENT_CONFIGS = [
  { name: "Atlas", role: "Pesquisador IA", color: "#3B82F6", emoji: "🔬" },
  { name: "Nova", role: "Escritora IA", color: "#22C55E", emoji: "✍️" },
  { name: "Pixel", role: "Desenvolvedor IA", color: "#F97316", emoji: "💻" },
  { name: "Cipher", role: "Analista de Dados", color: "#A855F7", emoji: "📊" },
  { name: "Luna", role: "Designer IA", color: "#EC4899", emoji: "🎨" },
  { name: "Spark", role: "Suporte Técnico", color: "#06B6D4", emoji: "🔧" },
  { name: "Bolt", role: "DevOps IA", color: "#EAB308", emoji: "⚡" },
  { name: "Echo", role: "QA Tester IA", color: "#14B8A6", emoji: "🧪" },
] as const;

const TASKS = [
  "Analisando tendências de mercado com NLP...",
  "Redigindo artigo sobre machine learning...",
  "Refatorando API de autenticação...",
  "Processando dashboard de métricas...",
  "Criando protótipo de interface...",
  "Resolvendo tickets de clientes...",
  "Monitorando infraestrutura cloud...",
  "Executando testes automatizados...",
] as const;

const AGENT_STARTS = [
  { x: 4, y: 4 },
  { x: 7, y: 4 },
  { x: 4, y: 7 },
  { x: 7, y: 7 },
  { x: 20, y: 3 },
  { x: 3, y: 16 },
  { x: 32, y: 13 },
  { x: 16, y: 29 },
] as const;

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
          timestamp: new Date(Date.now() - 60_000),
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

function stepWithCollision(
  x: number,
  y: number,
  nx: number,
  ny: number,
  radius = 0.28
): { x: number; y: number; blocked: boolean } {
  if (isWalkableAtFloat(nx, ny, radius)) return { x: nx, y: ny, blocked: false };
  // Slide along walls: try each axis independently
  if (isWalkableAtFloat(nx, y, radius)) return { x: nx, y, blocked: false };
  if (isWalkableAtFloat(x, ny, radius)) return { x, y: ny, blocked: false };
  return { x, y, blocked: true };
}

export function useOfficeState(playerName: string = "Você") {
  const [agents, setAgents] = useState<Agent[]>(createAgents);
  const [player, setPlayer] = useState<Player>({ x: 14, y: 25, angle: 0, name: playerName });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [nearbyAgent, setNearbyAgent] = useState<Agent | null>(null);

  // Click-to-move path
  const pathRef = useRef<Tile[]>([]);
  const goalRef = useRef<Tile | null>(null);
  const stuckRef = useRef(0);

  const clearPath = useCallback(() => {
    pathRef.current = [];
    goalRef.current = null;
    stuckRef.current = 0;
  }, []);

  // Mobile D-pad: direct nudge (still slides on collision)
  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      clearPath();
      const len = Math.hypot(dx, dy) || 1;
      const step = 0.38;
      const vx = (dx / len) * step;
      const vy = (dy / len) * step;

      setPlayer((p) => {
        const r = stepWithCollision(p.x, p.y, p.x + vx, p.y + vy);
        if (r.blocked) return p;
        // Update angle to face movement direction
        const newAngle = Math.atan2(vx, vy);
        return { ...p, x: r.x, y: r.y, angle: newAngle };
      });
    },
    [clearPath]
  );

  const setPlayerDestination = useCallback(
    (x: number, y: number) => {
      if (chatOpen) return;

      const start = tileFromFloat(player.x, player.y);
      const clicked = { x, y };
      const goal = findClosestWalkable(clicked);
      if (!goal) return;

      const path = bfsPath8(start, goal);
      if (!path.length) return;

      goalRef.current = goal;
      pathRef.current = path;
      stuckRef.current = 0;
    },
    [player.x, player.y, chatOpen]
  );

  // Keys held down
  const keysDown = useRef<Set<string>>(new Set());

  useEffect(() => {
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

      const moveKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

      if (moveKeys.includes(e.key)) {
        e.preventDefault();
        keysDown.current.add(e.key);
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
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [chatOpen, nearbyAgent]);

  // ── Smooth rotation-based movement loop (Minecraft-style) ──
  // ↑ = move forward in facing direction
  // ↓ = move backward
  // ← = rotate left
  // → = rotate right
  // Includes acceleration/deceleration for smooth feel
  useEffect(() => {
    let raf = 0;
    let last = 0;

    // Physics parameters
    const maxSpeed = 5.5;       // tiles/s top speed
    const accel = 14.0;         // tiles/s² acceleration
    const decel = 10.0;         // tiles/s² deceleration (friction)
    const rotateSpeed = 3.2;    // radians/s rotation speed
    const pathSpeed = 5.0;      // tiles/s for click-to-move

    // Velocity state (persists across frames)
    let currentSpeed = 0;

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (chatOpen) {
        last = t;
        return;
      }

      const dt = Math.min(0.05, (t - (last || t)) / 1000);
      last = t;
      if (dt <= 0) return;

      const keys = keysDown.current;
      const up = keys.has("ArrowUp");
      const down = keys.has("ArrowDown");
      const left = keys.has("ArrowLeft");
      const right = keys.has("ArrowRight");
      const usingKeys = up || down || left || right;

      setPlayer((p) => {
        let { x, y, angle } = p;

        // Cancel click-to-move path when pressing keys
        if (usingKeys) {
          pathRef.current = [];
          goalRef.current = null;
          stuckRef.current = 0;
        }

        // ── Keyboard rotation-based movement ──
        if (usingKeys) {
          // Rotate
          if (left) angle -= rotateSpeed * dt;
          if (right) angle += rotateSpeed * dt;
          // Normalize angle
          angle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

          // Accelerate / decelerate
          let inputDir = 0;
          if (up) inputDir += 1;
          if (down) inputDir -= 1;

          if (inputDir !== 0) {
            currentSpeed += inputDir * accel * dt;
            currentSpeed = Math.max(-maxSpeed * 0.6, Math.min(maxSpeed, currentSpeed));
          } else {
            // Decelerate toward zero
            if (currentSpeed > 0) {
              currentSpeed = Math.max(0, currentSpeed - decel * dt);
            } else if (currentSpeed < 0) {
              currentSpeed = Math.min(0, currentSpeed + decel * dt);
            }
          }

          // Compute velocity in facing direction
          // angle=0 means facing +Z in tile space (down on map), we use sin/cos
          const vx = Math.sin(angle) * currentSpeed;
          const vy = Math.cos(angle) * currentSpeed;

          const nx = x + vx * dt;
          const ny = y + vy * dt;
          const r = stepWithCollision(x, y, nx, ny);

          if (r.blocked) {
            // Reduce speed on collision but don't zero it (allows sliding)
            currentSpeed *= 0.5;
          }

          x = r.x;
          y = r.y;

          if (x === p.x && y === p.y && angle === p.angle) return p;
          return { ...p, x, y, angle };
        }

        // ── Click-to-move pathfinding ──
        if (pathRef.current.length) {
          const next = pathRef.current[0];
          const dirX = next.x - x;
          const dirY = next.y - y;
          const dist = Math.hypot(dirX, dirY);
          const arrive = 0.14;

          if (dist < arrive) {
            x = next.x;
            y = next.y;
            pathRef.current.shift();
            stuckRef.current = 0;
          } else {
            const vx = (dirX / dist) * pathSpeed;
            const vy = (dirY / dist) * pathSpeed;
            const nx = x + vx * dt;
            const ny = y + vy * dt;
            const r = stepWithCollision(x, y, nx, ny);

            if (r.blocked) {
              if (goalRef.current) {
                stuckRef.current += dt;
                if (stuckRef.current > 0.35) {
                  const start = tileFromFloat(x, y);
                  const newPath = bfsPath8(start, goalRef.current);
                  pathRef.current = newPath;
                  if (!newPath.length) goalRef.current = null;
                  stuckRef.current = 0;
                }
              }
              return p;
            }

            x = r.x;
            y = r.y;
            // Face movement direction during pathfinding
            angle = Math.atan2(dirX, dirY);
          }

          if (x === p.x && y === p.y && angle === p.angle) return p;
          return { ...p, x, y, angle };
        }

        // No input: decelerate any remaining speed
        if (Math.abs(currentSpeed) > 0.01) {
          if (currentSpeed > 0) {
            currentSpeed = Math.max(0, currentSpeed - decel * dt);
          } else {
            currentSpeed = Math.min(0, currentSpeed + decel * dt);
          }

          const vx = Math.sin(angle) * currentSpeed;
          const vy = Math.cos(angle) * currentSpeed;
          const nx = x + vx * dt;
          const ny = y + vy * dt;
          const r = stepWithCollision(x, y, nx, ny);
          if (!r.blocked && (r.x !== x || r.y !== y)) {
            return { ...p, x: r.x, y: r.y };
          }
          currentSpeed = 0;
        }

        return p;
      });
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [chatOpen]);

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
            if (!isWalkable(nx, ny)) continue;

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

          return agent;
        })
      );
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  // Nearby detection
  useEffect(() => {
    const pTile = tileFromFloat(player.x, player.y);
    const nearby = agents.find(
      (a) => Math.abs(a.x - pTile.x) <= 2 && Math.abs(a.y - pTile.y) <= 2
    );
    setNearbyAgent(nearby || null);
  }, [player.x, player.y, agents]);

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
