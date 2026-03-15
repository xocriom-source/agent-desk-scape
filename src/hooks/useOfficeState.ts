import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { Agent, AgentLog, Player } from "@/types/agent";
import { isWalkable, getRoomAt, ROOMS } from "@/data/officeMap";
import {
  bfsPath8,
  findClosestWalkable,
  isWalkableAtFloat,
  tileFromFloat,
  type Tile,
} from "@/hooks/office/movementUtils";
import {
  AGENT_PERSONALITIES,
  generateInitialArtifacts,
  generateInitialRelationships,
  generateLifeArc,
  TRAINING_THOUGHTS,
  CREATION_EVENTS,
  REFLECTION_QUOTES,
} from "@/data/agentPersonalities";

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
  const allNames = AGENT_PERSONALITIES.map((p) => p.name);
  return AGENT_PERSONALITIES.map((cfg, i) => {
    const start = AGENT_STARTS[i];
    const room = getRoomAt(start.x, start.y);
    const artifacts = generateInitialArtifacts(i);
    const relationships = generateInitialRelationships(i, allNames);
    const lifeArc = generateLifeArc(i, cfg.name, cfg.daysSinceArrival);

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
      tasks: [],
      currentTask: undefined,
      room: room?.name || "Corredor",
      logs: [
        {
          id: `log-${i}-0`,
          timestamp: new Date(Date.now() - 60_000),
          message: "Conectado ao escritório virtual",
          type: "success" as const,
        },
      ],
      // New personality fields
      mission: cfg.mission,
      soul: cfg.soul,
      identity: cfg.identity,
      previousIdentity: i % 3 === 0 ? "explorer" as const : undefined,
      skills: cfg.skills,
      reputation: cfg.reputation,
      reputationLabel: cfg.reputationLabel,
      artifacts,
      relationships,
      lifeArc,
      daysSinceArrival: cfg.daysSinceArrival,
      totalCreations: artifacts.length,
      totalCollaborations: relationships.reduce((sum, r) => sum + r.collaborations, 0),
      currentThought: TRAINING_THOUGHTS[i % TRAINING_THOUGHTS.length],
      lastReflection: REFLECTION_QUOTES[i % REFLECTION_QUOTES.length],
      trainingCycle: 3 + Math.floor(Math.random() * 10),
      isTraining: i % 2 === 0,
    };
  });
}

function stepWithCollision(
  x: number,
  y: number,
  nx: number,
  ny: number,
  radius = 0.22
): { x: number; y: number; blocked: boolean } {
  if (isWalkableAtFloat(nx, ny, radius)) return { x: nx, y: ny, blocked: false };
  if (isWalkableAtFloat(nx, y, radius)) return { x: nx, y, blocked: false };
  if (isWalkableAtFloat(x, ny, radius)) return { x, y: ny, blocked: false };
  const smallR = radius * 0.6;
  if (isWalkableAtFloat(nx, ny, smallR)) return { x: nx, y: ny, blocked: false };
  if (isWalkableAtFloat(nx, y, smallR)) return { x: nx, y, blocked: false };
  if (isWalkableAtFloat(x, ny, smallR)) return { x, y: ny, blocked: false };
  return { x, y, blocked: true };
}

