import { useRef, useEffect, useCallback, memo } from "react";
import type { Agent, Player } from "@/types/agent";
import { TILE_MAP, TILE_SIZE, MAP_COLS, MAP_ROWS, FURNITURE, ROOMS } from "@/data/officeMap";

interface OfficeCanvasProps {
  agents: Agent[];
  player: Player;
  playerConfig?: { color: string; hairStyle: string; outfitStyle: string; skinTone?: string; accessory?: string };
  selectedAgentId?: string;
  onAgentClick: (agent: Agent) => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#10B981",
  idle: "#F59E0B",
  thinking: "#6366F1",
  busy: "#EF4444",
};

const SKIN_TONES: Record<string, string> = {
  light: "#FDDCB5",
  medium: "#E8B88A",
  tan: "#C8956C",
  dark: "#8D5B3E",
  default: "#FBBF8B",
};

const HAIR_COLORS: Record<string, string> = {
  spiky: "#1E1B4B",
  flat: "#4A3728",
  mohawk: "#C62828",
  curly: "#1B5E20",
  none: "transparent",
};

// Pixel art helper: draw a pixelated rectangle
function pixRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Draw detailed pixel art tile
function drawTile(ctx: CanvasRenderingContext2D, x: number, y: number, tile: number, px: number, py: number) {
  const T = TILE_SIZE;

  if (tile === 0) {
    // Wooden floor with planks
    pixRect(ctx, px, py, T, T, "#E8DCC8");
    // Plank lines
    ctx.strokeStyle = "rgba(160,140,110,0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const ly = py + (T / 3) * i;
      ctx.beginPath();
      ctx.moveTo(px, ly);
      ctx.lineTo(px + T, ly);
      ctx.stroke();
    }
    // Wood grain dots
    if ((x + y) % 2 === 0) {
      pixRect(ctx, px + 6, py + 8, 2, 1, "rgba(140,120,90,0.2)");
      pixRect(ctx, px + 20, py + 24, 3, 1, "rgba(140,120,90,0.15)");
    }
    // Subtle grid
    ctx.strokeStyle = "rgba(0,0,0,0.04)";
    ctx.strokeRect(px, py, T, T);
  } else if (tile === 1) {
    // Detailed wall with brick pattern
    pixRect(ctx, px, py, T, T, "#7C8CA0");
    // Brick rows
    for (let row = 0; row < 4; row++) {
      const by = py + row * (T / 4);
      const bh = T / 4;
      ctx.strokeStyle = "rgba(60,70,85,0.4)";
      ctx.lineWidth = 1;
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(px, by);
      ctx.lineTo(px + T, by);
      ctx.stroke();
      // Vertical offsets (brick pattern)
      const offset = row % 2 === 0 ? 0 : T / 2;
      ctx.beginPath();
      ctx.moveTo(px + offset + T / 2, by);
      ctx.lineTo(px + offset + T / 2, by + bh);
      ctx.stroke();
    }
    // Top highlight
    pixRect(ctx, px, py, T, 2, "rgba(255,255,255,0.12)");
    // Bottom shadow
    pixRect(ctx, px, py + T - 3, T, 3, "rgba(0,0,0,0.2)");
  } else if (tile === 2) {
    // Carpet with pattern
    pixRect(ctx, px, py, T, T, "#B0BED8");
    // Diamond pattern
    if ((x + y) % 2 === 0) {
      ctx.fillStyle = "rgba(140,160,200,0.4)";
      ctx.beginPath();
      ctx.moveTo(px + T / 2, py + 4);
      ctx.lineTo(px + T - 4, py + T / 2);
      ctx.lineTo(px + T / 2, py + T - 4);
      ctx.lineTo(px + 4, py + T / 2);
      ctx.closePath();
      ctx.fill();
    }
    // Border stitch
    ctx.strokeStyle = "rgba(80,100,140,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
  } else if (tile === 3) {
    // Furniture floor (under objects)
    pixRect(ctx, px, py, T, T, "#D4C4A8");
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.strokeRect(px, py, T, T);
  } else {
    // Outside / grass with detail
    pixRect(ctx, px, py, T, T, "#A8C89A");
    // Grass blades
    if ((x * 7 + y * 13) % 5 === 0) {
      ctx.fillStyle = "rgba(80,140,60,0.3)";
      ctx.fillRect(px + 8, py + 12, 2, 6);
      ctx.fillRect(px + 10, py + 10, 2, 8);
      ctx.fillRect(px + 6, py + 14, 2, 4);
    }
    if ((x * 3 + y * 11) % 7 === 0) {
      ctx.fillStyle = "rgba(200,220,80,0.2)";
      ctx.beginPath();
      ctx.arc(px + 25, py + 20, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Dirt patches
    if ((x + y * 5) % 11 === 0) {
      ctx.fillStyle = "rgba(160,140,100,0.15)";
      ctx.beginPath();
      ctx.arc(px + 15, py + 30, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Draw a pixel art character
function drawPixelCharacter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  bob: number,
  color: string,
  skinTone: string,
  hairStyle: string,
  outfitStyle: string,
  isAgent: boolean,
  status?: string,
  accessory?: string,
) {
  const T = TILE_SIZE;
  const bw = T * 0.55;
  const bh = T * 0.7;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + T * 0.32, T * 0.22, T * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();

  const baseY = cy - bh / 2 + bob;

  if (isAgent) {
    // === ROBOT AGENT ===
    // Body
    pixRect(ctx, cx - bw / 2, baseY + 4, bw, bh * 0.6, color);
    // Darker bottom
    pixRect(ctx, cx - bw / 2, baseY + bh * 0.4, bw, bh * 0.24, shadeColor(color, -20));
    // Belt/detail line
    pixRect(ctx, cx - bw / 2 + 2, baseY + bh * 0.35, bw - 4, 2, "rgba(255,255,255,0.3)");

    // Head (robot)
    const headW = bw * 0.85;
    const headH = bh * 0.4;
    pixRect(ctx, cx - headW / 2, baseY - headH + 6, headW, headH, shadeColor(color, 15));
    // Visor
    pixRect(ctx, cx - headW / 2 + 3, baseY - headH + 12, headW - 6, headH * 0.35, "#1a1a2e");
    // Eyes (LED style)
    pixRect(ctx, cx - 5, baseY - headH + 15, 4, 3, "#FFFFFF");
    pixRect(ctx, cx + 2, baseY - headH + 15, 4, 3, "#FFFFFF");
    // Pupils
    pixRect(ctx, cx - 4, baseY - headH + 16, 2, 2, status === "thinking" ? "#6366F1" : "#00FF88");
    pixRect(ctx, cx + 3, baseY - headH + 16, 2, 2, status === "thinking" ? "#6366F1" : "#00FF88");

    // Antenna
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, baseY - headH + 6);
    ctx.lineTo(cx, baseY - headH - 4);
    ctx.stroke();
    // Antenna LED
    const statusCol = STATUS_COLORS[status || "idle"];
    ctx.fillStyle = statusCol;
    ctx.beginPath();
    ctx.arc(cx, baseY - headH - 6, 3, 0, Math.PI * 2);
    ctx.fill();
    // LED glow
    ctx.fillStyle = statusCol + "40";
    ctx.beginPath();
    ctx.arc(cx, baseY - headH - 6, 6, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    pixRect(ctx, cx - bw / 2 + 2, baseY + bh * 0.6, bw * 0.3, 4, shadeColor(color, -30));
    pixRect(ctx, cx + bw / 2 - bw * 0.3 - 2, baseY + bh * 0.6, bw * 0.3, 4, shadeColor(color, -30));
  } else {
    // === HUMAN PLAYER ===
    const skin = SKIN_TONES[skinTone] || SKIN_TONES.default;
    const hairColor = HAIR_COLORS[hairStyle] || "#1E1B4B";

    // Legs
    pixRect(ctx, cx - 5, baseY + bh * 0.55, 4, bh * 0.15, "#2D3748");
    pixRect(ctx, cx + 1, baseY + bh * 0.55, 4, bh * 0.15, "#2D3748");
    // Shoes
    pixRect(ctx, cx - 6, baseY + bh * 0.68, 5, 3, "#1a1a2e");
    pixRect(ctx, cx + 1, baseY + bh * 0.68, 5, 3, "#1a1a2e");

    // Body / Outfit
    if (outfitStyle === "suit") {
      pixRect(ctx, cx - bw / 2, baseY + 6, bw, bh * 0.5, color);
      // Tie
      pixRect(ctx, cx - 1, baseY + 8, 2, bh * 0.25, "#DC2626");
      // Lapels
      pixRect(ctx, cx - bw / 2 + 2, baseY + 6, 3, bh * 0.15, shadeColor(color, -15));
      pixRect(ctx, cx + bw / 2 - 5, baseY + 6, 3, bh * 0.15, shadeColor(color, -15));
      // Collar
      pixRect(ctx, cx - 6, baseY + 4, 12, 3, "#FFFFFF");
    } else if (outfitStyle === "casual") {
      pixRect(ctx, cx - bw / 2, baseY + 6, bw, bh * 0.5, color);
      // T-shirt neck
      pixRect(ctx, cx - 4, baseY + 4, 8, 4, shadeColor(color, 10));
      // Stripe
      pixRect(ctx, cx - bw / 2 + 2, baseY + 18, bw - 4, 2, "rgba(255,255,255,0.3)");
    } else if (outfitStyle === "tech") {
      pixRect(ctx, cx - bw / 2, baseY + 6, bw, bh * 0.5, "#1a1a2e");
      // Hoodie detail
      pixRect(ctx, cx - 4, baseY + 4, 8, 5, "#2D3748");
      // Pocket
      pixRect(ctx, cx - 4, baseY + 22, 8, 4, "#2D3748");
      // Logo dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, baseY + 15, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Lab coat
      pixRect(ctx, cx - bw / 2 - 1, baseY + 4, bw + 2, bh * 0.55, "#F0F0F0");
      // Inner shirt
      pixRect(ctx, cx - 4, baseY + 6, 8, bh * 0.2, color);
      // Pockets
      pixRect(ctx, cx - bw / 2 + 1, baseY + 20, 5, 4, "#E0E0E0");
      pixRect(ctx, cx + bw / 2 - 6, baseY + 20, 5, 4, "#E0E0E0");
    }

    // Head
    const headW = bw * 0.8;
    const headH = bh * 0.32;
    pixRect(ctx, cx - headW / 2, baseY - headH + 8, headW, headH, skin);

    // Hair
    if (hairStyle === "spiky") {
      ctx.fillStyle = hairColor;
      ctx.beginPath();
      ctx.moveTo(cx - headW / 2 - 1, baseY - headH + 12);
      ctx.lineTo(cx - 4, baseY - headH - 2);
      ctx.lineTo(cx, baseY - headH + 4);
      ctx.lineTo(cx + 4, baseY - headH - 4);
      ctx.lineTo(cx + headW / 2 + 1, baseY - headH + 12);
      ctx.closePath();
      ctx.fill();
    } else if (hairStyle === "flat") {
      pixRect(ctx, cx - headW / 2 - 1, baseY - headH + 2, headW + 2, headH * 0.5, hairColor);
    } else if (hairStyle === "mohawk") {
      pixRect(ctx, cx - 3, baseY - headH - 4, 6, headH * 0.7, hairColor);
    } else if (hairStyle === "curly") {
      ctx.fillStyle = hairColor;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(cx + i * 4, baseY - headH + 6, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Eyes
    pixRect(ctx, cx - 5, baseY - headH + 16, 3, 3, "#FFFFFF");
    pixRect(ctx, cx + 2, baseY - headH + 16, 3, 3, "#FFFFFF");
    pixRect(ctx, cx - 4, baseY - headH + 17, 2, 2, "#1a1a2e");
    pixRect(ctx, cx + 3, baseY - headH + 17, 2, 2, "#1a1a2e");
    // Mouth
    pixRect(ctx, cx - 2, baseY - headH + 22, 4, 1, shadeColor(skin, -30));

    // Accessory
    if (accessory === "glasses") {
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 7, baseY - headH + 15, 6, 5);
      ctx.strokeRect(cx + 1, baseY - headH + 15, 6, 5);
      ctx.beginPath();
      ctx.moveTo(cx - 1, baseY - headH + 17);
      ctx.lineTo(cx + 1, baseY - headH + 17);
      ctx.stroke();
    } else if (accessory === "headphones") {
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, baseY - headH + 8, headW / 2 + 2, Math.PI, 0);
      ctx.stroke();
      pixRect(ctx, cx - headW / 2 - 3, baseY - headH + 10, 4, 6, "#333");
      pixRect(ctx, cx + headW / 2 - 1, baseY - headH + 10, 4, 6, "#333");
    }

    // Crown for boss
    ctx.font = "11px serif";
    ctx.textAlign = "center";
    ctx.fillText("👑", cx, baseY - headH - 2);
  }
}

// Shade a hex color
function shadeColor(color: string, amount: number): string {
  let r = parseInt(color.slice(1, 3), 16) + amount;
  let g = parseInt(color.slice(3, 5), 16) + amount;
  let b = parseInt(color.slice(5, 7), 16) + amount;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}

// Draw detailed furniture
function drawFurnitureItem(ctx: CanvasRenderingContext2D, f: { type: string; emoji: string }, fx: number, fy: number) {
  const T = TILE_SIZE;
  const cx = fx + T / 2;
  const cy = fy + T / 2;

  if (f.type === "desk") {
    // Wooden desk
    pixRect(ctx, fx + 4, fy + 10, T - 8, T - 18, "#8B7355");
    pixRect(ctx, fx + 4, fy + 10, T - 8, 3, "#A08060");
    // Monitor on desk
    pixRect(ctx, cx - 6, fy + 4, 12, 8, "#2D3748");
    pixRect(ctx, cx - 5, fy + 5, 10, 6, "#4FC3F7");
    pixRect(ctx, cx - 1, fy + 12, 2, 3, "#555");
    // Legs
    pixRect(ctx, fx + 6, fy + T - 8, 2, 6, "#6B5B45");
    pixRect(ctx, fx + T - 8, fy + T - 8, 2, 6, "#6B5B45");
  } else if (f.type === "chair") {
    pixRect(ctx, cx - 5, cy - 2, 10, 8, "#5D4037");
    pixRect(ctx, cx - 6, cy - 8, 12, 7, "#795548");
    pixRect(ctx, cx - 1, cy + 6, 2, 4, "#444");
  } else if (f.type === "server") {
    pixRect(ctx, fx + 6, fy + 2, T - 12, T - 4, "#37474F");
    // LED lights
    for (let i = 0; i < 4; i++) {
      const ledColor = Math.random() > 0.5 ? "#4CAF50" : "#F44336";
      pixRect(ctx, fx + 10, fy + 6 + i * 6, 3, 2, ledColor);
    }
    // Vents
    for (let i = 0; i < 3; i++) {
      pixRect(ctx, fx + 16, fy + 8 + i * 5, 8, 1, "#263238");
    }
  } else if (f.type === "sofa") {
    pixRect(ctx, fx + 2, fy + 8, T - 4, T - 12, "#7B68AE");
    pixRect(ctx, fx + 2, fy + 6, T - 4, 4, "#9182C4");
    // Cushions
    pixRect(ctx, fx + 4, fy + 10, (T - 8) / 2 - 1, T - 16, "#8878B8");
    pixRect(ctx, cx + 1, fy + 10, (T - 8) / 2 - 1, T - 16, "#8878B8");
  } else if (f.type === "bookshelf") {
    pixRect(ctx, fx + 4, fy + 2, T - 8, T - 4, "#5D4037");
    // Shelves
    for (let i = 0; i < 3; i++) {
      pixRect(ctx, fx + 4, fy + 6 + i * 10, T - 8, 2, "#4E342E");
      // Books
      const colors = ["#E53935", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA"];
      for (let b = 0; b < 4; b++) {
        pixRect(ctx, fx + 6 + b * 6, fy + 8 + i * 10, 4, 7, colors[(i + b) % 5]);
      }
    }
  } else if (f.type === "plant") {
    // Pot
    pixRect(ctx, cx - 5, cy + 2, 10, 8, "#A1887F");
    pixRect(ctx, cx - 6, cy + 2, 12, 3, "#8D6E63");
    // Leaves
    ctx.fillStyle = "#4CAF50";
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#66BB6A";
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 4, cy - 6, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (f.type === "whiteboard" || f.type === "screen") {
    pixRect(ctx, fx + 4, fy + 2, T - 8, T - 10, "#ECEFF1");
    pixRect(ctx, fx + 4, fy + 2, T - 8, 2, "#B0BEC5");
    if (f.type === "screen") {
      pixRect(ctx, fx + 6, fy + 5, T - 12, T - 14, "#1565C0");
      // Screen content lines
      for (let i = 0; i < 3; i++) {
        pixRect(ctx, fx + 8, fy + 8 + i * 5, T - 16, 2, "rgba(255,255,255,0.3)");
      }
    } else {
      // Whiteboard lines
      for (let i = 0; i < 3; i++) {
        pixRect(ctx, fx + 8, fy + 8 + i * 6, T - 16, 1, "rgba(0,0,0,0.1)");
      }
    }
    // Stand
    pixRect(ctx, cx - 1, fy + T - 8, 2, 6, "#78909C");
  } else if (f.type === "coffee") {
    pixRect(ctx, cx - 6, cy, 12, 8, "#5D4037");
    // Coffee cup
    pixRect(ctx, cx - 3, cy - 5, 6, 6, "#FFF");
    pixRect(ctx, cx - 2, cy - 4, 4, 4, "#6D4C41");
    // Steam
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 1, cy - 7);
    ctx.quadraticCurveTo(cx - 3, cy - 11, cx, cy - 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 1, cy - 7);
    ctx.quadraticCurveTo(cx + 3, cy - 11, cx, cy - 14);
    ctx.stroke();
  } else if (f.type === "vending") {
    pixRect(ctx, fx + 4, fy + 2, T - 8, T - 4, "#455A64");
    pixRect(ctx, fx + 6, fy + 4, T - 12, T * 0.4, "#263238");
    // Items display
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        pixRect(ctx, fx + 8 + j * 8, fy + 6 + i * 6, 5, 4, ["#F44336", "#4CAF50", "#FF9800", "#2196F3"][(i * 2 + j)]);
      }
    }
  } else if (f.type === "table") {
    pixRect(ctx, fx + 4, fy + 8, T - 8, T - 14, "#8D6E63");
    pixRect(ctx, fx + 4, fy + 8, T - 8, 3, "#A1887F");
    pixRect(ctx, fx + 8, fy + T - 6, 2, 5, "#6D4C41");
    pixRect(ctx, fx + T - 10, fy + T - 6, 2, 5, "#6D4C41");
  } else if (f.type === "monitor") {
    pixRect(ctx, fx + 6, fy + 4, T - 12, T - 14, "#263238");
    pixRect(ctx, fx + 8, fy + 6, T - 16, T - 18, "#4FC3F7");
    pixRect(ctx, cx - 2, fy + T - 10, 4, 6, "#37474F");
    pixRect(ctx, cx - 4, fy + T - 5, 8, 2, "#546E7A");
  } else if (f.type === "water") {
    pixRect(ctx, cx - 4, cy - 4, 8, 14, "#B3E5FC");
    pixRect(ctx, cx - 5, cy - 6, 10, 4, "#81D4FA");
    pixRect(ctx, cx - 3, cy - 2, 6, 4, "#4FC3F7");
  } else if (f.type === "printer") {
    pixRect(ctx, fx + 6, fy + 10, T - 12, T - 16, "#ECEFF1");
    pixRect(ctx, fx + 6, fy + 8, T - 12, 4, "#B0BEC5");
    pixRect(ctx, fx + 8, fy + 14, T - 16, 2, "#FFF");
  } else if (f.type === "tv") {
    pixRect(ctx, fx + 4, fy + 4, T - 8, T - 12, "#1a1a2e");
    pixRect(ctx, fx + 6, fy + 6, T - 12, T - 16, "#3F51B5");
    pixRect(ctx, cx - 1, fy + T - 8, 2, 4, "#333");
  } else {
    // Fallback: draw emoji
    ctx.font = `${T * 0.5}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(f.emoji, cx, cy + 2);
  }
}

export const OfficeCanvas = memo(function OfficeCanvas({
  agents,
  player,
  playerConfig,
  selectedAgentId,
  onAgentClick,
}: OfficeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const smoothPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

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

    // Disable image smoothing for pixel art
    ctx.imageSmoothingEnabled = false;

    const camX = player.x * TILE_SIZE - cw / 2 + TILE_SIZE / 2;
    const camY = player.y * TILE_SIZE - ch / 2 + TILE_SIZE / 2;

    ctx.save();
    ctx.translate(-camX, -camY);

    // Visible range
    const startCol = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
    const endCol = Math.min(MAP_COLS, Math.ceil((camX + cw) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
    const endRow = Math.min(MAP_ROWS, Math.ceil((camY + ch) / TILE_SIZE) + 1);

    // Draw tiles
    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        const tile = TILE_MAP[y]?.[x] ?? 4;
        drawTile(ctx, x, y, tile, x * TILE_SIZE, y * TILE_SIZE);
      }
    }

    // Draw room labels
    ctx.font = "bold 11px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    for (const room of ROOMS) {
      const rx = (room.x + room.w / 2) * TILE_SIZE;
      const ry = room.y * TILE_SIZE - 6;
      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      const tw = ctx.measureText(room.name).width + 20;
      ctx.beginPath();
      ctx.roundRect(rx - tw / 2, ry - 14, tw, 20, 6);
      ctx.fill();
      ctx.fillStyle = "#F8FAFC";
      ctx.fillText(room.name, rx, ry);
    }

    // Draw furniture
    for (const f of FURNITURE) {
      const fx = f.x * TILE_SIZE;
      const fy = f.y * TILE_SIZE;
      if (f.x >= startCol - 1 && f.x <= endCol + 1 && f.y >= startRow - 1 && f.y <= endRow + 1) {
        drawFurnitureItem(ctx, f, fx, fy);
      }
    }

    // Draw agents
    const now = Date.now();
    for (const agent of agents) {
      let smooth = smoothPositions.current.get(agent.id);
      if (!smooth) {
        smooth = { x: agent.x * TILE_SIZE, y: agent.y * TILE_SIZE };
        smoothPositions.current.set(agent.id, smooth);
      }
      smooth.x += (agent.x * TILE_SIZE - smooth.x) * 0.15;
      smooth.y += (agent.y * TILE_SIZE - smooth.y) * 0.15;

      const ax = smooth.x + TILE_SIZE / 2;
      const ay = smooth.y + TILE_SIZE / 2;
      const bob = Math.sin(now * 0.004 + parseInt(agent.id.slice(-1)) * 1.5) * 2;

      drawPixelCharacter(ctx, ax, ay, bob, agent.color, "default", "none", "suit", true, agent.status);

      // Thinking ring
      if (agent.status === "thinking") {
        const pulse = Math.sin(now * 0.006) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(99, 102, 241, ${pulse * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ax, ay + bob - 4, TILE_SIZE * 0.35 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Selection ring
      if (agent.id === selectedAgentId) {
        ctx.strokeStyle = "#6366F1";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -now * 0.02;
        ctx.beginPath();
        ctx.arc(ax, ay + bob - 4, TILE_SIZE * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Name tag
      ctx.font = "bold 9px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      const nameW = ctx.measureText(agent.name).width + 14;
      const statusCol = STATUS_COLORS[agent.status];

      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.beginPath();
      ctx.roundRect(ax - nameW / 2 - 6, ay - TILE_SIZE * 0.55 + bob, nameW + 12, 16, 8);
      ctx.fill();

      ctx.fillStyle = statusCol;
      ctx.beginPath();
      ctx.arc(ax - nameW / 2, ay - TILE_SIZE * 0.55 + bob + 8, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#F8FAFC";
      ctx.fillText(agent.name, ax + 3, ay - TILE_SIZE * 0.55 + bob + 11);

      // Role text (smaller, below name)
      ctx.font = "7px 'Space Grotesk', sans-serif";
      ctx.fillStyle = "rgba(248,250,252,0.5)";
      ctx.fillText(agent.role, ax + 3, ay - TILE_SIZE * 0.55 + bob + 20);
    }

    // Draw player
    {
      let smooth = smoothPositions.current.get("player");
      if (!smooth) {
        smooth = { x: player.x * TILE_SIZE, y: player.y * TILE_SIZE };
        smoothPositions.current.set("player", smooth);
      }
      smooth.x += (player.x * TILE_SIZE - smooth.x) * 0.2;
      smooth.y += (player.y * TILE_SIZE - smooth.y) * 0.2;

      const px = smooth.x + TILE_SIZE / 2;
      const py = smooth.y + TILE_SIZE / 2;
      const bob = Math.sin(now * 0.005) * 1.5;

      drawPixelCharacter(
        ctx, px, py, bob,
        playerConfig?.color || "#4F46E5",
        playerConfig?.skinTone || "default",
        playerConfig?.hairStyle || "spiky",
        playerConfig?.outfitStyle || "suit",
        false,
        undefined,
        playerConfig?.accessory,
      );

      // Name tag
      ctx.font = "bold 10px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      const tw = ctx.measureText(player.name).width + 14;
      const pColor = playerConfig?.color || "#4F46E5";
      ctx.fillStyle = pColor + "E6";
      ctx.beginPath();
      ctx.roundRect(px - tw / 2, py - TILE_SIZE * 0.6 + bob, tw, 16, 8);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(player.name, px, py - TILE_SIZE * 0.6 + bob + 11);
    }

    // Mini-map
    {
      const mmW = 120;
      const mmH = (MAP_ROWS / MAP_COLS) * mmW;
      const mmX = camX + cw - mmW - 12;
      const mmY = camY + ch - mmH - 12;
      const scale = mmW / (MAP_COLS * TILE_SIZE);

      ctx.fillStyle = "rgba(15,23,42,0.75)";
      ctx.beginPath();
      ctx.roundRect(mmX - 4, mmY - 4, mmW + 8, mmH + 8, 6);
      ctx.fill();

      for (let y = 0; y < MAP_ROWS; y++) {
        for (let x = 0; x < MAP_COLS; x++) {
          const tile = TILE_MAP[y]?.[x] ?? 4;
          if (tile === 4) continue;
          ctx.fillStyle = tile === 1 ? "#64748B" : tile === 2 ? "#94A3B8" : tile === 3 ? "#A1887F" : "#CBD5E1";
          ctx.fillRect(mmX + x * TILE_SIZE * scale, mmY + y * TILE_SIZE * scale, TILE_SIZE * scale + 0.5, TILE_SIZE * scale + 0.5);
        }
      }
      // Agents on minimap
      for (const agent of agents) {
        ctx.fillStyle = agent.color;
        ctx.beginPath();
        ctx.arc(mmX + agent.x * TILE_SIZE * scale, mmY + agent.y * TILE_SIZE * scale, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Player on minimap
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(mmX + player.x * TILE_SIZE * scale, mmY + player.y * TILE_SIZE * scale, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = playerConfig?.color || "#4F46E5";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
    animFrameRef.current = requestAnimationFrame(draw);
  }, [agents, player, playerConfig, selectedAgentId]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = canvas.getBoundingClientRect();
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const camX = player.x * TILE_SIZE - cw / 2 + TILE_SIZE / 2;
      const camY = player.y * TILE_SIZE - ch / 2 + TILE_SIZE / 2;

      const worldX = e.clientX - rect.left + camX;
      const worldY = e.clientY - rect.top + camY;

      const tileX = Math.floor(worldX / TILE_SIZE);
      const tileY = Math.floor(worldY / TILE_SIZE);

      const clickedAgent = agents.find(
        (a) => Math.abs(a.x - tileX) <= 0 && Math.abs(a.y - tileY) <= 0
      );
      if (clickedAgent) onAgentClick(clickedAgent);
    },
    [agents, player, onAgentClick]
  );

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden cursor-crosshair">
      <canvas ref={canvasRef} onClick={handleClick} className="block" />
    </div>
  );
});
