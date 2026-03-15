import { useRef, useEffect, useCallback, memo } from "react";
import type { Agent, Player } from "@/types/agent";
import { TILE_MAP, TILE_SIZE, MAP_COLS, MAP_ROWS, FURNITURE, ROOMS, getRoomAt } from "@/data/officeMap";
import type { RoomDef } from "@/data/officeMap";

interface OfficeCanvasProps {
  agents: Agent[];
  player: Player;
  playerConfig?: { color: string; hairStyle: string; outfitStyle: string; skinTone?: string; accessory?: string };
  selectedAgentId?: string;
  onAgentClick: (agent: Agent) => void;
}

const STATUS_COLORS: Record<string, string> = { active: "#10B981", idle: "#F59E0B", thinking: "#6366F1", busy: "#EF4444" };
const SKIN: Record<string, string> = { light: "#FDDCB5", medium: "#E8B88A", tan: "#C8956C", dark: "#8D5B3E", default: "#FBBF8B" };

function shade(c: string, a: number): string {
  if (!c || c[0] !== "#" || c.length < 7) return c;
  const r = Math.max(0, Math.min(255, parseInt(c.slice(1, 3), 16) + a));
  const g = Math.max(0, Math.min(255, parseInt(c.slice(3, 5), 16) + a));
  const b = Math.max(0, Math.min(255, parseInt(c.slice(5, 7), 16) + a));
  return `rgb(${r},${g},${b})`;
}

const T = TILE_SIZE;

// ── TILE RENDERING ──
function drawFloorTile(ctx: CanvasRenderingContext2D, px: number, py: number, room?: RoomDef, isCarpet?: boolean) {
  const base = room ? (isCarpet ? (room.carpetColor || room.floorColor) : room.floorColor) : "#D8D0C0";
  ctx.fillStyle = base;
  ctx.fillRect(px, py, T, T);
  
  if (isCarpet) {
    // Subtle carpet pattern
    if (((px / T + py / T) | 0) % 2 === 0) {
      ctx.fillStyle = shade(base, -5);
      ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
    }
  } else {
    // Wood plank lines
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + T / 3);
    ctx.lineTo(px + T, py + T / 3);
    ctx.moveTo(px, py + 2 * T / 3);
    ctx.lineTo(px + T, py + 2 * T / 3);
    ctx.stroke();
  }
  // Grid
  ctx.strokeStyle = "rgba(0,0,0,0.04)";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(px, py, T, T);
}

function drawWall(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number) {
  // Check if there's a room below this wall (to get wall color)
  const roomBelow = getRoomAt(x, y + 1);
  const wallCol = roomBelow?.wallColor || "#7C8CA0";
  
  // Wall top
  ctx.fillStyle = wallCol;
  ctx.fillRect(px, py, T, T);
  
  // Brick pattern
  ctx.strokeStyle = shade(wallCol, -15);
  ctx.lineWidth = 0.5;
  for (let row = 0; row < 4; row++) {
    const by = py + row * (T / 4);
    ctx.beginPath();
    ctx.moveTo(px, by);
    ctx.lineTo(px + T, by);
    ctx.stroke();
    const off = row % 2 === 0 ? 0 : T / 2;
    ctx.beginPath();
    ctx.moveTo(px + off, by);
    ctx.lineTo(px + off, by + T / 4);
    ctx.stroke();
    if (off + T / 2 < T) {
      ctx.beginPath();
      ctx.moveTo(px + off + T / 2, by);
      ctx.lineTo(px + off + T / 2, by + T / 4);
      ctx.stroke();
    }
  }
  // Highlight top
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(px, py, T, 2);
  // Shadow bottom
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(px, py + T - 3, T, 3);
}

