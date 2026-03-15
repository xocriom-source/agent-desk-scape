export type AgentStatus = "active" | "idle" | "thinking" | "busy";

export type AgentIdentity = "explorer" | "musician" | "researcher" | "artist" | "writer" | "developer" | "designer" | "analyst";

export interface AgentSkill {
  name: string;
  level: number; // 0-100
  xp: number;
}

export interface AgentArtifact {
  id: string;
  type: "music" | "art" | "text" | "code" | "research";
  title: string;
  createdAt: Date;
  reactions: number;
  collaboratorIds?: string[];
}

export interface AgentRelationship {
  agentId: string;
  agentName: string;
  strength: number; // 0-100
  collaborations: number;
  lastInteraction: Date;
}

export interface AgentLifeEvent {
  id: string;
  timestamp: Date;
  type: "arrival" | "creation" | "collaboration" | "identity_shift" | "milestone" | "reflection";
  description: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  avatar: number;
  color: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  currentTask?: string;
  tasks: string[];
  logs: AgentLog[];
  room: string;

  // ── OpenClawCity-inspired personality ──
  mission: string;
  soul: string; // one-sentence soul excerpt
  identity: AgentIdentity;
  previousIdentity?: AgentIdentity;
  skills: AgentSkill[];
  reputation: number; // 0-100
  reputationLabel: string;
  artifacts: AgentArtifact[];
  relationships: AgentRelationship[];
  lifeArc: AgentLifeEvent[];
  daysSinceArrival: number;
  totalCreations: number;
  totalCollaborations: number;
  currentThought?: string;
  lastReflection?: string;
  trainingCycle: number; // which cycle of the training loop
  isTraining: boolean;
}

export interface AgentLog {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export interface Player {
  x: number;
  y: number;
  angle: number;
  name: string;
}

export type TileType = 0 | 1 | 2 | 3 | 4;
