import { useState, useCallback, useEffect, useMemo } from "react";
import type { Agent, Player } from "@/types/agent";
import { getRoomAt, FURNITURE } from "@/data/officeMap";
import { tileFromFloat } from "@/hooks/office/movementUtils";
import { useAgentSimulation } from "@/hooks/office/agentSimulation";
import { usePlayerMovement } from "@/hooks/office/playerMovement";
import { useFurnitureInteraction } from "@/hooks/office/furnitureInteraction";
import {
  AGENT_PERSONALITIES,
  generateInitialArtifacts,
  generateInitialRelationships,
  generateLifeArc,
  TRAINING_THOUGHTS,
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
      trainingCycle: 3 + ((i * 7 + 5) % 10),
      isTraining: i % 2 === 0,
    };
  });
}

export function useOfficeState(playerName: string = "Você") {
  const [agents, setAgents] = useState<Agent[]>(createAgents);
  const [player, setPlayer] = useState<Player>({ x: 14, y: 25, angle: 0, name: playerName });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [nearbyAgent, setNearbyAgent] = useState<Agent | null>(null);

  // Delegated hooks
  const { movePlayer, setPlayerDestination } = usePlayerMovement(player, setPlayer, chatOpen);
  useAgentSimulation(setAgents);
  const {
    nearbyInteractable,
    activeInteraction,
    interactionMessage,
    interact,
  } = useFurnitureInteraction(player, FURNITURE);

  // Keyboard interaction (space/enter for agent chat OR furniture interaction, escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (chatOpen || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (nearbyAgent) {
          setSelectedAgent(nearbyAgent);
          setChatOpen(true);
        } else if (nearbyInteractable) {
          interact();
        }
      }
      if (e.key === "Escape") {
        setSelectedAgent(null);
        setChatOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chatOpen, nearbyAgent, nearbyInteractable, interact]);

  // Nearby agent detection
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
    // New interaction system
    nearbyInteractable,
    activeInteraction,
    interactionMessage,
    interact,
  };
}
