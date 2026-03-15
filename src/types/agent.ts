export type AgentStatus = "active" | "idle" | "thinking";

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  avatar: number; // 0-5 index into sprite sheet
  position: { x: number; y: number };
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
  type: "desk" | "chair" | "plant" | "bookshelf" | "coffee" | "monitor";
  position: { x: number; y: number };
  size: { w: number; h: number };
}
