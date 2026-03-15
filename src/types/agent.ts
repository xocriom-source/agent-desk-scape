export type AgentStatus = "active" | "idle" | "thinking";

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  avatar: number;
  color: string;
  position: { x: number; z: number };
  targetPosition?: { x: number; z: number };
  tasks: string[];
  currentTask?: string;
  logs: AgentLog[];
}

export interface AgentLog {
  id: string;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export interface FurnitureItem {
  id: string;
  type: "desk" | "chair" | "plant" | "bookshelf" | "coffee" | "monitor" | "sofa" | "whiteboard" | "server";
  position: { x: number; z: number };
  rotation?: number;
  size: { w: number; h: number };
}

export interface OfficeRoom {
  id: string;
  name: string;
  width: number;
  depth: number;
  agents: Agent[];
  furniture: FurnitureItem[];
}
