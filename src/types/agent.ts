export type AgentStatus = "active" | "idle" | "thinking" | "busy";

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
  angle: number; // facing direction in radians
  name: string;
}

// 0 = floor, 1 = wall, 2 = carpet, 3 = desk, 4 = empty/outside
export type TileType = 0 | 1 | 2 | 3 | 4;
