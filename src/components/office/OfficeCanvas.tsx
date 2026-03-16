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
    if (((px / T + py / T) | 0) % 2 === 0) {
      ctx.fillStyle = shade(base, -5);
      ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
    }
  } else {
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py + T / 3);
    ctx.lineTo(px + T, py + T / 3);
    ctx.moveTo(px, py + 2 * T / 3);
    ctx.lineTo(px + T, py + 2 * T / 3);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,0,0,0.04)";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(px, py, T, T);
}

function drawWall(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number) {
  const roomBelow = getRoomAt(x, y + 1);
  const wallCol = roomBelow?.wallColor || "#7C8CA0";
  
  ctx.fillStyle = wallCol;
  ctx.fillRect(px, py, T, T);
  
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
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(px, py, T, 2);
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(px, py + T - 3, T, 3);
}

function drawGrass(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number) {
  ctx.fillStyle = "#7CB868";
  ctx.fillRect(px, py, T, T);
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
  if ((x + y * 3) % 17 === 0 && x > 0 && y > 0) {
    ctx.fillStyle = "#6B5B3A";
    ctx.fillRect(px + T / 2 - 2, py + T / 2, 4, T / 2);
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

// ── Deterministic pseudo-random for furniture details ──
function seededRand(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed) | 0;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

// ── FURNITURE RENDERING ──
function drawFurniture(ctx: CanvasRenderingContext2D, type: string, px: number, py: number) {
  const cx = px + T / 2;
  const cy = py + T / 2;

  switch (type) {
    case "desk":
    case "desk_large": {
      ctx.fillStyle = "#A08060";
      ctx.fillRect(px + 2, py + 4, T - 4, T - 8);
      ctx.fillStyle = "#B89870";
      ctx.fillRect(px + 2, py + 4, T - 4, 3);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(cx - 6, py + 1, 12, 8);
      ctx.fillStyle = "#4FC3F7";
      ctx.fillRect(cx - 5, py + 2, 10, 5);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      for (let i = 0; i < 3; i++) ctx.fillRect(cx - 4, py + 3 + i * 2, 8, 1);
      ctx.fillStyle = "#455A64";
      ctx.fillRect(cx - 1, py + 9, 2, 2);
      ctx.fillStyle = "#37474F";
      ctx.fillRect(cx - 5, py + 13, 10, 3);
      ctx.fillStyle = "#455A64";
      for (let k = 0; k < 4; k++) ctx.fillRect(cx - 4 + k * 2.5, py + 13.5, 1.5, 1);
      ctx.fillStyle = "#546E7A";
      ctx.fillRect(cx + 6, py + 14, 3, 2);
      ctx.fillStyle = "#705838";
      ctx.fillRect(px + 3, py + T - 5, 2, 4);
      ctx.fillRect(px + T - 5, py + T - 5, 2, 4);
      break;
    }
    case "chair": {
      ctx.fillStyle = "#263238";
      ctx.beginPath(); ctx.arc(cx, cy + 6, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      for (let a = 0; a < 5; a++) {
        const angle = (a / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.fillRect(cx + Math.cos(angle) * 5 - 1, cy + 6 + Math.sin(angle) * 5 - 1, 2, 2);
      }
      ctx.fillStyle = "#37474F";
      ctx.beginPath(); ctx.ellipse(cx, cy + 2, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#455A64";
      ctx.fillRect(cx - 5, cy - 7, 10, 9);
      ctx.beginPath(); ctx.arc(cx, cy - 7, 5, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "#37474F";
      ctx.fillRect(cx - 8, cy - 2, 3, 4);
      ctx.fillRect(cx + 5, cy - 2, 3, 4);
      break;
    }
    case "server": {
      ctx.fillStyle = "#263238";
      ctx.fillRect(px + 3, py + 0, T - 6, T);
      ctx.fillStyle = "#37474F";
      ctx.fillRect(px + 4, py + 1, T - 8, T - 2);
      // Deterministic LEDs instead of Math.random()
      const ledColors = ["#4CAF50", "#4CAF50", "#F44336", "#FF9800", "#4CAF50"];
      for (let row = 0; row < 4; row++) {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(px + 5, py + 2 + row * 7, T - 10, 5);
        for (let i = 0; i < 3; i++) {
          const idx = (row * 3 + i + Math.floor(px / T) + Math.floor(py / T)) % ledColors.length;
          ctx.fillStyle = ledColors[idx];
          ctx.beginPath(); ctx.arc(px + 7 + i * 3, py + 4 + row * 7, 1, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = "#0D1117";
        for (let v = 0; v < 3; v++) ctx.fillRect(px + 17, py + 2 + row * 7 + v * 2, 5, 0.5);
      }
      break;
    }
    case "sofa": {
      ctx.fillStyle = "#6B5DAE";
      ctx.fillRect(px + 1, py + 5, T - 2, T - 6);
      ctx.fillStyle = "#7B6DC8";
      ctx.fillRect(px + 1, py + 3, T - 2, 4);
      ctx.fillStyle = "#8878B8";
      ctx.fillRect(px + 3, py + 7, T / 2 - 3, T - 10);
      ctx.fillRect(cx, py + 7, T / 2 - 3, T - 10);
      ctx.fillStyle = "#5A4DA0";
      ctx.fillRect(px + 1, py + 5, 3, T - 6);
      ctx.fillRect(px + T - 4, py + 5, 3, T - 6);
      ctx.fillStyle = "#A898D8";
      ctx.beginPath(); ctx.arc(px + 5, py + 8, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "plant":
    case "plant_large": {
      const big = type === "plant_large";
      ctx.fillStyle = "#8D6E63";
      ctx.fillRect(cx - (big ? 6 : 4), cy + (big ? 0 : 2), big ? 12 : 8, big ? 10 : 8);
      ctx.fillStyle = "#A1887F";
      ctx.fillRect(cx - (big ? 7 : 5), cy + (big ? 0 : 2), big ? 14 : 10, 3);
      ctx.fillStyle = "#5D4037";
      ctx.fillRect(cx - (big ? 5 : 3), cy + (big ? 0 : 2), big ? 10 : 6, 2);
      ctx.fillStyle = "#388E3C";
      ctx.beginPath(); ctx.arc(cx, cy - (big ? 8 : 4), big ? 10 : 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#43A047";
      ctx.beginPath(); ctx.arc(cx - 4, cy - (big ? 12 : 7), big ? 7 : 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 4, cy - (big ? 12 : 7), big ? 7 : 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#66BB6A";
      ctx.beginPath(); ctx.arc(cx, cy - (big ? 16 : 10), big ? 5 : 4, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "bookshelf": {
      ctx.fillStyle = "#4E342E";
      ctx.fillRect(px + 2, py + 0, T - 4, T);
      ctx.fillStyle = "#5D4037";
      ctx.fillRect(px + 3, py + 1, T - 6, T - 2);
      const cols = ["#C62828", "#1565C0", "#2E7D32", "#EF6C00", "#6A1B9A", "#00838F", "#D84315", "#1B5E20"];
      for (let row = 0; row < 3; row++) {
        ctx.fillStyle = "#3E2723";
        ctx.fillRect(px + 3, py + 1 + row * 10, T - 6, 1);
        for (let b = 0; b < 5; b++) {
          ctx.fillStyle = cols[(row * 5 + b) % cols.length];
          // Deterministic book width
          const bw = 3 + seededRand(px + b, py + row, 42) * 1.5;
          ctx.fillRect(px + 4 + b * 5, py + 2 + row * 10, bw, 8);
        }
      }
      break;
    }
    case "whiteboard": {
      ctx.fillStyle = "#E8EAF0";
      ctx.fillRect(px + 2, py + 0, T - 4, T - 4);
      ctx.strokeStyle = "#B0BEC5";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px + 2, py + 0, T - 4, T - 4);
      ctx.strokeStyle = "#1565C0";
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(px + 6, py + 6); ctx.lineTo(px + 20, py + 8); ctx.stroke();
      ctx.strokeStyle = "#C62828";
      ctx.beginPath(); ctx.moveTo(px + 6, py + 12); ctx.lineTo(px + 18, py + 14); ctx.stroke();
      ctx.strokeStyle = "#2E7D32";
      ctx.beginPath(); ctx.moveTo(px + 6, py + 18); ctx.lineTo(px + 22, py + 19); ctx.stroke();
      ctx.fillStyle = "#F44336"; ctx.fillRect(px + 6, py + T - 4, 3, 3);
      ctx.fillStyle = "#2196F3"; ctx.fillRect(px + 11, py + T - 4, 3, 3);
      ctx.fillStyle = "#4CAF50"; ctx.fillRect(px + 16, py + T - 4, 3, 3);
      break;
    }
    case "screen":
    case "tv": {
      ctx.fillStyle = "#0D1117";
      ctx.fillRect(px + 2, py + 1, T - 4, T - 8);
      const grad = ctx.createLinearGradient(px + 3, py + 2, px + T - 3, py + T - 9);
      grad.addColorStop(0, type === "tv" ? "#1A237E" : "#0D47A1");
      grad.addColorStop(1, type === "tv" ? "#311B92" : "#1565C0");
      ctx.fillStyle = grad;
      ctx.fillRect(px + 3, py + 2, T - 6, T - 10);
      ctx.fillStyle = "#37474F";
      ctx.fillRect(cx - 1, py + T - 7, 2, 4);
      ctx.fillRect(cx - 5, py + T - 4, 10, 2);
      break;
    }
    case "coffee": {
      ctx.fillStyle = "#5D4037";
      ctx.fillRect(px + 5, py + 3, T - 10, T - 5);
      ctx.fillStyle = "#4E342E";
      ctx.fillRect(px + 5, py + 3, T - 10, 3);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(cx - 2, py + T - 6, 4, 4);
      ctx.fillStyle = "#795548";
      ctx.fillRect(cx - 1, py + T - 5, 2, 2);
      // Static steam (no Date.now() - animated in main loop via slight bob)
      ctx.strokeStyle = "rgba(200,200,200,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, py + T - 7);
      ctx.quadraticCurveTo(cx - 2, py + T - 12, cx + 1, py + T - 16);
      ctx.stroke();
      break;
    }
    case "vending": {
      ctx.fillStyle = "#37474F";
      ctx.fillRect(px + 3, py + 0, T - 6, T);
      ctx.fillStyle = "#263238";
      ctx.fillRect(px + 5, py + 2, T - 10, T * 0.45);
      const colors = ["#F44336", "#4CAF50", "#FF9800", "#2196F3"];
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.fillStyle = colors[(row * 3 + col) % colors.length];
          ctx.fillRect(px + 6 + col * 6, py + 3 + row * 6, 4, 5);
        }
      }
      ctx.fillStyle = "#0D1117";
      ctx.fillRect(cx - 3, py + T - 7, 6, 4);
      ctx.fillStyle = "#FFC107";
      ctx.beginPath(); ctx.arc(px + T - 8, py + T - 10, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "table": {
      ctx.fillStyle = "#8D6E63";
      ctx.fillRect(px + 3, py + 5, T - 6, T - 8);
      ctx.fillStyle = "#A1887F";
      ctx.fillRect(px + 3, py + 5, T - 6, 3);
      ctx.fillStyle = "#6D4C41";
      ctx.fillRect(px + 5, py + T - 4, 2, 3);
      ctx.fillRect(px + T - 7, py + T - 4, 2, 3);
      break;
    }
    case "monitor": {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(px + 3, py + 2, T - 6, T - 9);
      ctx.fillStyle = "#4FC3F7";
      ctx.fillRect(px + 4, py + 3, T - 8, T - 11);
      ctx.fillStyle = "#37474F";
      ctx.fillRect(cx - 1, py + T - 7, 2, 4);
      ctx.fillRect(cx - 4, py + T - 4, 8, 2);
      break;
    }
    case "printer": {
      ctx.fillStyle = "#ECEFF1";
      ctx.fillRect(px + 4, py + 6, T - 8, T - 9);
      ctx.fillStyle = "#B0BEC5";
      ctx.fillRect(px + 4, py + 4, T - 8, 4);
      ctx.fillStyle = "#FFF";
      ctx.fillRect(px + 7, py + T - 5, T - 14, 2);
      break;
    }
    case "water": {
      ctx.fillStyle = "#B3E5FC";
      ctx.fillRect(cx - 4, cy - 4, 8, 12);
      ctx.fillStyle = "#81D4FA";
      ctx.fillRect(cx - 5, cy - 6, 10, 4);
      ctx.fillStyle = "#4FC3F7";
      ctx.fillRect(cx - 3, cy - 2, 6, 4);
      break;
    }
    case "trash": {
      ctx.fillStyle = "#78909C";
      ctx.fillRect(cx - 4, cy - 2, 8, 10);
      ctx.fillStyle = "#90A4AE";
      ctx.fillRect(cx - 5, cy - 3, 10, 3);
      break;
    }
    case "door": {
      ctx.fillStyle = "#6D4C41";
      ctx.fillRect(px + 8, py + 0, T - 16, T);
      ctx.fillStyle = "#8D6E63";
      ctx.fillRect(px + 9, py + 1, T - 18, T - 2);
      ctx.fillStyle = "#FFC107";
      ctx.beginPath(); ctx.arc(px + T - 10, cy + 2, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "stairs_up":
    case "stairs_down": {
      ctx.fillStyle = "#90A4AE";
      for (let s = 0; s < 4; s++) {
        ctx.fillStyle = s % 2 === 0 ? "#78909C" : "#90A4AE";
        ctx.fillRect(px + 2, py + s * (T / 4), T - 4, T / 4);
      }
      ctx.fillStyle = "#546E7A";
      ctx.fillRect(px + 2, py, 2, T);
      ctx.fillRect(px + T - 4, py, 2, T);
      ctx.fillStyle = "#FFF";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(type === "stairs_up" ? "↑" : "↓", cx, cy + 5);
      break;
    }
    case "divider": {
      ctx.fillStyle = "#78909C";
      ctx.fillRect(px + 12, py, 8, T);
      ctx.fillStyle = "#90A4AE";
      ctx.fillRect(px + 13, py + 1, 6, T - 2);
      break;
    }
    case "window": {
      ctx.fillStyle = "#B3E5FC";
      ctx.fillRect(px + 4, py + 2, T - 8, T - 4);
      ctx.strokeStyle = "#90A4AE";
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 4, py + 2, T - 8, T - 4);
      ctx.beginPath();
      ctx.moveTo(cx, py + 2);
      ctx.lineTo(cx, py + T - 2);
      ctx.moveTo(px + 4, cy);
      ctx.lineTo(px + T - 4, cy);
      ctx.stroke();
      break;
    }
    case "laptop": {
      ctx.fillStyle = "#455A64";
      ctx.fillRect(px + 5, py + 4, T - 10, T - 10);
      ctx.fillStyle = "#4FC3F7";
      ctx.fillRect(px + 6, py + 5, T - 12, T - 13);
      ctx.fillStyle = "#37474F";
      ctx.fillRect(px + 3, py + T - 6, T - 6, 4);
      break;
    }
    case "phone": {
      ctx.fillStyle = "#263238";
      ctx.fillRect(cx - 4, cy - 2, 8, 8);
      ctx.fillStyle = "#455A64";
      ctx.fillRect(cx - 3, cy - 1, 6, 6);
      ctx.fillStyle = "#4FC3F7";
      ctx.fillRect(cx - 2, cy, 4, 2);
      break;
    }
    case "beanbag": {
      ctx.fillStyle = "#E91E63";
      ctx.beginPath(); ctx.ellipse(cx, cy + 2, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#F06292";
      ctx.beginPath(); ctx.ellipse(cx, cy - 2, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "rug": {
      ctx.fillStyle = "rgba(156, 39, 176, 0.3)";
      ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
      ctx.strokeStyle = "rgba(156, 39, 176, 0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 4, py + 4, T - 8, T - 8);
      break;
    }
    case "painting": {
      ctx.fillStyle = "#5D4037";
      ctx.fillRect(px + 4, py + 2, T - 8, T - 6);
      ctx.fillStyle = "#81D4FA";
      ctx.fillRect(px + 5, py + 3, T - 10, T - 8);
      ctx.fillStyle = "#4CAF50";
      ctx.fillRect(px + 5, py + T - 8, T - 10, 3);
      ctx.fillStyle = "#FFC107";
      ctx.beginPath(); ctx.arc(px + T - 10, py + 6, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "lamp": {
      ctx.fillStyle = "#455A64";
      ctx.fillRect(cx - 1, cy, 2, T / 2);
      ctx.fillStyle = "#FFC107";
      ctx.beginPath(); ctx.arc(cx, cy - 2, 6, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "rgba(255,193,7,0.15)";
      ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#37474F";
      ctx.fillRect(cx - 4, py + T - 3, 8, 2);
      break;
    }
    case "clock": {
      ctx.fillStyle = "#FFF";
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 4, cy); ctx.stroke();
      break;
    }
    case "trophy": {
      ctx.fillStyle = "#FFC107";
      ctx.fillRect(cx - 3, cy - 4, 6, 8);
      ctx.beginPath(); ctx.arc(cx, cy - 4, 5, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "#F57F17";
      ctx.fillRect(cx - 1, cy + 4, 2, 3);
      ctx.fillStyle = "#795548";
      ctx.fillRect(cx - 4, cy + 7, 8, 2);
      break;
    }
    case "microwave": {
      ctx.fillStyle = "#546E7A";
      ctx.fillRect(px + 4, py + 6, T - 8, T - 10);
      ctx.fillStyle = "#263238";
      ctx.fillRect(px + 5, py + 7, T - 14, T - 12);
      ctx.fillStyle = "#37474F";
      ctx.fillRect(px + T - 9, py + 8, 3, T - 14);
      break;
    }
    case "fridge": {
      ctx.fillStyle = "#CFD8DC";
      ctx.fillRect(px + 4, py + 0, T - 8, T);
      ctx.fillStyle = "#B0BEC5";
      ctx.fillRect(px + 5, py + 1, T - 10, T / 3);
      ctx.fillStyle = "#B0BEC5";
      ctx.fillRect(px + 5, py + T / 3 + 2, T - 10, T - T / 3 - 3);
      ctx.fillStyle = "#90A4AE";
      ctx.fillRect(px + T - 8, py + 4, 1, 4);
      ctx.fillRect(px + T - 8, py + T / 3 + 5, 1, 6);
      break;
    }
    case "arcade": {
      ctx.fillStyle = "#1A237E";
      ctx.fillRect(px + 4, py + 0, T - 8, T);
      ctx.fillStyle = "#0D47A1";
      ctx.fillRect(px + 6, py + 2, T - 12, T / 3);
      ctx.fillStyle = "#E91E63";
      ctx.fillRect(px + 7, py + 3, T - 14, T / 3 - 2);
      ctx.fillStyle = "#FFC107";
      ctx.beginPath(); ctx.arc(cx - 3, cy + 4, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#4CAF50";
      ctx.beginPath(); ctx.arc(cx + 3, cy + 4, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "foosball": {
      ctx.fillStyle = "#5D4037";
      ctx.fillRect(px + 2, py + 4, T - 4, T - 6);
      ctx.fillStyle = "#4CAF50";
      ctx.fillRect(px + 3, py + 5, T - 6, T - 8);
      ctx.fillStyle = "#8D6E63";
      ctx.fillRect(px + 2, cy, T - 4, 1);
      break;
    }
    case "pingpong": {
      ctx.fillStyle = "#1B5E20";
      ctx.fillRect(px + 1, py + 3, T - 2, T - 5);
      ctx.strokeStyle = "#FFF";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, py + 3); ctx.lineTo(cx, py + T - 2); ctx.stroke();
      ctx.fillStyle = "#455A64";
      ctx.fillRect(cx - 1, py + 3, 2, T - 5);
      break;
    }
    case "dartboard": {
      ctx.fillStyle = "#5D4037";
      ctx.fillRect(px + 6, py + 2, T - 12, T - 4);
      ctx.fillStyle = "#C62828";
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#FFF";
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#C62828";
      ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = "#78909C";
      ctx.fillRect(px + 4, py + 4, T - 8, T - 8);
      break;
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
    ctx.fillStyle = color;
    ctx.fillRect(cx - 7, baseY - 16, 14, 14);
    ctx.fillStyle = shade(color, -20);
    ctx.fillRect(cx - 7, baseY - 6, 14, 4);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(cx - 6, baseY - 8, 12, 2);
    ctx.fillStyle = shade(color, 12);
    ctx.fillRect(cx - 6, baseY - 26, 12, 11);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(cx - 5, baseY - 24, 10, 7);
    const eyeColor = status === "thinking" ? "#6366F1" : "#00FF88";
    ctx.fillStyle = eyeColor;
    ctx.fillRect(cx - 4, baseY - 22, 3, 3);
    ctx.fillRect(cx + 1, baseY - 22, 3, 3);
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
    ctx.fillStyle = statusCol + "40";
    ctx.beginPath();
    ctx.arc(cx, baseY - 33, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(color, -30);
    ctx.fillRect(cx - 6, baseY - 2, 4, 3);
    ctx.fillRect(cx + 2, baseY - 2, 4, 3);
    ctx.fillStyle = shade(color, -10);
    ctx.fillRect(cx - 10, baseY - 14, 3, 8);
    ctx.fillRect(cx + 7, baseY - 14, 3, 8);
  } else {
    ctx.fillStyle = "#2D3748";
    ctx.fillRect(cx - 4, baseY - 6, 3, 7);
    ctx.fillRect(cx + 1, baseY - 6, 3, 7);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(cx - 5, baseY, 4, 2);
    ctx.fillRect(cx + 1, baseY, 4, 2);
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
    ctx.fillStyle = outfitStyle === "tech" ? "#1a1a2e" : color;
    ctx.fillRect(cx - 10, baseY - 16, 3, 8);
    ctx.fillRect(cx + 7, baseY - 16, 3, 8);
    ctx.fillStyle = skin;
    ctx.fillRect(cx - 10, baseY - 8, 3, 3);
    ctx.fillRect(cx + 7, baseY - 8, 3, 3);
    ctx.fillStyle = skin;
    ctx.fillRect(cx - 6, baseY - 30, 12, 13);
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
    ctx.fillStyle = "#FFF";
    ctx.fillRect(cx - 4, baseY - 26, 3, 3);
    ctx.fillRect(cx + 1, baseY - 26, 3, 3);
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(cx - 3, baseY - 25, 2, 2);
    ctx.fillRect(cx + 2, baseY - 25, 2, 2);
    ctx.fillStyle = shade(skin, -30);
    ctx.fillRect(cx - 2, baseY - 21, 4, 1);
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

  // Store latest props in refs so draw() doesn't need them as deps
  const agentsRef = useRef(agents);
  const playerRef = useRef(player);
  const playerConfigRef = useRef(playerConfig);
  const selectedAgentIdRef = useRef(selectedAgentId);
  agentsRef.current = agents;
  playerRef.current = player;
  playerConfigRef.current = playerConfig;
  selectedAgentIdRef.current = selectedAgentId;

  // Cached minimap canvas - rebuilt when map changes (rarely)
  const minimapRef = useRef<HTMLCanvasElement | null>(null);
  const buildMinimap = useCallback(() => {
    const mmW = 120;
    const mmH = Math.round((MAP_ROWS / MAP_COLS) * mmW);
    const offscreen = document.createElement("canvas");
    offscreen.width = mmW;
    offscreen.height = mmH;
    const mCtx = offscreen.getContext("2d");
    if (!mCtx) return null;
    const sx2 = mmW / MAP_COLS;
    const sy2 = mmH / MAP_ROWS;
    for (let y = 0; y < MAP_ROWS; y++) {
      for (let x = 0; x < MAP_COLS; x++) {
        const tile = TILE_MAP[y]?.[x] ?? 4;
        if (tile === 4) continue;
        mCtx.fillStyle = tile === 1 ? "#64748B" : tile === 2 ? "#B0B8C8" : tile === 3 ? "#A08060" : "#D0D4DC";
        mCtx.fillRect(x * sx2, y * sy2, sx2 + 0.5, sy2 + 0.5);
      }
    }
    return offscreen;
  }, []);

  // Stable draw function with no reactive deps (reads from refs)
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentAgents = agentsRef.current;
    const currentPlayer = playerRef.current;
    const currentPlayerConfig = playerConfigRef.current;
    const currentSelectedId = selectedAgentIdRef.current;

    const dpr = window.devicePixelRatio || 1;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    // Smooth camera
    let pSmooth = smoothPos.current.get("player");
    if (!pSmooth) {
      pSmooth = { x: currentPlayer.x * T, y: currentPlayer.y * T };
      smoothPos.current.set("player", pSmooth);
    }
    pSmooth.x += (currentPlayer.x * T - pSmooth.x) * 0.15;
    pSmooth.y += (currentPlayer.y * T - pSmooth.y) * 0.15;

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
      // Only draw if visible
      if (rx < camX - 100 || rx > camX + cw + 100 || ry < camY - 30 || ry > camY + ch + 30) continue;
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
    for (const agent of currentAgents) {
      // Cull off-screen agents
      const approxX = agent.x * T;
      const approxY = agent.y * T;
      if (approxX < camX - T * 2 || approxX > camX + cw + T * 2 || approxY < camY - T * 2 || approxY > camY + ch + T * 2) continue;

      let s = smoothPos.current.get(agent.id);
      if (!s) {
        s = { x: approxX, y: approxY };
        smoothPos.current.set(agent.id, s);
      }
      s.x += (approxX - s.x) * 0.12;
      s.y += (approxY - s.y) * 0.12;

      const bob = Math.sin(now * 0.003 + parseInt(agent.id.slice(-1)) * 1.3) * 1.5;
      drawCharacter(ctx, s.x, s.y, bob, agent.color, true, 0, undefined, undefined, undefined, agent.status);

      if (agent.status === "thinking") {
        const pulse = Math.sin(now * 0.005) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(99,102,241,${pulse * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(s.x + T / 2, s.y + T / 2 + bob, 14 + pulse * 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (agent.id === currentSelectedId) {
        ctx.strokeStyle = "#6366F1";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.lineDashOffset = -now * 0.02;
        ctx.beginPath();
        ctx.arc(s.x + T / 2, s.y + T / 2 + bob, 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Name badge
      const ax = s.x + T / 2;
      const ay = s.y + bob;
      ctx.font = "bold 9px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      const nw = ctx.measureText(agent.name).width + 16;
      const tagY = ay - 38;
      ctx.fillStyle = "rgba(20,20,30,0.88)";
      ctx.beginPath();
      ctx.roundRect(ax - nw / 2, tagY, nw, 16, 8);
      ctx.fill();
      ctx.fillStyle = STATUS_COLORS[agent.status];
      ctx.beginPath();
      ctx.arc(ax - nw / 2 + 7, tagY + 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#F0F0F0";
      ctx.fillText(agent.name, ax + 4, tagY + 11);
    }

    // ── PLAYER ──
    {
      const bob = Math.sin(now * 0.004) * 1;
      drawCharacter(
        ctx, pSmooth.x, pSmooth.y, bob,
        currentPlayerConfig?.color || "#4F46E5", false, 0,
        currentPlayerConfig?.skinTone, currentPlayerConfig?.hairStyle, currentPlayerConfig?.outfitStyle,
        undefined, currentPlayerConfig?.accessory,
      );
      const px2 = pSmooth.x + T / 2;
      const py2 = pSmooth.y + bob;
      ctx.font = "bold 9px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      const tw = ctx.measureText(currentPlayer.name).width + 14;
      const tagY = py2 - 44;
      const pColor = currentPlayerConfig?.color || "#4F46E5";
      ctx.fillStyle = pColor;
      ctx.beginPath();
      ctx.roundRect(px2 - tw / 2, tagY, tw, 16, 8);
      ctx.fill();
      ctx.fillStyle = "#10B981";
      ctx.beginPath();
      ctx.arc(px2 - tw / 2 + 7, tagY + 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(currentPlayer.name, px2 + 4, tagY + 11);
    }

    // ── MINIMAP (cached background + dynamic dots) ──
    {
      if (!minimapRef.current) {
        minimapRef.current = buildMinimap();
      }
      const mmCanvas = minimapRef.current;
      if (mmCanvas) {
        const mmW = mmCanvas.width;
        const mmH = mmCanvas.height;
        const mmX = camX + cw - mmW - 12;
        const mmY = camY + ch - mmH - 12;
        const sx2 = mmW / MAP_COLS;
        const sy2 = mmH / MAP_ROWS;

        ctx.fillStyle = "rgba(15,23,42,0.8)";
        ctx.beginPath();
        ctx.roundRect(mmX - 4, mmY - 4, mmW + 8, mmH + 8, 6);
        ctx.fill();

        ctx.drawImage(mmCanvas, mmX, mmY);

        // Agent dots
        for (const a of currentAgents) {
          ctx.fillStyle = a.color;
          ctx.beginPath();
          ctx.arc(mmX + a.x * sx2, mmY + a.y * sy2, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        // Player dot
        ctx.fillStyle = "#FFF";
        ctx.beginPath();
        ctx.arc(mmX + currentPlayer.x * sx2, mmY + currentPlayer.y * sy2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
    animRef.current = requestAnimationFrame(draw);
  }, [buildMinimap]);

  // Single RAF loop - never restarts on state changes
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
      const currentPlayer = playerRef.current;
      const currentAgents = agentsRef.current;

      const pSmooth2 = smoothPos.current.get("player");
      const camX = (pSmooth2?.x ?? currentPlayer.x * T) - cw / 2 + T / 2;
      const camY = (pSmooth2?.y ?? currentPlayer.y * T) - ch / 2 + T / 2;

      const wx = e.clientX - rect.left + camX;
      const wy = e.clientY - rect.top + camY;
      const tx = Math.floor(wx / T);
      const ty = Math.floor(wy / T);

      const clicked = currentAgents.find(a => Math.abs(a.x - tx) <= 1 && Math.abs(a.y - ty) <= 1);
      if (clicked) onAgentClick(clicked);
    },
    [onAgentClick]
  );

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden cursor-default">
      <canvas ref={canvasRef} onClick={handleClick} className="block" />
    </div>
  );
});
