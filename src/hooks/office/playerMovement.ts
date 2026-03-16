import { useRef, useCallback, useEffect } from "react";
import type { Player } from "@/types/agent";
import {
  bfsPath8,
  findClosestWalkable,
  isWalkableAtFloat,
  tileFromFloat,
  type Tile,
} from "@/hooks/office/movementUtils";

function stepWithCollision(
  x: number, y: number, nx: number, ny: number, radius = 0.22
): { x: number; y: number; blocked: boolean } {
  if (isWalkableAtFloat(nx, ny, radius)) return { x: nx, y: ny, blocked: false };
  if (isWalkableAtFloat(nx, y, radius)) return { x: nx, y, blocked: false };
  if (isWalkableAtFloat(x, ny, radius)) return { x, y: ny, blocked: false };
  const smallR = radius * 0.6;
  if (isWalkableAtFloat(nx, ny, smallR)) return { x: nx, y: ny, blocked: false };
  if (isWalkableAtFloat(nx, y, smallR)) return { x: nx, y, blocked: false };
  if (isWalkableAtFloat(x, ny, smallR)) return { x, y: ny, blocked: false };
  return { x, y, blocked: true };
}

export function usePlayerMovement(
  player: Player,
  setPlayer: React.Dispatch<React.SetStateAction<Player>>,
  chatOpen: boolean
) {
  const pathRef = useRef<Tile[]>([]);
  const goalRef = useRef<Tile | null>(null);
  const stuckRef = useRef(0);
  const keysDown = useRef<Set<string>>(new Set());

  const clearPath = useCallback(() => {
    pathRef.current = [];
    goalRef.current = null;
    stuckRef.current = 0;
  }, []);

  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      clearPath();
      const len = Math.hypot(dx, dy) || 1;
      const step = 0.38;
      const vx = (dx / len) * step;
      const vy = (dy / len) * step;
      setPlayer((p) => {
        const r = stepWithCollision(p.x, p.y, p.x + vx, p.y + vy);
        if (r.blocked) return p;
        return { ...p, x: r.x, y: r.y, angle: Math.atan2(vx, vy) };
      });
    },
    [clearPath, setPlayer]
  );

  const setPlayerDestination = useCallback(
    (x: number, y: number) => {
      if (chatOpen) return;
      const start = tileFromFloat(player.x, player.y);
      const goal = findClosestWalkable({ x, y });
      if (!goal) return;
      const path = bfsPath8(start, goal);
      if (!path.length) return;
      goalRef.current = goal;
      pathRef.current = path;
      stuckRef.current = 0;
    },
    [player.x, player.y, chatOpen]
  );

  // Keyboard input
  useEffect(() => {
    const keyMap: Record<string, string> = {
      w: "ArrowUp", W: "ArrowUp", ArrowUp: "ArrowUp",
      s: "ArrowDown", S: "ArrowDown", ArrowDown: "ArrowDown",
      a: "ArrowLeft", A: "ArrowLeft", ArrowLeft: "ArrowLeft",
      d: "ArrowRight", D: "ArrowRight", ArrowRight: "ArrowRight",
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (chatOpen || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;
      const mapped = keyMap[e.key];
      if (mapped) { e.preventDefault(); keysDown.current.add(mapped); }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const mapped = keyMap[e.key];
      if (mapped) keysDown.current.delete(mapped);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); };
  }, [chatOpen]);

  // Movement loop
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const maxSpeed = 5.5;
    const accel = 14.0;
    const decel = 10.0;
    const rotateSpeed = 3.2;
    const pathSpeed = 5.0;
    let currentSpeed = 0;

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (chatOpen) { last = t; return; }
      const dt = Math.min(0.05, (t - (last || t)) / 1000);
      last = t;
      if (dt <= 0) return;

      const keys = keysDown.current;
      const up = keys.has("ArrowUp");
      const down = keys.has("ArrowDown");
      const left = keys.has("ArrowLeft");
      const right = keys.has("ArrowRight");
      const usingKeys = up || down || left || right;

      setPlayer((p) => {
        let { x, y, angle } = p;
        if (usingKeys) { pathRef.current = []; goalRef.current = null; stuckRef.current = 0; }

        if (usingKeys) {
          if (left) angle -= rotateSpeed * dt;
          if (right) angle += rotateSpeed * dt;
          angle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          let inputDir = 0;
          if (up) inputDir += 1;
          if (down) inputDir -= 1;
          if (inputDir !== 0) {
            currentSpeed += inputDir * accel * dt;
            currentSpeed = Math.max(-maxSpeed * 0.6, Math.min(maxSpeed, currentSpeed));
          } else {
            if (currentSpeed > 0) currentSpeed = Math.max(0, currentSpeed - decel * dt);
            else if (currentSpeed < 0) currentSpeed = Math.min(0, currentSpeed + decel * dt);
          }
          const vx = Math.sin(angle) * currentSpeed;
          const vy = Math.cos(angle) * currentSpeed;
          const r = stepWithCollision(x, y, x + vx * dt, y + vy * dt);
          if (r.blocked) currentSpeed *= 0.5;
          x = r.x; y = r.y;
          if (x === p.x && y === p.y && angle === p.angle) return p;
          return { ...p, x, y, angle };
        }

        if (pathRef.current.length) {
          const next = pathRef.current[0];
          const dirX = next.x - x;
          const dirY = next.y - y;
          const dist = Math.hypot(dirX, dirY);
          if (dist < 0.14) {
            x = next.x; y = next.y;
            pathRef.current.shift();
            stuckRef.current = 0;
          } else {
            const vx = (dirX / dist) * pathSpeed;
            const vy = (dirY / dist) * pathSpeed;
            const r = stepWithCollision(x, y, x + vx * dt, y + vy * dt);
            if (r.blocked) {
              if (goalRef.current) {
                stuckRef.current += dt;
                if (stuckRef.current > 0.35) {
                  const start = tileFromFloat(x, y);
                  const newPath = bfsPath8(start, goalRef.current);
                  pathRef.current = newPath;
                  if (!newPath.length) goalRef.current = null;
                  stuckRef.current = 0;
                }
              }
              return p;
            }
            x = r.x; y = r.y;
            angle = Math.atan2(dirX, dirY);
          }
          if (x === p.x && y === p.y && angle === p.angle) return p;
          return { ...p, x, y, angle };
        }

        if (Math.abs(currentSpeed) > 0.01) {
          if (currentSpeed > 0) currentSpeed = Math.max(0, currentSpeed - decel * dt);
          else currentSpeed = Math.min(0, currentSpeed + decel * dt);
          const vx = Math.sin(angle) * currentSpeed;
          const vy = Math.cos(angle) * currentSpeed;
          const r = stepWithCollision(x, y, x + vx * dt, y + vy * dt);
          if (!r.blocked && (r.x !== x || r.y !== y)) return { ...p, x: r.x, y: r.y };
          currentSpeed = 0;
        }
        return p;
      });
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [chatOpen, setPlayer]);

  return { movePlayer, setPlayerDestination };
}