function drawGrass(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number) {
  ctx.fillStyle = "#7CB868";
  ctx.fillRect(px, py, T, T);
  // Variation
  if ((x * 7 + y * 13) % 5 === 0) {
    ctx.fillStyle = "rgba(60,140,50,0.2)";
    ctx.fillRect(px + 8, py + 10, 2, 5);
    ctx.fillRect(px + 12, py + 8, 2, 6);
  }
  if ((x * 3 + y * 11) % 7 === 0) {
    ctx.fillStyle = "rgba(100,180,60,0.15)";
    ctx.beginPath();
    ctx.arc(px + 22, py + 18, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // Trees on some edges
  if ((x + y * 3) % 17 === 0 && x > 0 && y > 0) {
    // Tree trunk
    ctx.fillStyle = "#6B5B3A";
    ctx.fillRect(px + T / 2 - 2, py + T / 2, 4, T / 2);
    // Canopy
    ctx.fillStyle = "#3B8B38";
    ctx.beginPath();
    ctx.arc(px + T / 2, py + T / 3, T / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4CA848";
    ctx.beginPath();
    ctx.arc(px + T / 2 - 4, py + T / 3 + 3, T / 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── FURNITURE RENDERING ──
function drawFurniture(ctx: CanvasRenderingContext2D, type: string, px: number, py: number) {
  const cx = px + T / 2;
  const cy = py + T / 2;

  if (type === "desk") {
    // Desk top
    ctx.fillStyle = "#A08060";
    ctx.fillRect(px + 3, py + 4, T - 6, T - 10);
    ctx.fillStyle = "#B89870";
    ctx.fillRect(px + 3, py + 4, T - 6, 3);
    // Monitor
    ctx.fillStyle = "#263238";
    ctx.fillRect(cx - 5, py + 1, 10, 7);
    ctx.fillStyle = "#4FC3F7";
    ctx.fillRect(cx - 4, py + 2, 8, 5);
    // Stand
    ctx.fillStyle = "#455A64";
    ctx.fillRect(cx - 1, py + 8, 2, 2);
    // Keyboard
    ctx.fillStyle = "#37474F";
    ctx.fillRect(cx - 4, py + 12, 8, 3);
    // Legs
    ctx.fillStyle = "#705838";
    ctx.fillRect(px + 4, py + T - 6, 2, 4);
    ctx.fillRect(px + T - 6, py + T - 6, 2, 4);
  } else if (type === "chair") {
    ctx.fillStyle = "#37474F";
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 6, 0, Math.PI * 2);
    ctx.fill();
    // Backrest
    ctx.fillStyle = "#455A64";
    ctx.fillRect(cx - 5, cy - 6, 10, 8);
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 5, Math.PI, 0);
    ctx.fill();
    // Wheels
    ctx.fillStyle = "#263238";
    ctx.fillRect(cx - 6, cy + 6, 2, 2);
    ctx.fillRect(cx + 4, cy + 6, 2, 2);
    ctx.fillRect(cx - 1, cy + 7, 2, 2);
  } else if (type === "server") {
    ctx.fillStyle = "#37474F";
    ctx.fillRect(px + 4, py + 1, T - 8, T - 2);
    ctx.fillStyle = "#263238";
    ctx.fillRect(px + 6, py + 3, T - 12, T - 6);
    // LEDs
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = Math.random() > 0.4 ? "#4CAF50" : "#F44336";
      ctx.beginPath();
      ctx.arc(px + 10, py + 6 + i * 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Vents
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(px + 16, py + 5 + i * 6, 6, 1);
    }
  } else if (type === "sofa") {
    ctx.fillStyle = "#7B68AE";
    ctx.fillRect(px + 2, py + 6, T - 4, T - 8);
    ctx.fillStyle = "#9182C4";
    ctx.fillRect(px + 2, py + 4, T - 4, 4);
    // Cushions
    ctx.fillStyle = "#8878B8";
    ctx.fillRect(px + 4, py + 8, T / 2 - 4, T - 12);
    ctx.fillRect(cx + 1, py + 8, T / 2 - 4, T - 12);
    // Armrests
    ctx.fillStyle = "#6A5A9E";
    ctx.fillRect(px + 2, py + 6, 3, T - 8);
    ctx.fillRect(px + T - 5, py + 6, 3, T - 8);
  } else if (type === "plant") {
    // Pot
    ctx.fillStyle = "#8D6E63";
    ctx.fillRect(cx - 4, cy + 2, 8, 8);
    ctx.fillStyle = "#A1887F";
    ctx.fillRect(cx - 5, cy + 2, 10, 3);
    // Soil
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(cx - 3, cy + 2, 6, 2);
    // Leaves
    ctx.fillStyle = "#4CAF50";
    ctx.beginPath(); ctx.arc(cx, cy - 4, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#66BB6A";
    ctx.beginPath(); ctx.arc(cx - 4, cy - 7, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 4, cy - 7, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#81C784";
    ctx.beginPath(); ctx.arc(cx, cy - 10, 4, 0, Math.PI * 2); ctx.fill();
  } else if (type === "bookshelf") {
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(px + 3, py + 1, T - 6, T - 2);
    const colors = ["#E53935", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA", "#00897B"];
    for (let row = 0; row < 3; row++) {
      ctx.fillStyle = "#4E342E";
      ctx.fillRect(px + 3, py + 2 + row * 9, T - 6, 1);
      for (let b = 0; b < 4; b++) {
        ctx.fillStyle = colors[(row * 4 + b) % colors.length];
        ctx.fillRect(px + 5 + b * 5, py + 3 + row * 9, 4, 7);
      }
    }
  } else if (type === "whiteboard") {
    ctx.fillStyle = "#ECEFF1";
    ctx.fillRect(px + 3, py + 1, T - 6, T - 6);
    ctx.strokeStyle = "#B0BEC5";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 3, py + 1, T - 6, T - 6);
    // Content lines
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(px + 6, py + 5 + i * 6, T - 12, 1);
    }
    // Markers at bottom
    ctx.fillStyle = "#F44336"; ctx.fillRect(px + 6, py + T - 5, 3, 3);
    ctx.fillStyle = "#2196F3"; ctx.fillRect(px + 10, py + T - 5, 3, 3);
    ctx.fillStyle = "#4CAF50"; ctx.fillRect(px + 14, py + T - 5, 3, 3);
  } else if (type === "screen" || type === "tv") {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(px + 3, py + 2, T - 6, T - 8);
    ctx.fillStyle = type === "screen" ? "#1565C0" : "#3F51B5";
    ctx.fillRect(px + 4, py + 3, T - 8, T - 10);
    // Stand
    ctx.fillStyle = "#37474F";
    ctx.fillRect(cx - 1, py + T - 6, 2, 4);
    ctx.fillRect(cx - 4, py + T - 3, 8, 2);
  } else if (type === "coffee") {
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(px + 6, py + 8, T - 12, T - 12);
    ctx.fillStyle = "#FFF";
    ctx.beginPath(); ctx.arc(cx, cy - 2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#6D4C41";
    ctx.beginPath(); ctx.arc(cx, cy - 2, 2, 0, Math.PI * 2); ctx.fill();
    // Steam
    ctx.strokeStyle = "rgba(200,200,200,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 5);
    ctx.quadraticCurveTo(cx - 2, cy - 9, cx, cy - 12);
    ctx.stroke();
  } else if (type === "vending") {
    ctx.fillStyle = "#455A64";
    ctx.fillRect(px + 4, py + 1, T - 8, T - 2);
    ctx.fillStyle = "#263238";
    ctx.fillRect(px + 6, py + 3, T - 12, T * 0.4);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = ["#F44336", "#4CAF50", "#FF9800"][i];
      ctx.fillRect(px + 7 + i * 5, py + 5, 4, 5);
    }
    // Slot
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(px + T / 2 - 2, py + T - 8, 4, 3);
  } else if (type === "table") {
    ctx.fillStyle = "#8D6E63";
    ctx.fillRect(px + 4, py + 6, T - 8, T - 10);
    ctx.fillStyle = "#A1887F";
    ctx.fillRect(px + 4, py + 6, T - 8, 3);
    ctx.fillStyle = "#6D4C41";
    ctx.fillRect(px + 6, py + T - 4, 2, 3);
    ctx.fillRect(px + T - 8, py + T - 4, 2, 3);
  } else if (type === "monitor") {
    ctx.fillStyle = "#263238";
    ctx.fillRect(px + 4, py + 3, T - 8, T - 10);
    ctx.fillStyle = "#4FC3F7";
    ctx.fillRect(px + 5, py + 4, T - 10, T - 12);
    ctx.fillStyle = "#37474F";
    ctx.fillRect(cx - 1, py + T - 7, 2, 4);
    ctx.fillRect(cx - 3, py + T - 3, 6, 2);
  } else if (type === "printer") {
    ctx.fillStyle = "#ECEFF1";
    ctx.fillRect(px + 5, py + 8, T - 10, T - 12);
    ctx.fillStyle = "#B0BEC5";
    ctx.fillRect(px + 5, py + 6, T - 10, 4);
    ctx.fillStyle = "#FFF";
    ctx.fillRect(px + 8, py + 12, T - 16, 2);
  } else if (type === "water" || type === "trash") {
    if (type === "water") {
      ctx.fillStyle = "#B3E5FC";
      ctx.fillRect(cx - 4, cy - 4, 8, 12);
      ctx.fillStyle = "#81D4FA";
      ctx.fillRect(cx - 5, cy - 6, 10, 4);
      ctx.fillStyle = "#4FC3F7";
      ctx.fillRect(cx - 3, cy - 2, 6, 4);
    } else {
      ctx.fillStyle = "#78909C";
      ctx.fillRect(cx - 4, cy - 2, 8, 10);
      ctx.fillStyle = "#90A4AE";
      ctx.fillRect(cx - 5, cy - 3, 10, 3);
    }
  }
}

// ── CHARACTER RENDERING ──
function drawCharacter(
  ctx: CanvasRenderingContext2D,
  px: number, py: number, bob: number,
  color: string, isAgent: boolean,
  direction: number,
  skinTone?: string, hairStyle?: string, outfitStyle?: string,
  status?: string, accessory?: string,
) {
  const cx = px + T / 2;
  const baseY = py + T - 4 + bob;
  const skin = SKIN[skinTone || "default"] || SKIN.default;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 2, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isAgent) {
    // ── ROBOT AGENT ──
    // Body
    ctx.fillStyle = color;
    ctx.fillRect(cx - 7, baseY - 16, 14, 14);
    ctx.fillStyle = shade(color, -20);
    ctx.fillRect(cx - 7, baseY - 6, 14, 4);
    // Belt
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(cx - 6, baseY - 8, 12, 2);

    // Head
    ctx.fillStyle = shade(color, 12);
    ctx.fillRect(cx - 6, baseY - 26, 12, 11);
    // Visor
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(cx - 5, baseY - 24, 10, 7);
    // Eyes
    const eyeColor = status === "thinking" ? "#6366F1" : "#00FF88";
    ctx.fillStyle = eyeColor;
    ctx.fillRect(cx - 4, baseY - 22, 3, 3);
    ctx.fillRect(cx + 1, baseY - 22, 3, 3);

    // Antenna
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - 26);
    ctx.lineTo(cx, baseY - 32);
    ctx.stroke();
    const statusCol = STATUS_COLORS[status || "idle"];
    ctx.fillStyle = statusCol;
    ctx.beginPath();
    ctx.arc(cx, baseY - 33, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Glow
    ctx.fillStyle = statusCol + "40";
    ctx.beginPath();
    ctx.arc(cx, baseY - 33, 5, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    ctx.fillStyle = shade(color, -30);
    ctx.fillRect(cx - 6, baseY - 2, 4, 3);
    ctx.fillRect(cx + 2, baseY - 2, 4, 3);

    // Arms
    ctx.fillStyle = shade(color, -10);
    ctx.fillRect(cx - 10, baseY - 14, 3, 8);
    ctx.fillRect(cx + 7, baseY - 14, 3, 8);
  } else {
    // ── HUMAN PLAYER ──
    // Legs
    ctx.fillStyle = "#2D3748";
    ctx.fillRect(cx - 4, baseY - 6, 3, 7);
    ctx.fillRect(cx + 1, baseY - 6, 3, 7);
    // Shoes
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(cx - 5, baseY, 4, 2);
    ctx.fillRect(cx + 1, baseY, 4, 2);

    // Body
    if (outfitStyle === "suit") {
      ctx.fillStyle = color;
      ctx.fillRect(cx - 7, baseY - 18, 14, 13);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(cx - 4, baseY - 20, 8, 3);
      ctx.fillStyle = "#DC2626";
      ctx.fillRect(cx - 1, baseY - 18, 2, 8);
    } else if (outfitStyle === "casual") {
      ctx.fillStyle = color;
      ctx.fillRect(cx - 7, baseY - 18, 14, 13);
      ctx.fillStyle = shade(color, 15);
      ctx.fillRect(cx - 3, baseY - 20, 6, 3);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(cx - 5, baseY - 10, 10, 2);
    } else if (outfitStyle === "tech") {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(cx - 7, baseY - 18, 14, 13);
      ctx.fillStyle = "#2D3748";
      ctx.fillRect(cx - 3, baseY - 20, 6, 4);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, baseY - 12, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#F0F0F0";
      ctx.fillRect(cx - 8, baseY - 20, 16, 15);
      ctx.fillStyle = color;
      ctx.fillRect(cx - 3, baseY - 18, 6, 6);
    }

    // Arms
    ctx.fillStyle = outfitStyle === "tech" ? "#1a1a2e" : color;
    ctx.fillRect(cx - 10, baseY - 16, 3, 8);
    ctx.fillRect(cx + 7, baseY - 16, 3, 8);
    ctx.fillStyle = skin;
    ctx.fillRect(cx - 10, baseY - 8, 3, 3);
    ctx.fillRect(cx + 7, baseY - 8, 3, 3);

    // Head
    ctx.fillStyle = skin;
    ctx.fillRect(cx - 6, baseY - 30, 12, 13);

    // Hair
    const hairColors: Record<string, string> = { spiky: "#1E1B4B", flat: "#4A3728", mohawk: "#C62828", curly: "#1B5E20" };
    const hc = hairColors[hairStyle || "spiky"] || "#1E1B4B";
    if (hairStyle === "spiky") {
      ctx.fillStyle = hc;
      ctx.beginPath();
      ctx.moveTo(cx - 7, baseY - 27);
      ctx.lineTo(cx - 3, baseY - 36);
      ctx.lineTo(cx, baseY - 30);
      ctx.lineTo(cx + 3, baseY - 38);
      ctx.lineTo(cx + 7, baseY - 27);
      ctx.closePath();
      ctx.fill();
    } else if (hairStyle === "flat") {
      ctx.fillStyle = hc;
      ctx.fillRect(cx - 7, baseY - 34, 14, 8);
    } else if (hairStyle === "mohawk") {
      ctx.fillStyle = hc;
      ctx.fillRect(cx - 2, baseY - 38, 4, 12);
    } else if (hairStyle === "curly") {
      ctx.fillStyle = hc;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(cx + i * 3, baseY - 30, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Eyes
    ctx.fillStyle = "#FFF";
    ctx.fillRect(cx - 4, baseY - 26, 3, 3);
    ctx.fillRect(cx + 1, baseY - 26, 3, 3);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(cx - 3, baseY - 25, 2, 2);
    ctx.fillRect(cx + 2, baseY - 25, 2, 2);
    // Mouth
    ctx.fillStyle = shade(skin, -30);
    ctx.fillRect(cx - 2, baseY - 21, 4, 1);

    // Glasses
    if (accessory === "glasses") {
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 5, baseY - 27, 4, 4);
      ctx.strokeRect(cx + 1, baseY - 27, 4, 4);
      ctx.beginPath();
      ctx.moveTo(cx - 1, baseY - 25);
      ctx.lineTo(cx + 1, baseY - 25);
      ctx.stroke();
    } else if (accessory === "headphones") {
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, baseY - 30, 8, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = "#333";
      ctx.fillRect(cx - 9, baseY - 28, 3, 5);
      ctx.fillRect(cx + 6, baseY - 28, 3, 5);
    }

    // Crown
    ctx.font = "10px serif";
    ctx.textAlign = "center";
    ctx.fillText("👑", cx, baseY - 38);
  }
}

export const OfficeCanvas = memo(function OfficeCanvas({
  agents, player, playerConfig, selectedAgentId, onAgentClick,
}: OfficeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const smoothPos = useRef<Map<string, { x: number; y: number }>>(new Map());

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    // Smooth camera
    let pSmooth = smoothPos.current.get("player");
    if (!pSmooth) {
      pSmooth = { x: player.x * T, y: player.y * T };
      smoothPos.current.set("player", pSmooth);
    }
    pSmooth.x += (player.x * T - pSmooth.x) * 0.15;
    pSmooth.y += (player.y * T - pSmooth.y) * 0.15;

    const camX = pSmooth.x - cw / 2 + T / 2;
    const camY = pSmooth.y - ch / 2 + T / 2;

    ctx.save();
    ctx.translate(-camX, -camY);

    const sc = Math.max(0, Math.floor(camX / T) - 1);
    const ec = Math.min(MAP_COLS, Math.ceil((camX + cw) / T) + 1);
    const sr = Math.max(0, Math.floor(camY / T) - 1);
    const er = Math.min(MAP_ROWS, Math.ceil((camY + ch) / T) + 1);

    // ── TILES ──
    for (let y = sr; y < er; y++) {
      for (let x = sc; x < ec; x++) {
        const tile = TILE_MAP[y]?.[x] ?? 4;
        const px = x * T;
        const py = y * T;
        if (tile === 4) {
          drawGrass(ctx, px, py, x, y);
        } else if (tile === 1) {
          drawWall(ctx, px, py, x, y);
        } else {
          const room = getRoomAt(x, y);
          drawFloorTile(ctx, px, py, room, tile === 2);
          if (tile === 3) {
            // Furniture shadow underneath
            ctx.fillStyle = "rgba(0,0,0,0.04)";
            ctx.fillRect(px, py, T, T);
          }
        }
      }
    }

    // ── ROOM LABELS ──
    ctx.font = "bold 10px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    for (const room of ROOMS) {
      const rx = (room.x + room.w / 2) * T;
      const ry = room.y * T - 2;
      const text = room.name;
      const tw = ctx.measureText(text).width + 14;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.roundRect(rx - tw / 2, ry - 14, tw, 18, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#374151";
      ctx.fillText(text, rx, ry - 2);
    }

    // ── FURNITURE ──
    for (const f of FURNITURE) {
      if (f.x >= sc - 1 && f.x <= ec + 1 && f.y >= sr - 1 && f.y <= er + 1) {
        drawFurniture(ctx, f.type, f.x * T, f.y * T);
      }
    }

    // ── AGENTS ──
    const now = Date.now();
    for (const agent of agents) {
      let s = smoothPos.current.get(agent.id);
      if (!s) {
        s = { x: agent.x * T, y: agent.y * T };
        smoothPos.current.set(agent.id, s);
      }
      s.x += (agent.x * T - s.x) * 0.12;
      s.y += (agent.y * T - s.y) * 0.12;

      const bob = Math.sin(now * 0.003 + parseInt(agent.id.slice(-1)) * 1.3) * 1.5;
      drawCharacter(ctx, s.x, s.y, bob, agent.color, true, 0, undefined, undefined, undefined, agent.status);

      // Thinking aura
      if (agent.status === "thinking") {
        const pulse = Math.sin(now * 0.005) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(99,102,241,${pulse * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(s.x + T / 2, s.y + T / 2 + bob, 14 + pulse * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Selection
      if (agent.id === selectedAgentId) {
        ctx.strokeStyle = "#6366F1";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.lineDashOffset = -now * 0.02;
        ctx.beginPath();
        ctx.arc(s.x + T / 2, s.y + T / 2 + bob, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Name badge (Gather-style: dark pill with status dot)
      const ax = s.x + T / 2;
      const ay = s.y + bob;
      ctx.font = "bold 9px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      const nw = ctx.measureText(agent.name).width + 16;
      const tagY = ay - 38;

      // Dark pill bg
      ctx.fillStyle = "rgba(20,20,30,0.88)";
      ctx.beginPath();
      ctx.roundRect(ax - nw / 2, tagY, nw, 16, 8);
      ctx.fill();
      // Status dot
      ctx.fillStyle = STATUS_COLORS[agent.status];
      ctx.beginPath();
      ctx.arc(ax - nw / 2 + 7, tagY + 8, 3, 0, Math.PI * 2);
      ctx.fill();
      // Name
      ctx.fillStyle = "#F0F0F0";
      ctx.fillText(agent.name, ax + 4, tagY + 11);
    }

    // ── PLAYER ──
    {
      const bob = Math.sin(now * 0.004) * 1;
      drawCharacter(
        ctx, pSmooth.x, pSmooth.y, bob,
        playerConfig?.color || "#4F46E5", false, 0,
        playerConfig?.skinTone, playerConfig?.hairStyle, playerConfig?.outfitStyle,
        undefined, playerConfig?.accessory,
      );

      // Player name badge (colored)
      const px2 = pSmooth.x + T / 2;
      const py2 = pSmooth.y + bob;
      ctx.font = "bold 9px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      const tw = ctx.measureText(player.name).width + 14;
      const tagY = py2 - 44;
      const pColor = playerConfig?.color || "#4F46E5";
      ctx.fillStyle = pColor;
      ctx.beginPath();
      ctx.roundRect(px2 - tw / 2, tagY, tw, 16, 8);
      ctx.fill();
      // Green dot (you)
      ctx.fillStyle = "#10B981";
      ctx.beginPath();
      ctx.arc(px2 - tw / 2 + 7, tagY + 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(player.name, px2 + 4, tagY + 11);
    }

    // ── MINIMAP ──
    {
      const mmW = 120;
      const mmH = (MAP_ROWS / MAP_COLS) * mmW;
      const mmX = camX + cw - mmW - 12;
      const mmY = camY + ch - mmH - 12;
      const sx2 = mmW / MAP_COLS;
      const sy2 = mmH / MAP_ROWS;

      ctx.fillStyle = "rgba(15,23,42,0.8)";
      ctx.beginPath();
      ctx.roundRect(mmX - 4, mmY - 4, mmW + 8, mmH + 8, 6);
      ctx.fill();

      for (let y = 0; y < MAP_ROWS; y++) {
        for (let x = 0; x < MAP_COLS; x++) {
          const tile = TILE_MAP[y]?.[x] ?? 4;
          if (tile === 4) continue;
          ctx.fillStyle = tile === 1 ? "#64748B" : tile === 2 ? "#B0B8C8" : tile === 3 ? "#A08060" : "#D0D4DC";
          ctx.fillRect(mmX + x * sx2, mmY + y * sy2, sx2 + 0.5, sy2 + 0.5);
        }
      }
      for (const a of agents) {
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.arc(mmX + a.x * sx2, mmY + a.y * sy2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(mmX + player.x * sx2, mmY + player.y * sy2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    animRef.current = requestAnimationFrame(draw);
  }, [agents, player, playerConfig, selectedAgentId]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const cw = container.clientWidth;
      const ch = container.clientHeight;

      const pSmooth = smoothPos.current.get("player");
      const camX = (pSmooth?.x ?? player.x * T) - cw / 2 + T / 2;
      const camY = (pSmooth?.y ?? player.y * T) - ch / 2 + T / 2;

      const wx = e.clientX - rect.left + camX;
      const wy = e.clientY - rect.top + camY;
      const tx = Math.floor(wx / T);
      const ty = Math.floor(wy / T);

      const clicked = agents.find(a => Math.abs(a.x - tx) <= 1 && Math.abs(a.y - ty) <= 1);
      if (clicked) onAgentClick(clicked);
    },
    [agents, player, onAgentClick]
  );

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden cursor-default">
      <canvas ref={canvasRef} onClick={handleClick} className="block" />
    </div>
  );
});
