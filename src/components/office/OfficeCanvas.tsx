import { useRef, useEffect, useCallback, memo } from "react";
import type { Agent, Player } from "@/types/agent";
import { TILE_MAP, TILE_W, TILE_H, MAP_COLS, MAP_ROWS, FURNITURE, ROOMS, toIso, fromIso, getRoomAt } from "@/data/officeMap";
import type { RoomDef } from "@/data/officeMap";

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

function shade(color: string, amount: number): string {
  const r = Math.max(0, Math.min(255, parseInt(color.slice(1, 3), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(color.slice(3, 5), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(color.slice(5, 7), 16) + amount));
  return `rgb(${r},${g},${b})`;
}

// Draw isometric diamond tile
function drawIsoTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, color: string, borderColor?: string) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  ctx.beginPath();
  ctx.moveTo(sx, sy - hh);
  ctx.lineTo(sx + hw, sy);
  ctx.lineTo(sx, sy + hh);
  ctx.lineTo(sx - hw, sy);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

// Draw isometric wall block
function drawIsoWall(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;
  const wallH = 20;

  // Top face
  ctx.beginPath();
  ctx.moveTo(sx, sy - hh - wallH);
  ctx.lineTo(sx + hw, sy - wallH);
  ctx.lineTo(sx, sy + hh - wallH);
  ctx.lineTo(sx - hw, sy - wallH);
  ctx.closePath();
  ctx.fillStyle = "#8B9DB5";
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Right face
  ctx.beginPath();
  ctx.moveTo(sx, sy + hh - wallH);
  ctx.lineTo(sx + hw, sy - wallH);
  ctx.lineTo(sx + hw, sy);
  ctx.lineTo(sx, sy + hh);
  ctx.closePath();
  ctx.fillStyle = "#6B7D95";
  ctx.fill();
  ctx.stroke();

  // Left face
  ctx.beginPath();
  ctx.moveTo(sx, sy + hh - wallH);
  ctx.lineTo(sx - hw, sy - wallH);
  ctx.lineTo(sx - hw, sy);
  ctx.lineTo(sx, sy + hh);
  ctx.closePath();
  ctx.fillStyle = "#7A8CA4";
  ctx.fill();
  ctx.stroke();
}

// Draw isometric furniture
function drawIsoFurniture(ctx: CanvasRenderingContext2D, type: string, sx: number, sy: number, emoji: string) {
  const hw = TILE_W / 2;
  const hh = TILE_H / 2;

  if (type === "desk") {
    // Desk surface
    const deskH = 12;
    ctx.beginPath();
    ctx.moveTo(sx, sy - hh - deskH);
    ctx.lineTo(sx + hw * 0.7, sy - deskH);
    ctx.lineTo(sx, sy + hh * 0.7 - deskH);
    ctx.lineTo(sx - hw * 0.7, sy - deskH);
    ctx.closePath();
    ctx.fillStyle = "#A08060";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Right leg
    ctx.fillStyle = "#7A6040";
    ctx.fillRect(sx + hw * 0.5, sy - deskH, 2, deskH);
    // Left leg
    ctx.fillRect(sx - hw * 0.5, sy - deskH, 2, deskH);

    // Monitor on desk
    ctx.fillStyle = "#263238";
    ctx.fillRect(sx - 6, sy - hh - deskH - 14, 12, 10);
    ctx.fillStyle = "#4FC3F7";
    ctx.fillRect(sx - 5, sy - hh - deskH - 13, 10, 8);
    ctx.fillStyle = "#455A64";
    ctx.fillRect(sx - 1, sy - hh - deskH - 4, 2, 4);
  } else if (type === "chair") {
    ctx.fillStyle = "#5D4037";
    ctx.beginPath();
    ctx.ellipse(sx, sy - 4, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Backrest
    ctx.fillStyle = "#795548";
    ctx.fillRect(sx - 5, sy - 14, 10, 10);
    ctx.beginPath();
    ctx.arc(sx, sy - 14, 5, Math.PI, 0);
    ctx.fill();
  } else if (type === "server") {
    const rackH = 24;
    // Rack body
    ctx.fillStyle = "#37474F";
    ctx.beginPath();
    ctx.moveTo(sx, sy - hh * 0.6 - rackH);
    ctx.lineTo(sx + hw * 0.5, sy - rackH);
    ctx.lineTo(sx + hw * 0.5, sy);
    ctx.lineTo(sx, sy + hh * 0.6);
    ctx.lineTo(sx - hw * 0.5, sy);
    ctx.lineTo(sx - hw * 0.5, sy - rackH);
    ctx.closePath();
    ctx.fill();
    // Front face
    ctx.fillStyle = "#263238";
    ctx.fillRect(sx - hw * 0.4, sy - rackH + 2, hw * 0.8, rackH - 2);
    // LEDs
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = Math.random() > 0.4 ? "#4CAF50" : "#F44336";
      ctx.beginPath();
      ctx.arc(sx - hw * 0.2, sy - rackH + 6 + i * 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === "sofa") {
    const sofaH = 8;
    // Seat
    ctx.beginPath();
    ctx.moveTo(sx, sy - hh * 0.8 - sofaH);
    ctx.lineTo(sx + hw * 0.8, sy - sofaH);
    ctx.lineTo(sx, sy + hh * 0.8 - sofaH);
    ctx.lineTo(sx - hw * 0.8, sy - sofaH);
    ctx.closePath();
    ctx.fillStyle = "#7B68AE";
    ctx.fill();
    // Backrest
    ctx.fillStyle = "#6A5A9E";
    ctx.fillRect(sx - hw * 0.7, sy - sofaH - 8, hw * 1.4, 8);
    ctx.beginPath();
    ctx.arc(sx, sy - sofaH - 8, hw * 0.7, Math.PI, 0);
    ctx.fill();
  } else if (type === "plant") {
    // Pot
    ctx.fillStyle = "#8D6E63";
    ctx.beginPath();
    ctx.moveTo(sx - 6, sy);
    ctx.lineTo(sx + 6, sy);
    ctx.lineTo(sx + 4, sy + 8);
    ctx.lineTo(sx - 4, sy + 8);
    ctx.closePath();
    ctx.fill();
    // Leaves
    ctx.fillStyle = "#4CAF50";
    ctx.beginPath();
    ctx.arc(sx, sy - 6, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#66BB6A";
    ctx.beginPath();
    ctx.arc(sx - 5, sy - 10, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 5, sy - 10, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#81C784";
    ctx.beginPath();
    ctx.arc(sx, sy - 14, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "bookshelf") {
    const shelfH = 26;
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(sx - hw * 0.4, sy - shelfH, hw * 0.8, shelfH);
    // Shelves & books
    const colors = ["#E53935", "#1E88E5", "#43A047", "#FB8C00", "#8E24AA", "#00897B"];
    for (let row = 0; row < 3; row++) {
      ctx.fillStyle = "#4E342E";
      ctx.fillRect(sx - hw * 0.38, sy - shelfH + 2 + row * 8, hw * 0.76, 1);
      for (let b = 0; b < 4; b++) {
        ctx.fillStyle = colors[(row * 4 + b) % colors.length];
        ctx.fillRect(sx - hw * 0.35 + b * 5, sy - shelfH + 3 + row * 8, 4, 6);
      }
    }
  } else if (type === "coffee") {
    // Counter
    ctx.fillStyle = "#5D4037";
    ctx.beginPath();
    ctx.moveTo(sx, sy - hh * 0.5 - 8);
    ctx.lineTo(sx + hw * 0.5, sy - 8);
    ctx.lineTo(sx, sy + hh * 0.5 - 8);
    ctx.lineTo(sx - hw * 0.5, sy - 8);
    ctx.closePath();
    ctx.fill();
    // Cup
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(sx, sy - 14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6D4C41";
    ctx.beginPath();
    ctx.arc(sx, sy - 14, 3, 0, Math.PI * 2);
    ctx.fill();
    // Steam
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx - 1, sy - 18);
    ctx.quadraticCurveTo(sx - 3, sy - 22, sx, sy - 26);
    ctx.stroke();
  } else if (type === "screen" || type === "tv") {
    const h = 18;
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(sx - 10, sy - h - 4, 20, h);
    ctx.fillStyle = type === "screen" ? "#1565C0" : "#3F51B5";
    ctx.fillRect(sx - 9, sy - h - 3, 18, h - 2);
    // Stand
    ctx.fillStyle = "#37474F";
    ctx.fillRect(sx - 1, sy - 4, 2, 6);
    ctx.fillRect(sx - 5, sy + 2, 10, 2);
  } else if (type === "whiteboard") {
    ctx.fillStyle = "#ECEFF1";
    ctx.fillRect(sx - 10, sy - 20, 20, 16);
    ctx.strokeStyle = "#B0BEC5";
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 10, sy - 20, 20, 16);
    ctx.fillStyle = "#78909C";
    ctx.fillRect(sx - 1, sy - 4, 2, 6);
  } else if (type === "vending") {
    ctx.fillStyle = "#455A64";
    ctx.fillRect(sx - 8, sy - 22, 16, 22);
    ctx.fillStyle = "#263238";
    ctx.fillRect(sx - 6, sy - 20, 12, 10);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = ["#F44336", "#4CAF50", "#FF9800"][i];
      ctx.fillRect(sx - 4 + i * 4, sy - 18, 3, 6);
    }
  } else if (type === "table") {
    const tH = 8;
    ctx.beginPath();
    ctx.moveTo(sx, sy - hh * 0.6 - tH);
    ctx.lineTo(sx + hw * 0.6, sy - tH);
    ctx.lineTo(sx, sy + hh * 0.6 - tH);
    ctx.lineTo(sx - hw * 0.6, sy - tH);
    ctx.closePath();
    ctx.fillStyle = "#8D6E63";
    ctx.fill();
    ctx.fillRect(sx - 1, sy - tH, 2, tH);
  } else if (type === "monitor") {
    ctx.fillStyle = "#263238";
    ctx.fillRect(sx - 8, sy - 18, 16, 14);
    ctx.fillStyle = "#4FC3F7";
    ctx.fillRect(sx - 7, sy - 17, 14, 12);
    ctx.fillStyle = "#37474F";
    ctx.fillRect(sx - 1, sy - 4, 2, 4);
    ctx.fillRect(sx - 4, sy, 8, 2);
  } else if (type === "printer") {
    ctx.fillStyle = "#ECEFF1";
    ctx.fillRect(sx - 8, sy - 10, 16, 10);
    ctx.fillStyle = "#B0BEC5";
    ctx.fillRect(sx - 8, sy - 12, 16, 4);
    ctx.fillStyle = "#FFF";
    ctx.fillRect(sx - 5, sy - 5, 10, 2);
  } else if (type === "water") {
    ctx.fillStyle = "#B3E5FC";
    ctx.beginPath();
    ctx.arc(sx, sy - 4, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#81D4FA";
    ctx.beginPath();
    ctx.arc(sx, sy - 4, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.font = "20px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, sx, sy - 8);
  }
}

// Draw isometric character
function drawIsoCharacter(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  bob: number,
  color: string,
  isAgent: boolean,
  skinTone?: string,
  hairStyle?: string,
  outfitStyle?: string,
  status?: string,
  accessory?: string,
) {
  const by = sy + bob;

  // Shadow ellipse
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(sx, sy + 6, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isAgent) {
    // Robot body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(sx - 9, by - 12, 18, 20, 3);
    ctx.fill();
    // Darker bottom
    ctx.fillStyle = shade(color, -25);
    ctx.beginPath();
    ctx.roundRect(sx - 9, by + 2, 18, 8, [0, 0, 3, 3]);
    ctx.fill();
    // Belt detail
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(sx - 7, by - 1, 14, 2);

    // Head
    const headColor = shade(color, 15);
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.roundRect(sx - 8, by - 24, 16, 14, 3);
    ctx.fill();

    // Visor
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.roundRect(sx - 6, by - 21, 12, 8, 2);
    ctx.fill();

    // Eyes (LED)
    const eyeColor = status === "thinking" ? "#6366F1" : "#00FF88";
    ctx.fillStyle = eyeColor;
    ctx.fillRect(sx - 4, by - 19, 3, 3);
    ctx.fillRect(sx + 1, by - 19, 3, 3);
    // Eye glow
    ctx.fillStyle = eyeColor + "40";
    ctx.beginPath();
    ctx.arc(sx - 2.5, by - 17.5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 2.5, by - 17.5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Antenna
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx, by - 24);
    ctx.lineTo(sx, by - 32);
    ctx.stroke();
    // Antenna LED
    const statusCol = STATUS_COLORS[status || "idle"];
    ctx.fillStyle = statusCol;
    ctx.beginPath();
    ctx.arc(sx, by - 33, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = statusCol + "50";
    ctx.beginPath();
    ctx.arc(sx, by - 33, 6, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    ctx.fillStyle = shade(color, -35);
    ctx.fillRect(sx - 7, by + 8, 5, 3);
    ctx.fillRect(sx + 2, by + 8, 5, 3);
  } else {
    // Human character
    const skin = SKIN_TONES[skinTone || "default"] || SKIN_TONES.default;

    // Legs
    ctx.fillStyle = "#2D3748";
    ctx.fillRect(sx - 5, by + 2, 4, 10);
    ctx.fillRect(sx + 1, by + 2, 4, 10);
    // Shoes
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(sx - 6, by + 11, 5, 3);
    ctx.fillRect(sx + 1, by + 11, 5, 3);

    // Body / outfit
    if (outfitStyle === "suit") {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(sx - 9, by - 10, 18, 14, 2);
      ctx.fill();
      // Collar
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(sx - 5, by - 12, 10, 3);
      // Tie
      ctx.fillStyle = "#DC2626";
      ctx.fillRect(sx - 1, by - 10, 2, 10);
    } else if (outfitStyle === "casual") {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(sx - 9, by - 10, 18, 14, 2);
      ctx.fill();
      ctx.fillStyle = shade(color, 15);
      ctx.fillRect(sx - 4, by - 12, 8, 4);
    } else if (outfitStyle === "tech") {
      ctx.fillStyle = "#1a1a2e";
      ctx.beginPath();
      ctx.roundRect(sx - 9, by - 10, 18, 14, 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx, by - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Lab coat
      ctx.fillStyle = "#F0F0F0";
      ctx.beginPath();
      ctx.roundRect(sx - 10, by - 12, 20, 16, 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.fillRect(sx - 4, by - 10, 8, 6);
    }

    // Arms
    ctx.fillStyle = outfitStyle === "tech" ? "#1a1a2e" : color;
    ctx.fillRect(sx - 12, by - 8, 4, 10);
    ctx.fillRect(sx + 8, by - 8, 4, 10);
    // Hands
    ctx.fillStyle = skin;
    ctx.fillRect(sx - 12, by + 1, 4, 3);
    ctx.fillRect(sx + 8, by + 1, 4, 3);

    // Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.roundRect(sx - 7, by - 26, 14, 16, 4);
    ctx.fill();

    // Hair
    const hairColors: Record<string, string> = {
      spiky: "#1E1B4B",
      flat: "#4A3728",
      mohawk: "#C62828",
      curly: "#1B5E20",
      none: "transparent",
    };
    const hairC = hairColors[hairStyle || "spiky"] || "#1E1B4B";
    if (hairStyle === "spiky") {
      ctx.fillStyle = hairC;
      ctx.beginPath();
      ctx.moveTo(sx - 8, by - 22);
      ctx.lineTo(sx - 4, by - 32);
      ctx.lineTo(sx, by - 26);
      ctx.lineTo(sx + 4, by - 34);
      ctx.lineTo(sx + 8, by - 22);
      ctx.closePath();
      ctx.fill();
    } else if (hairStyle === "flat") {
      ctx.fillStyle = hairC;
      ctx.beginPath();
      ctx.roundRect(sx - 8, by - 30, 16, 10, [5, 5, 0, 0]);
      ctx.fill();
    } else if (hairStyle === "mohawk") {
      ctx.fillStyle = hairC;
      ctx.fillRect(sx - 3, by - 34, 6, 12);
    } else if (hairStyle === "curly") {
      ctx.fillStyle = hairC;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(sx + i * 4, by - 26, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Eyes
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(sx - 5, by - 20, 4, 4, 1);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(sx + 1, by - 20, 4, 4, 1);
    ctx.fill();
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(sx - 4, by - 19, 2, 2);
    ctx.fillRect(sx + 2, by - 19, 2, 2);

    // Mouth
    ctx.fillStyle = shade(skin, -40);
    ctx.fillRect(sx - 2, by - 14, 4, 1);

    // Accessories
    if (accessory === "glasses") {
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - 6, by - 21, 5, 5);
      ctx.strokeRect(sx + 1, by - 21, 5, 5);
      ctx.beginPath();
      ctx.moveTo(sx - 1, by - 19);
      ctx.lineTo(sx + 1, by - 19);
      ctx.stroke();
    } else if (accessory === "headphones") {
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, by - 26, 10, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = "#333";
      ctx.fillRect(sx - 11, by - 22, 4, 6);
      ctx.fillRect(sx + 7, by - 22, 4, 6);
    }

    // Crown
    ctx.font = "12px serif";
    ctx.textAlign = "center";
    ctx.fillText("👑", sx, by - 34);
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
    ctx.imageSmoothingEnabled = false;

    // Camera centered on player (isometric)
    const playerIso = toIso(player.x, player.y);
    const camX = playerIso.sx - cw / 2;
    const camY = playerIso.sy - ch / 2;

    ctx.save();
    ctx.translate(-camX, -camY);

    // Background
    ctx.fillStyle = "#88B878";
    ctx.fillRect(camX - 100, camY - 100, cw + 200, ch + 200);

    // Grass texture
    for (let i = 0; i < 60; i++) {
      const gx = camX + Math.random() * (cw + 200) - 100;
      const gy = camY + Math.random() * (ch + 200) - 100;
      ctx.fillStyle = "rgba(60,120,50,0.15)";
      ctx.fillRect(gx, gy, 2, 4);
    }

    // Collect all drawable entities for depth sorting
    const drawables: { y: number; draw: () => void }[] = [];

    // Draw floor tiles first (no depth sorting needed)
    for (let y = 0; y < MAP_ROWS; y++) {
      for (let x = 0; x < MAP_COLS; x++) {
        const tile = TILE_MAP[y]?.[x] ?? 4;
        if (tile === 4) continue;

        const iso = toIso(x, y);

        if (tile === 1) {
          // Walls get added to drawables for depth
          drawables.push({
            y: iso.sy,
            draw: () => drawIsoWall(ctx, iso.sx, iso.sy),
          });
        } else {
          // Floor tiles drawn immediately
          const room = getRoomAt(x, y);
          let floorColor = "#E2D6C0";
          let borderColor = "rgba(0,0,0,0.06)";
          if (room) {
            floorColor = tile === 2 ? (room.carpetColor || room.floorColor) : room.floorColor;
          }
          if (tile === 3) {
            floorColor = shade(floorColor, -10);
          }
          drawIsoTile(ctx, iso.sx, iso.sy, floorColor, borderColor);

          // Carpet pattern
          if (tile === 2 && (x + y) % 2 === 0) {
            const patColor = room?.carpetColor ? shade(room.carpetColor, -8) : "rgba(0,0,0,0.04)";
            drawIsoTile(ctx, iso.sx, iso.sy, patColor);
          }
        }
      }
    }

    // Room labels
    for (const room of ROOMS) {
      const cx = room.x + room.w / 2;
      const cy = room.y;
      const iso = toIso(cx, cy);
      ctx.font = "bold 11px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      const text = room.name;
      const tw = ctx.measureText(text).width + 16;
      ctx.fillStyle = "rgba(15,23,42,0.7)";
      ctx.beginPath();
      ctx.roundRect(iso.sx - tw / 2, iso.sy - 36, tw, 20, 6);
      ctx.fill();
      ctx.fillStyle = "#F8FAFC";
      ctx.fillText(text, iso.sx, iso.sy - 22);
    }

    // Add furniture to drawables
    for (const f of FURNITURE) {
      const iso = toIso(f.x, f.y);
      drawables.push({
        y: iso.sy,
        draw: () => drawIsoFurniture(ctx, f.type, iso.sx, iso.sy, f.emoji),
      });
    }

    // Add agents to drawables
    const now = Date.now();
    for (const agent of agents) {
      let smooth = smoothPositions.current.get(agent.id);
      if (!smooth) {
        smooth = { x: agent.x, y: agent.y };
        smoothPositions.current.set(agent.id, smooth);
      }
      smooth.x += (agent.x - smooth.x) * 0.12;
      smooth.y += (agent.y - smooth.y) * 0.12;

      const iso = toIso(smooth.x, smooth.y);
      const bob = Math.sin(now * 0.004 + parseInt(agent.id.slice(-1)) * 1.5) * 2;

      drawables.push({
        y: iso.sy + 100, // Characters render on top
        draw: () => {
          drawIsoCharacter(ctx, iso.sx, iso.sy, bob, agent.color, true, undefined, undefined, undefined, agent.status);

          // Thinking ring
          if (agent.status === "thinking") {
            const pulse = Math.sin(now * 0.006) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(99,102,241,${pulse * 0.5})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(iso.sx, iso.sy + bob + 4, 14 + pulse * 4, 6 + pulse * 2, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Selection ring
          if (agent.id === selectedAgentId) {
            ctx.strokeStyle = "#6366F1";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.lineDashOffset = -now * 0.02;
            ctx.beginPath();
            ctx.ellipse(iso.sx, iso.sy + bob + 4, 16, 8, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Name tag
          ctx.font = "bold 9px 'Space Grotesk', sans-serif";
          ctx.textAlign = "center";
          const nameW = ctx.measureText(agent.name).width + 14;
          const statusCol = STATUS_COLORS[agent.status];
          const tagY = iso.sy + bob - 40;

          ctx.fillStyle = "rgba(15,23,42,0.88)";
          ctx.beginPath();
          ctx.roundRect(iso.sx - nameW / 2 - 6, tagY, nameW + 12, 18, 9);
          ctx.fill();

          ctx.fillStyle = statusCol;
          ctx.beginPath();
          ctx.arc(iso.sx - nameW / 2, tagY + 9, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#F8FAFC";
          ctx.fillText(agent.name, iso.sx + 3, tagY + 12);

          // Role
          ctx.font = "7px 'Space Grotesk', sans-serif";
          ctx.fillStyle = "rgba(248,250,252,0.5)";
          ctx.fillText(agent.role, iso.sx + 3, tagY + 22);
        },
      });
    }

    // Add player to drawables
    {
      let smooth = smoothPositions.current.get("player");
      if (!smooth) {
        smooth = { x: player.x, y: player.y };
        smoothPositions.current.set("player", smooth);
      }
      smooth.x += (player.x - smooth.x) * 0.18;
      smooth.y += (player.y - smooth.y) * 0.18;

      const iso = toIso(smooth.x, smooth.y);
      const bob = Math.sin(now * 0.005) * 1.5;

      drawables.push({
        y: iso.sy + 100,
        draw: () => {
          drawIsoCharacter(
            ctx, iso.sx, iso.sy, bob,
            playerConfig?.color || "#4F46E5",
            false,
            playerConfig?.skinTone,
            playerConfig?.hairStyle,
            playerConfig?.outfitStyle,
            undefined,
            playerConfig?.accessory,
          );

          // Name tag
          ctx.font = "bold 10px 'Space Grotesk', sans-serif";
          ctx.textAlign = "center";
          const tw = ctx.measureText(player.name).width + 14;
          const pColor = playerConfig?.color || "#4F46E5";
          const tagY = iso.sy + bob - 42;
          ctx.fillStyle = pColor + "E6";
          ctx.beginPath();
          ctx.roundRect(iso.sx - tw / 2, tagY, tw, 16, 8);
          ctx.fill();
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(player.name, iso.sx, tagY + 12);
        },
      });
    }

    // Sort by depth and draw
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) {
      d.draw();
    }

    // Mini-map
    {
      const mmW = 130;
      const mmH = (MAP_ROWS / MAP_COLS) * mmW;
      const mmX = camX + cw - mmW - 16;
      const mmY = camY + ch - mmH - 16;
      const scaleX = mmW / MAP_COLS;
      const scaleY = mmH / MAP_ROWS;

      ctx.fillStyle = "rgba(15,23,42,0.8)";
      ctx.beginPath();
      ctx.roundRect(mmX - 6, mmY - 6, mmW + 12, mmH + 12, 8);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Mini-map title
      ctx.font = "bold 8px 'Space Grotesk', sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.textAlign = "left";
      ctx.fillText("MAPA", mmX, mmY - 10);

      for (let y = 0; y < MAP_ROWS; y++) {
        for (let x = 0; x < MAP_COLS; x++) {
          const tile = TILE_MAP[y]?.[x] ?? 4;
          if (tile === 4) continue;
          ctx.fillStyle = tile === 1 ? "#64748B" : tile === 2 ? "#94A3B8" : tile === 3 ? "#A1887F" : "#CBD5E1";
          ctx.fillRect(mmX + x * scaleX, mmY + y * scaleY, scaleX + 0.5, scaleY + 0.5);
        }
      }
      for (const agent of agents) {
        ctx.fillStyle = agent.color;
        ctx.beginPath();
        ctx.arc(mmX + agent.x * scaleX, mmY + agent.y * scaleY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#FFF";
      ctx.beginPath();
      ctx.arc(mmX + player.x * scaleX, mmY + player.y * scaleY, 3, 0, Math.PI * 2);
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

  // Click handling (isometric)
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const playerIso = toIso(player.x, player.y);
      const camX = playerIso.sx - cw / 2;
      const camY = playerIso.sy - ch / 2;

      const worldX = e.clientX - rect.left + camX;
      const worldY = e.clientY - rect.top + camY;
      const tile = fromIso(worldX, worldY);

      const clickedAgent = agents.find(
        (a) => Math.abs(a.x - tile.x) <= 1 && Math.abs(a.y - tile.y) <= 1
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
