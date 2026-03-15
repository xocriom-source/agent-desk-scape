import { useRef, useEffect, useCallback, memo } from "react";
import type { Agent, Player } from "@/types/agent";
import { TILE_MAP, TILE_SIZE, MAP_COLS, MAP_ROWS, FURNITURE, ROOMS } from "@/data/officeMap";

interface OfficeCanvasProps {
  agents: Agent[];
  player: Player;
  selectedAgentId?: string;
  onAgentClick: (agent: Agent) => void;
}

const TILE_COLORS: Record<number, string> = {
  0: "#E8DCC8", // wooden floor
  1: "#94A3B8", // wall
  2: "#B8C4E0", // carpet
  3: "#D4C4A8", // furniture floor
  4: "#C8D8C0", // outside/grass
};

const STATUS_COLORS: Record<string, string> = {
  active: "#10B981",
  idle: "#F59E0B",
  thinking: "#6366F1",
  busy: "#EF4444",
};

export const OfficeCanvas = memo(function OfficeCanvas({
  agents,
  player,
  selectedAgentId,
  onAgentClick,
}: OfficeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);

  // Smooth positions
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

    // Camera follows player
    const camX = player.x * TILE_SIZE - cw / 2 + TILE_SIZE / 2;
    const camY = player.y * TILE_SIZE - ch / 2 + TILE_SIZE / 2;

    ctx.save();
    ctx.translate(-camX, -camY);

    // Draw tiles
    const startCol = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
    const endCol = Math.min(MAP_COLS, Math.ceil((camX + cw) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
    const endRow = Math.min(MAP_ROWS, Math.ceil((camY + ch) / TILE_SIZE) + 1);

    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        const tile = TILE_MAP[y]?.[x] ?? 4;
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        // Base tile
        ctx.fillStyle = TILE_COLORS[tile] || TILE_COLORS[4];
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Grid lines for floors
        if (tile === 0 || tile === 2 || tile === 3) {
          ctx.strokeStyle = "rgba(0,0,0,0.06)";
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        }

        // Wall shadow
        if (tile === 1) {
          ctx.fillStyle = "rgba(0,0,0,0.15)";
          ctx.fillRect(px, py + TILE_SIZE - 4, TILE_SIZE, 4);
          // Wall detail
          ctx.fillStyle = "#7C8CA0";
          ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, 6);
        }

        // Grass pattern for outside
        if (tile === 4) {
          ctx.fillStyle = "rgba(100,180,100,0.15)";
          if ((x + y) % 3 === 0) {
            ctx.beginPath();
            ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Draw room labels
    ctx.font = "bold 11px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    for (const room of ROOMS) {
      const rx = (room.x + room.w / 2) * TILE_SIZE;
      const ry = room.y * TILE_SIZE - 4;
      ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
      const tw = ctx.measureText(room.name).width + 16;
      ctx.beginPath();
      ctx.roundRect(rx - tw / 2, ry - 14, tw, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#F8FAFC";
      ctx.fillText(room.name, rx, ry);
    }

    // Draw furniture
    ctx.font = `${TILE_SIZE * 0.55}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const f of FURNITURE) {
      const fx = f.x * TILE_SIZE + TILE_SIZE / 2;
      const fy = f.y * TILE_SIZE + TILE_SIZE / 2;

      // Furniture shadow/background
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.beginPath();
      ctx.roundRect(
        f.x * TILE_SIZE + 4,
        f.y * TILE_SIZE + 4,
        TILE_SIZE - 8,
        TILE_SIZE - 8,
        4
      );
      ctx.fill();

      ctx.fillText(f.emoji, fx, fy + 2);
    }

    // Update smooth positions and draw agents
    const now = Date.now();
    for (const agent of agents) {
      let smooth = smoothPositions.current.get(agent.id);
      if (!smooth) {
        smooth = { x: agent.x * TILE_SIZE, y: agent.y * TILE_SIZE };
        smoothPositions.current.set(agent.id, smooth);
      }

      const targetPx = agent.x * TILE_SIZE;
      const targetPy = agent.y * TILE_SIZE;
      smooth.x += (targetPx - smooth.x) * 0.15;
      smooth.y += (targetPy - smooth.y) * 0.15;

      const ax = smooth.x + TILE_SIZE / 2;
      const ay = smooth.y + TILE_SIZE / 2;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.ellipse(ax, ay + TILE_SIZE * 0.35, TILE_SIZE * 0.25, TILE_SIZE * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body bobbing
      const bob = Math.sin(now * 0.004 + parseInt(agent.id.slice(-1)) * 1.5) * 2;

      // Agent body (pixel-art style rectangle)
      const bodyW = TILE_SIZE * 0.55;
      const bodyH = TILE_SIZE * 0.65;
      ctx.fillStyle = agent.color;
      ctx.beginPath();
      ctx.roundRect(ax - bodyW / 2, ay - bodyH / 2 + bob - 4, bodyW, bodyH, 4);
      ctx.fill();

      // Darker lower body
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.roundRect(ax - bodyW / 2, ay + bob + 2, bodyW, bodyH * 0.3, [0, 0, 4, 4]);
      ctx.fill();

      // Eyes
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(ax - 6, ay - 8 + bob, 5, 5, 1);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(ax + 1, ay - 8 + bob, 5, 5, 1);
      ctx.fill();
      // Pupils
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(ax - 4, ay - 6 + bob, 2, 2);
      ctx.fillRect(ax + 3, ay - 6 + bob, 2, 2);

      // Antenna
      ctx.strokeStyle = agent.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ax, ay - bodyH / 2 + bob - 4);
      ctx.lineTo(ax, ay - bodyH / 2 + bob - 12);
      ctx.stroke();

      // Antenna light (status color)
      const statusCol = STATUS_COLORS[agent.status];
      ctx.fillStyle = statusCol;
      ctx.beginPath();
      ctx.arc(ax, ay - bodyH / 2 + bob - 14, 3, 0, Math.PI * 2);
      ctx.fill();

      // Thinking animation
      if (agent.status === "thinking") {
        const pulse = Math.sin(now * 0.006) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(99, 102, 241, ${pulse * 0.6})`;
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
        ctx.beginPath();
        ctx.arc(ax, ay + bob - 4, TILE_SIZE * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Name tag
      ctx.font = "bold 10px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      const nameW = ctx.measureText(agent.name).width + 12;

      // Status dot + name background
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.beginPath();
      ctx.roundRect(ax - nameW / 2 - 6, ay - bodyH / 2 + bob - 30, nameW + 12, 16, 8);
      ctx.fill();

      // Status dot
      ctx.fillStyle = statusCol;
      ctx.beginPath();
      ctx.arc(ax - nameW / 2, ay - bodyH / 2 + bob - 22, 3, 0, Math.PI * 2);
      ctx.fill();

      // Name text
      ctx.fillStyle = "#F8FAFC";
      ctx.fillText(agent.name, ax + 3, ay - bodyH / 2 + bob - 20);
    }

    // Draw player
    {
      let smooth = smoothPositions.current.get("player");
      if (!smooth) {
        smooth = { x: player.x * TILE_SIZE, y: player.y * TILE_SIZE };
        smoothPositions.current.set("player", smooth);
      }
      const targetPx = player.x * TILE_SIZE;
      const targetPy = player.y * TILE_SIZE;
      smooth.x += (targetPx - smooth.x) * 0.2;
      smooth.y += (targetPy - smooth.y) * 0.2;

      const px = smooth.x + TILE_SIZE / 2;
      const py = smooth.y + TILE_SIZE / 2;
      const bob = Math.sin(now * 0.005) * 1.5;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(px, py + TILE_SIZE * 0.35, TILE_SIZE * 0.25, TILE_SIZE * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      const bw = TILE_SIZE * 0.5;
      const bh = TILE_SIZE * 0.6;
      // Hair
      ctx.fillStyle = "#1E1B4B";
      ctx.beginPath();
      ctx.roundRect(px - bw / 2 - 2, py - bh / 2 + bob - 14, bw + 4, bh * 0.35, [6, 6, 0, 0]);
      ctx.fill();
      // Face
      ctx.fillStyle = "#FBBF8B";
      ctx.beginPath();
      ctx.roundRect(px - bw / 2 + 2, py - bh / 2 + bob - 4, bw - 4, bh * 0.3, 2);
      ctx.fill();
      // Outfit
      ctx.fillStyle = "#4F46E5";
      ctx.beginPath();
      ctx.roundRect(px - bw / 2, py + bob, bw, bh * 0.5, [0, 0, 4, 4]);
      ctx.fill();

      // Eyes
      ctx.fillStyle = "#1E1B4B";
      ctx.fillRect(px - 4, py - 4 + bob, 2, 2);
      ctx.fillRect(px + 2, py - 4 + bob, 2, 2);

      // Name tag
      ctx.font = "bold 10px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      const tw = ctx.measureText(player.name).width + 12;
      ctx.fillStyle = "rgba(79, 70, 229, 0.9)";
      ctx.beginPath();
      ctx.roundRect(px - tw / 2, py - bh / 2 + bob - 30, tw, 16, 8);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(player.name, px, py - bh / 2 + bob - 20);
    }

    ctx.restore();

    animFrameRef.current = requestAnimationFrame(draw);
  }, [agents, player, selectedAgentId]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // Handle clicks on agents
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

      if (clickedAgent) {
        onAgentClick(clickedAgent);
      }
    },
    [agents, player, onAgentClick]
  );

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden cursor-crosshair">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="block"
      />
    </div>
  );
});
