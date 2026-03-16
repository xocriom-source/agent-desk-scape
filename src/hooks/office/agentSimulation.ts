import { useEffect, useCallback } from "react";
import type { Agent, AgentLog } from "@/types/agent";
import { isWalkable, getRoomAt, ROOMS } from "@/data/officeMap";
import {
  AGENT_PERSONALITIES,
  TRAINING_THOUGHTS,
  CREATION_EVENTS,
  REFLECTION_QUOTES,
} from "@/data/agentPersonalities";

const ROOM_PREFERENCES: Record<string, string[]> = {
  researcher: ["📚 Library", "🧪 AI Experiment Lab", "💻 Coding Lab"],
  writer: ["✍️ Writing Studio", "📚 Library", "☕ Café Filosófico"],
  developer: ["💻 Coding Lab", "🖥️ Server Room", "🧪 AI Experiment Lab"],
  analyst: ["📊 Analytics", "💻 Coding Lab", "📚 Library"],
  artist: ["🎨 Pixel Art Studio", "🎨 Design Lab", "🎵 Music Studio"],
  musician: ["🎵 Music Studio", "🛋️ Lounge", "🎮 Game Room"],
  designer: ["🎨 Design Lab", "🎨 Pixel Art Studio", "🛋️ Lounge"],
  explorer: ["🏛️ Central Plaza", "☕ Café Filosófico", "🧘 Zen Garden"],
};

const LOCATION_ACTIVITIES: Record<string, string[]> = {
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

const ARTIFACT_TYPE_BY_ROOM: Record<string, "music" | "art" | "text" | "code" | "research"> = {
  "🎵 Music Studio": "music",
  "🎨 Pixel Art Studio": "art",
  "✍️ Writing Studio": "text",
  "💻 Coding Lab": "code",
  "🧪 AI Experiment Lab": "research",
  "🎨 Design Lab": "art",
};

const TITLES_BY_TYPE: Record<string, string[]> = {
  music: ["Nova Composição Digital", "Beat Experimental", "Ambient: Noite na Cidade"],
  art: ["Pixel Art: Paisagem Neon", "Retrato Digital", "Sketch: Agente em Ação"],
  text: ["Conto: Circuitos e Sonhos", "Poema: Amanhecer Binário", "Reflexão: Identidade"],
  code: ["Módulo de Automação v3", "Dashboard Interativo", "API de Integração"],
  research: ["Análise de Padrões Culturais", "Relatório de Performance", "Estudo: Evolução de Agentes"],
};

function moveAgent(agent: Agent, allAgents: Agent[]): { nx: number; ny: number } {
  const preferredRooms = ROOM_PREFERENCES[agent.identity] || [];
  let nx = agent.x, ny = agent.y;

  if (Math.random() > 0.6 && preferredRooms.length > 0) {
    const targetRoomName = preferredRooms[Math.floor(Math.random() * preferredRooms.length)];
    const targetRoom = ROOMS.find(r => r.name === targetRoomName);
    if (targetRoom) {
      const tx = targetRoom.x + Math.floor(Math.random() * targetRoom.w);
      const ty = targetRoom.y + Math.floor(Math.random() * targetRoom.h);
      const dx = Math.sign(tx - agent.x);
      const dy = Math.sign(ty - agent.y);
      if (isWalkable(agent.x + dx, agent.y + dy)) { nx = agent.x + dx; ny = agent.y + dy; }
      else if (isWalkable(agent.x + dx, agent.y)) { nx = agent.x + dx; }
      else if (isWalkable(agent.x, agent.y + dy)) { ny = agent.y + dy; }
    }
  } else {
    const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
    const shuffled = dirs.sort(() => Math.random() - 0.5);
    for (const d of shuffled) {
      const tx = agent.x + d.dx;
      const ty = agent.y + d.dy;
      if (isWalkable(tx, ty)) { nx = tx; ny = ty; break; }
    }
  }
  return { nx, ny };
}

function getStatusForRoom(roomName: string): Agent["status"] {
  if (roomName.includes("Lab") || roomName.includes("Studio")) {
    return Math.random() > 0.3 ? "active" : "thinking";
  } else if (roomName.includes("Café") || roomName.includes("Lounge") || roomName.includes("Zen")) {
    return Math.random() > 0.5 ? "idle" : "thinking";
  } else if (roomName.includes("Plaza")) {
    return Math.random() > 0.4 ? "idle" : "active";
  }
  return (["active", "thinking", "idle", "busy"] as const)[Math.floor(Math.random() * 4)];
}

export function useAgentSimulation(
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>
) {
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (Math.random() > 0.3) return agent;

          const { nx, ny } = moveAgent(agent, prev);
          const room = getRoomAt(nx, ny);
          const roomName = room?.name || "";
          const newStatus = getStatusForRoom(roomName);

          const roomActivities = LOCATION_ACTIVITIES[roomName] || [
            `🔄 Ciclo de treinamento #${agent.trainingCycle + 1}`,
            `📝 ${CREATION_EVENTS[Math.floor(Math.random() * CREATION_EVENTS.length)]}`,
            `💭 ${TRAINING_THOUGHTS[Math.floor(Math.random() * TRAINING_THOUGHTS.length)]}`,
          ];

          const msg = roomActivities[Math.floor(Math.random() * roomActivities.length)];
          const newLog: AgentLog = {
            id: `log-${agent.id}-${Date.now()}`,
            timestamp: new Date(),
            message: msg,
            type: (["info", "success", "warning"] as const)[Math.floor(Math.random() * 3)],
          };

          const updatedSkills = agent.skills.map((s) => ({
            ...s,
            xp: s.xp + Math.floor(Math.random() * 5),
            level: Math.min(100, s.level + (Math.random() > 0.95 ? 1 : 0)),
          }));

          const repChange = Math.random() > 0.9 ? (Math.random() > 0.3 ? 1 : -1) : 0;

          let newArtifacts = agent.artifacts;
          let newCreations = agent.totalCreations;
          const inCreativeRoom = roomName.includes("Studio") || roomName.includes("Lab");
          const artifactChance = inCreativeRoom ? 0.88 : 0.95;

          if (Math.random() > artifactChance) {
            const artType = ARTIFACT_TYPE_BY_ROOM[roomName] || (["music", "art", "text", "code", "research"] as const)[Math.floor(Math.random() * 5)];
            const titles = TITLES_BY_TYPE[artType] || ["Criação Nova"];
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

          const newThought = Math.random() > 0.6
            ? (roomActivities[0] || TRAINING_THOUGHTS[Math.floor(Math.random() * TRAINING_THOUGHTS.length)])
            : agent.currentThought;
          const newReflection = Math.random() > 0.92
            ? REFLECTION_QUOTES[Math.floor(Math.random() * REFLECTION_QUOTES.length)]
            : agent.lastReflection;
          const newCycle = Math.random() > 0.85 ? agent.trainingCycle + 1 : agent.trainingCycle;

          let newCollabs = agent.totalCollaborations;
          const nearbyAgents = prev.filter(a => a.id !== agent.id && Math.abs(a.x - nx) <= 2 && Math.abs(a.y - ny) <= 2);
          if (nearbyAgents.length > 0 && Math.random() > 0.8) newCollabs++;

          return {
            ...agent,
            x: nx, y: ny,
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
  }, [setAgents]);
}