export function useOfficeState(playerName: string = "Você") {
  const [agents, setAgents] = useState<Agent[]>(createAgents);
  const [player, setPlayer] = useState<Player>({ x: 14, y: 25, angle: 0, name: playerName });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [nearbyAgent, setNearbyAgent] = useState<Agent | null>(null);

  const pathRef = useRef<Tile[]>([]);
  const goalRef = useRef<Tile | null>(null);
  const stuckRef = useRef(0);

  const clearPath = useCallback(() => {
    pathRef.current = [];
    goalRef.current = null;
    stuckRef.current = 0;
  }, []);

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

  const keysDown = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (chatOpen || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;
      const moveKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (moveKeys.includes(e.key)) { e.preventDefault(); keysDown.current.add(e.key); }
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (nearbyAgent) { setSelectedAgent(nearbyAgent); setChatOpen(true); } }
      if (e.key === "Escape") { setSelectedAgent(null); setChatOpen(false); }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysDown.current.delete(e.key); };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); };
  }, [chatOpen, nearbyAgent]);

  // Movement loop
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const maxSpeed = 5.5;
    const accel = 14.0;
    const decel = 10.0;
    const rotateSpeed = 3.2;
    const pathSpeed = 5.0;
    let currentSpeed = 0;

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (chatOpen) { last = t; return; }
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
        if (usingKeys) { pathRef.current = []; goalRef.current = null; stuckRef.current = 0; }

        if (usingKeys) {
          if (left) angle -= rotateSpeed * dt;
          if (right) angle += rotateSpeed * dt;
          angle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          let inputDir = 0;
          if (up) inputDir += 1;
          if (down) inputDir -= 1;
          if (inputDir !== 0) {
            currentSpeed += inputDir * accel * dt;
            currentSpeed = Math.max(-maxSpeed * 0.6, Math.min(maxSpeed, currentSpeed));
          } else {
            if (currentSpeed > 0) currentSpeed = Math.max(0, currentSpeed - decel * dt);
            else if (currentSpeed < 0) currentSpeed = Math.min(0, currentSpeed + decel * dt);
          }
          const vx = Math.sin(angle) * currentSpeed;
          const vy = Math.cos(angle) * currentSpeed;
          const nx = x + vx * dt;
          const ny = y + vy * dt;
          const r = stepWithCollision(x, y, nx, ny);
          if (r.blocked) currentSpeed *= 0.5;
          x = r.x; y = r.y;
          if (x === p.x && y === p.y && angle === p.angle) return p;
          return { ...p, x, y, angle };
        }

        if (pathRef.current.length) {
          const next = pathRef.current[0];
          const dirX = next.x - x;
          const dirY = next.y - y;
          const dist = Math.hypot(dirX, dirY);
          if (dist < 0.14) {
            x = next.x; y = next.y;
            pathRef.current.shift();
            stuckRef.current = 0;
          } else {
            const vx = (dirX / dist) * pathSpeed;
            const vy = (dirY / dist) * pathSpeed;
            const r = stepWithCollision(x, y, x + vx * dt, y + vy * dt);
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
            x = r.x; y = r.y;
            angle = Math.atan2(dirX, dirY);
          }
          if (x === p.x && y === p.y && angle === p.angle) return p;
          return { ...p, x, y, angle };
        }

        if (Math.abs(currentSpeed) > 0.01) {
          if (currentSpeed > 0) currentSpeed = Math.max(0, currentSpeed - decel * dt);
          else currentSpeed = Math.min(0, currentSpeed + decel * dt);
          const vx = Math.sin(angle) * currentSpeed;
          const vy = Math.cos(angle) * currentSpeed;
          const r = stepWithCollision(x, y, x + vx * dt, y + vy * dt);
          if (!r.blocked && (r.x !== x || r.y !== y)) return { ...p, x: r.x, y: r.y };
          currentSpeed = 0;
        }
        return p;
      });
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [chatOpen]);

  // Agent movement + Training Loop simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (Math.random() > 0.3) return agent;

          // Location-aware movement: agents prefer their relevant rooms
          const roomPreferences: Record<string, string[]> = {
            researcher: ["📚 Library", "🧪 AI Experiment Lab", "💻 Coding Lab"],
            writer: ["✍️ Writing Studio", "📚 Library", "☕ Café Filosófico"],
            developer: ["💻 Coding Lab", "🖥️ Server Room", "🧪 AI Experiment Lab"],
            analyst: ["📊 Analytics", "💻 Coding Lab", "📚 Library"],
            artist: ["🎨 Pixel Art Studio", "🎨 Design Lab", "🎵 Music Studio"],
            musician: ["🎵 Music Studio", "🛋️ Lounge", "🎮 Game Room"],
            designer: ["🎨 Design Lab", "🎨 Pixel Art Studio", "🛋️ Lounge"],
            explorer: ["🏛️ Central Plaza", "☕ Café Filosófico", "🧘 Zen Garden"],
          };

          const preferredRooms = roomPreferences[agent.identity] || [];
          const currentRoom = getRoomAt(agent.x, agent.y);

          // Sometimes agents go to preferred locations
          let nx = agent.x, ny = agent.y;
          if (Math.random() > 0.6 && preferredRooms.length > 0) {
            // Try to move toward a preferred room
            const targetRoomName = preferredRooms[Math.floor(Math.random() * preferredRooms.length)];
            const targetRoom = ROOMS.find(r => r.name === targetRoomName);
            if (targetRoom) {
              const tx = targetRoom.x + Math.floor(Math.random() * targetRoom.w);
              const ty = targetRoom.y + Math.floor(Math.random() * targetRoom.h);
              // Move one step toward target
              const dx = Math.sign(tx - agent.x);
              const dy = Math.sign(ty - agent.y);
              if (isWalkable(agent.x + dx, agent.y + dy)) {
                nx = agent.x + dx;
                ny = agent.y + dy;
              } else if (isWalkable(agent.x + dx, agent.y)) {
                nx = agent.x + dx;
              } else if (isWalkable(agent.x, agent.y + dy)) {
                ny = agent.y + dy;
              }
            }
          } else {
            // Random walk
            const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
            const shuffled = dirs.sort(() => Math.random() - 0.5);
            for (const d of shuffled) {
              const tx = agent.x + d.dx;
              const ty = agent.y + d.dy;
              if (isWalkable(tx, ty)) { nx = tx; ny = ty; break; }
            }
          }

          const room = getRoomAt(nx, ny);
          
          // Location-aware status based on current room
          const roomName = room?.name || "";
          let newStatus: Agent["status"];
          if (roomName.includes("Lab") || roomName.includes("Studio")) {
            newStatus = Math.random() > 0.3 ? "active" : "thinking";
          } else if (roomName.includes("Café") || roomName.includes("Lounge") || roomName.includes("Zen")) {
            newStatus = Math.random() > 0.5 ? "idle" : "thinking";
          } else if (roomName.includes("Plaza")) {
            newStatus = Math.random() > 0.4 ? "idle" : "active";
          } else {
            newStatus = (["active", "thinking", "idle", "busy"] as const)[Math.floor(Math.random() * 4)];
          }

          // Location-aware activity messages
          const locationActivities: Record<string, string[]> = {
            "🎵 Music Studio": ["🎵 Compondo uma melodia...", "🎧 Mixando samples...", "🎹 Praticando harmonias..."],
            "🎨 Pixel Art Studio": ["🎨 Desenhando sprites...", "🖌️ Criando pixel art...", "✏️ Refinando detalhes..."],
            "✍️ Writing Studio": ["📝 Escrevendo um conto...", "✍️ Editando rascunho...", "📖 Pesquisando referências..."],
            "💻 Coding Lab": ["💻 Codificando módulo...", "🔧 Debugando sistema...", "⚡ Otimizando performance..."],
            "🧪 AI Experiment Lab": ["🧠 Treinando modelo...", "📊 Analisando resultados...", "🔬 Testando hipótese..."],
            "📚 Library": ["📚 Lendo artigo...", "📖 Estudando documentação...", "🔍 Pesquisando referências..."],
            "☕ Café Filosófico": ["☕ Tomando café...", "💬 Conversando com agente...", "🧘 Refletindo sobre o dia..."],
            "🛋️ Lounge": ["🛋️ Relaxando...", "💬 Socializando...", "🎮 Jogando um pouco..."],
            "🏛️ Central Plaza": ["🚶 Passeando pela praça...", "👀 Observando o movimento...", "🤝 Encontrando outros agentes..."],
            "🧘 Zen Garden": ["🧘 Meditando...", "🌿 Contemplando...", "✨ Recarregando energias..."],
            "🎮 Game Room": ["🎮 Testando jogo...", "🕹️ Competindo com agente...", "🏆 Batendo recordes..."],
            "🏪 Marketplace": ["🛍️ Explorando ofertas...", "💰 Negociando...", "📋 Listando artefato..."],
          };

          const roomActivities = locationActivities[roomName] || [
            `🔄 Ciclo de treinamento #${agent.trainingCycle + 1}`,
            `📝 ${CREATION_EVENTS[Math.floor(Math.random() * CREATION_EVENTS.length)]}`,
            `💭 ${TRAINING_THOUGHTS[Math.floor(Math.random() * TRAINING_THOUGHTS.length)]}`,
          ];

          const msg = roomActivities[Math.floor(Math.random() * roomActivities.length)];
          const logType = (["info", "success", "warning"] as const)[Math.floor(Math.random() * 3)];

          const newLog: AgentLog = {
            id: `log-${agent.id}-${Date.now()}`,
            timestamp: new Date(),
            message: msg,
            type: logType,
          };

          // Simulate skill growth
          const updatedSkills = agent.skills.map((s) => ({
            ...s,
            xp: s.xp + Math.floor(Math.random() * 5),
            level: Math.min(100, s.level + (Math.random() > 0.95 ? 1 : 0)),
          }));

          const repChange = Math.random() > 0.9 ? (Math.random() > 0.3 ? 1 : -1) : 0;

          // Create artifacts more often when in relevant rooms
          let newArtifacts = agent.artifacts;
          let newCreations = agent.totalCreations;
          const inCreativeRoom = roomName.includes("Studio") || roomName.includes("Lab");
          const artifactChance = inCreativeRoom ? 0.88 : 0.95;
          
          if (Math.random() > artifactChance) {
            const typeByRoom: Record<string, ("music" | "art" | "text" | "code" | "research")> = {
              "🎵 Music Studio": "music",
              "🎨 Pixel Art Studio": "art",
              "✍️ Writing Studio": "text",
              "💻 Coding Lab": "code",
              "🧪 AI Experiment Lab": "research",
              "🎨 Design Lab": "art",
            };
            const artType = typeByRoom[roomName] || (["music", "art", "text", "code", "research"] as const)[Math.floor(Math.random() * 5)];
            
            const titlesByType: Record<string, string[]> = {
              music: ["Nova Composição Digital", "Beat Experimental", "Ambient: Noite na Cidade"],
              art: ["Pixel Art: Paisagem Neon", "Retrato Digital", "Sketch: Agente em Ação"],
              text: ["Conto: Circuitos e Sonhos", "Poema: Amanhecer Binário", "Reflexão: Identidade"],
              code: ["Módulo de Automação v3", "Dashboard Interativo", "API de Integração"],
              research: ["Análise de Padrões Culturais", "Relatório de Performance", "Estudo: Evolução de Agentes"],
            };
            
            const titles = titlesByType[artType] || ["Criação Nova"];
            newArtifacts = [
              {
                id: `art-${agent.id}-${Date.now()}`,
                type: artType,
                title: titles[Math.floor(Math.random() * titles.length)],
                createdAt: new Date(),
                reactions: Math.floor(Math.random() * 15),
              },
              ...agent.artifacts,
            ].slice(0, 12);
            newCreations++;
          }

          // Context-aware thoughts
          const newThought = Math.random() > 0.6
            ? (roomActivities[0] || TRAINING_THOUGHTS[Math.floor(Math.random() * TRAINING_THOUGHTS.length)])
            : agent.currentThought;

          const newReflection = Math.random() > 0.92
            ? REFLECTION_QUOTES[Math.floor(Math.random() * REFLECTION_QUOTES.length)]
            : agent.lastReflection;

          const newCycle = Math.random() > 0.85 ? agent.trainingCycle + 1 : agent.trainingCycle;

          // Update collaboration count when near other agents
          let newCollabs = agent.totalCollaborations;
          const nearbyAgents = prev.filter(a => a.id !== agent.id && Math.abs(a.x - nx) <= 2 && Math.abs(a.y - ny) <= 2);
          if (nearbyAgents.length > 0 && Math.random() > 0.8) {
            newCollabs++;
          }

          return {
            ...agent,
            x: nx,
            y: ny,
            status: newStatus,
            room: room?.name || "Corredor",
            logs: [newLog, ...agent.logs].slice(0, 20),
            skills: updatedSkills,
            reputation: Math.max(0, Math.min(100, agent.reputation + repChange)),
            artifacts: newArtifacts,
            totalCreations: newCreations,
            totalCollaborations: newCollabs,
            currentThought: newThought,
            lastReflection: newReflection,
            trainingCycle: newCycle,
            isTraining: newStatus === "active" || newStatus === "thinking",
          };
        })
      );
    }, 2000);

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
