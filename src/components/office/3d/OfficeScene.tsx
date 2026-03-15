import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Agent, Player } from "@/types/agent";
import type { RoomDef, FurnitureItem } from "@/data/officeMap";
import playerApeImg from "@/assets/player-ape.webp";
import { FurnitureModel } from "./FurnitureModels";

const STATUS_COLORS: Record<string, string> = {
  active: "#10B981", idle: "#F59E0B", thinking: "#6366F1", busy: "#EF4444",
};

const S = 0.5; // tile to world scale

// ── Neighboring building (city block filler) ──
function CityBuilding({ position, width, depth, height, color }: { position: [number, number, number]; width: number; depth: number; height: number; color: string }) {
  const windowRows = Math.floor(height / 0.5);
  const windowColsW = Math.floor(width / 0.6);
  const windowColsD = Math.floor(depth / 0.6);
  const darkColor = new THREE.Color(color).multiplyScalar(0.7).getStyle();
  
  return (
    <group position={position}>
      {/* Main structure */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, height + 0.03, 0]}>
        <boxGeometry args={[width + 0.08, 0.06, depth + 0.08]} />
        <meshStandardMaterial color="#2A2A2A" />
      </mesh>
      {/* Roof details */}
      {Math.random() > 0.5 && (
        <mesh position={[width * 0.2, height + 0.2, 0]}>
          <boxGeometry args={[0.15, 0.35, 0.15]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      )}
      {/* Windows on front face */}
      {Array.from({ length: windowRows }).map((_, row) =>
        Array.from({ length: windowColsW }).map((_, col) => {
          const lit = Math.random() > 0.35;
          return (
            <mesh key={`wf${row}-${col}`} position={[
              -width / 2 + 0.3 + col * (width / (windowColsW + 0.5)),
              0.4 + row * 0.5,
              depth / 2 + 0.01
            ]}>
              <boxGeometry args={[0.2, 0.28, 0.01]} />
              <meshStandardMaterial 
                color={lit ? "#FFE4A8" : "#1A1A2A"} 
                emissive={lit ? "#FFD060" : "#000"} 
                emissiveIntensity={lit ? 0.4 : 0} 
              />
            </mesh>
          );
        })
      )}
      {/* Windows on side face */}
      {Array.from({ length: windowRows }).map((_, row) =>
        Array.from({ length: windowColsD }).map((_, col) => {
          const lit = Math.random() > 0.4;
          return (
            <mesh key={`ws${row}-${col}`} position={[
              width / 2 + 0.01,
              0.4 + row * 0.5,
              -depth / 2 + 0.3 + col * (depth / (windowColsD + 0.5))
            ]}>
              <boxGeometry args={[0.01, 0.28, 0.2]} />
              <meshStandardMaterial 
                color={lit ? "#FFE4A8" : "#1A1A2A"} 
                emissive={lit ? "#FFD060" : "#000"} 
                emissiveIntensity={lit ? 0.3 : 0} 
              />
            </mesh>
          );
        })
      )}
      {/* Ledges */}
      {[0.3, 0.6, 0.85].map((frac) => (
        <mesh key={`ledge${frac}`} position={[0, height * frac, depth / 2 + 0.03]}>
          <boxGeometry args={[width + 0.06, 0.04, 0.06]} />
          <meshStandardMaterial color={darkColor} />
        </mesh>
      ))}
    </group>
  );
}

// ── Building with exterior (Sims-style city apartment cutaway) ──
function BuildingExterior({
  rooms,
  onFloorClick,
  clickEnabled,
}: {
  rooms: RoomDef[];
  onFloorClick?: (x: number, y: number) => void;
  clickEnabled?: boolean;
}) {
  const pad = 1.5;
  const minX = Math.min(...rooms.map((r) => r.x)) - pad;
  const minY = Math.min(...rooms.map((r) => r.y)) - pad;
  const maxX = Math.max(...rooms.map((r) => r.x + r.w)) + pad;
  const maxY = Math.max(...rooms.map((r) => r.y + r.h)) + pad;
  const bw = (maxX - minX) * S;
  const bh = (maxY - minY) * S;
  const cx = ((minX + maxX) / 2) * S;
  const cz = ((minY + maxY) / 2) * S;

  const foundH = 0.35;
  const wallH = 1.3;
  const wallT = 0.2;
  const brickColor = "#8B5E3C";
  const brickDark = "#6B4226";
  const brickLight = "#A07050";
  const trimColor = "#D4C4A8";
  const roofColor = "#2C2C34";
  const windowGlassLit = "#FFE4A8";
  const windowGlassDark = "#1A1A2A";
  const windowFrame = "#3A3028";

  const downRef = useRef<{ x: number; y: number; t: number; button: number } | null>(null);

  const handleFloorDown = (e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    downRef.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
      t: performance.now(),
      button: e.nativeEvent.button,
    };
  };

  const handleFloorUp = (e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    const down = downRef.current;
    downRef.current = null;
    if (!down) return;
    if (down.button !== 0) return;

    const dist = Math.hypot(e.nativeEvent.clientX - down.x, e.nativeEvent.clientY - down.y);
    const dt = performance.now() - down.t;
    if (dist > 6 || dt > 450) return;

    const tx = Math.floor(e.point.x / S + 0.5);
    const ty = Math.floor(e.point.z / S + 0.5);
    onFloorClick?.(tx, ty);
  };

  const northZ = cz - bh / 2;
  const southZ = cz + bh / 2;
  const westX = cx - bw / 2;
  const eastX = cx + bw / 2;

  // Brick pattern helper
  const brickLines = (count: number) => Array.from({ length: count }, (_, i) => (i + 1) / (count + 1));

  // Window generation
  const makeWindows = (axis: 'x' | 'z', fixedPos: number, wallStart: number, wallSpan: number, y: number, count: number) => {
    const spacing = wallSpan / (count + 1);
    return Array.from({ length: count }).map((_, i) => {
      const offset = wallStart + spacing * (i + 1);
      const lit = Math.random() > 0.3;
      const pos: [number, number, number] = axis === 'x' 
        ? [offset, y, fixedPos]
        : [fixedPos, y, offset];
      const frameSize: [number, number, number] = axis === 'x'
        ? [0.32, 0.36, 0.04]
        : [0.04, 0.36, 0.32];
      const glassSize: [number, number, number] = axis === 'x'
        ? [0.26, 0.3, 0.02]
        : [0.02, 0.3, 0.26];
      const glassOff: [number, number, number] = axis === 'x'
        ? [0, 0, 0.01]
        : [0.01, 0, 0];
      const sillSize: [number, number, number] = axis === 'x'
        ? [0.38, 0.03, 0.07]
        : [0.07, 0.03, 0.38];
      const sillOff: [number, number, number] = axis === 'x'
        ? [0, -0.2, 0.04]
        : [0.04, -0.2, 0];
      return (
        <group key={`w${axis}${i}-${fixedPos}`} position={pos}>
          <mesh><boxGeometry args={frameSize} /><meshStandardMaterial color={windowFrame} /></mesh>
          <mesh position={glassOff}><boxGeometry args={glassSize} /><meshStandardMaterial color={lit ? windowGlassLit : windowGlassDark} emissive={lit ? "#FFD060" : "#000"} emissiveIntensity={lit ? 0.3 : 0} /></mesh>
          <mesh position={sillOff}><boxGeometry args={sillSize} /><meshStandardMaterial color={trimColor} /></mesh>
        </group>
      );
    });
  };

  const nWinX = Math.floor(bw / 1.2);
  const nWinZ = Math.floor(bh / 1.2);
  const winY = foundH + wallH * 0.5;

  return (
    <group>
      {/* ── City ground / street ── */}
      <mesh position={[cx, -0.02, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#2A2A2A" />
      </mesh>
      {/* Sidewalk around building */}
      <mesh position={[cx, -0.01, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[bw + 4, bh + 4]} />
        <meshStandardMaterial color="#888880" />
      </mesh>
      {/* Street lane markings */}
      {[-15, -10, -5, 5, 10, 15].map((off, i) => (
        <mesh key={`lane${i}`} position={[cx + off * 1.5, -0.009, cz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 80]} />
          <meshBasicMaterial color="#555550" />
        </mesh>
      ))}

      {/* ── Foundation / Base ── */}
      <mesh position={[cx, foundH / 2, cz]}>
        <boxGeometry args={[bw + wallT * 2 + 0.1, foundH, bh + wallT * 2 + 0.1]} />
        <meshStandardMaterial color="#555048" roughness={0.95} />
      </mesh>
      {/* Foundation trim */}
      <mesh position={[cx, foundH + 0.02, cz]}>
        <boxGeometry args={[bw + wallT * 2 + 0.2, 0.04, bh + wallT * 2 + 0.2]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>

      {/* ── Interior floor (clickable warm wood) ── */}
      <mesh
        position={[cx, foundH + 0.001, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerDown={handleFloorDown}
        onPointerUp={handleFloorUp}
      >
        <planeGeometry args={[bw, bh]} />
        <meshStandardMaterial color="#9B7B55" roughness={0.85} />
      </mesh>
      {/* Wood plank lines */}
      {Array.from({ length: Math.ceil(bw / 0.5) + 1 }).map((_, i) => (
        <mesh key={`vl${i}`} raycast={() => null} position={[cx - bw / 2 + i * 0.5, foundH + 0.002, cz]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.012, bh]} /><meshBasicMaterial color="#7A6040" />
        </mesh>
      ))}

      {/* ── Exterior Brick Walls ── */}
      {/* North wall (back - full height, visible) */}
      <mesh position={[cx, foundH + wallH / 2, northZ - wallT / 2]}>
        <boxGeometry args={[bw + wallT * 2, wallH, wallT]} />
        <meshStandardMaterial color={brickColor} roughness={0.95} />
      </mesh>
      {/* Brick horizontal lines north */}
      {brickLines(8).map((frac) => (
        <mesh key={`bn${frac}`} position={[cx, foundH + wallH * frac, northZ - wallT / 2 - 0.001]} raycast={() => null}>
          <boxGeometry args={[bw + wallT * 2 + 0.01, 0.012, 0.01]} />
          <meshStandardMaterial color={brickDark} />
        </mesh>
      ))}
      {/* Vertical brick joints north */}
      {Array.from({ length: Math.floor(bw / 0.4) }).map((_, i) => (
        <mesh key={`bnv${i}`} position={[cx - bw / 2 + i * 0.4 + (i % 2 === 0 ? 0.1 : 0.3), foundH + wallH * 0.5, northZ - wallT / 2 - 0.001]} raycast={() => null}>
          <boxGeometry args={[0.01, wallH, 0.01]} />
          <meshStandardMaterial color={brickDark} />
        </mesh>
      ))}

      {/* West wall (left - full height) */}
      <mesh position={[westX - wallT / 2, foundH + wallH / 2, cz]}>
        <boxGeometry args={[wallT, wallH, bh + wallT * 2]} />
        <meshStandardMaterial color={brickDark} roughness={0.95} />
      </mesh>
      {/* Brick lines west */}
      {brickLines(8).map((frac) => (
        <mesh key={`bw${frac}`} position={[westX - wallT / 2 - 0.001, foundH + wallH * frac, cz]} raycast={() => null}>
          <boxGeometry args={[0.01, 0.012, bh + wallT * 2 + 0.01]} />
          <meshStandardMaterial color="#4A2E1A" />
        </mesh>
      ))}

      {/* South wall (front - cutaway, low wall for visibility) */}
      <mesh position={[cx, foundH + wallH * 0.2 / 2, southZ + wallT / 2]}>
        <boxGeometry args={[bw + wallT * 2, wallH * 0.2, wallT]} />
        <meshStandardMaterial color={brickColor} roughness={0.95} />
      </mesh>

      {/* East wall (right - partial cutaway) */}
      <mesh position={[eastX + wallT / 2, foundH + wallH * 0.3 / 2, cz]}>
        <boxGeometry args={[wallT, wallH * 0.3, bh + wallT * 2]} />
        <meshStandardMaterial color={brickDark} roughness={0.95} />
      </mesh>

      {/* ── Roof (partial cutaway - dark slate style like The Sims) ── */}
      {/* Back portion of roof (visible, sloped look) */}
      <mesh position={[cx, foundH + wallH + 0.04, northZ + bh * 0.15]}>
        <boxGeometry args={[bw + wallT * 2 + 0.3, 0.08, bh * 0.35]} />
        <meshStandardMaterial color={roofColor} roughness={0.8} />
      </mesh>
      {/* Roof edge trim */}
      <mesh position={[cx, foundH + wallH + 0.09, northZ + bh * 0.15 + bh * 0.175]}>
        <boxGeometry args={[bw + wallT * 2 + 0.4, 0.04, 0.08]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {/* Left roof strip */}
      <mesh position={[westX - wallT * 0.3, foundH + wallH + 0.04, cz]}>
        <boxGeometry args={[bw * 0.12, 0.08, bh + wallT * 2 + 0.3]} />
        <meshStandardMaterial color={roofColor} roughness={0.8} />
      </mesh>

      {/* ── Top trim / cornice (brownstone style) ── */}
      <mesh position={[cx, foundH + wallH, northZ - wallT / 2]}>
        <boxGeometry args={[bw + wallT * 2 + 0.3, 0.08, wallT + 0.15]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>
      <mesh position={[cx, foundH + wallH - 0.08, northZ - wallT / 2]}>
        <boxGeometry args={[bw + wallT * 2 + 0.25, 0.04, wallT + 0.12]} />
        <meshStandardMaterial color={brickLight} />
      </mesh>
      <mesh position={[westX - wallT / 2, foundH + wallH, cz]}>
        <boxGeometry args={[wallT + 0.15, 0.08, bh + wallT * 2 + 0.3]} />
        <meshStandardMaterial color={trimColor} />
      </mesh>

      {/* ── Baseboard (interior warm wood) ── */}
      <mesh position={[cx, foundH + 0.03, northZ + 0.04]}>
        <boxGeometry args={[bw, 0.06, 0.05]} /><meshStandardMaterial color="#6B5840" />
      </mesh>
      <mesh position={[westX + 0.04, foundH + 0.03, cz]}>
        <boxGeometry args={[0.05, 0.06, bh]} /><meshStandardMaterial color="#6B5840" />
      </mesh>

      {/* ── Windows on exterior walls ── */}
      {makeWindows('x', northZ - wallT - 0.001, cx - bw / 2, bw, winY, nWinX)}
      {makeWindows('z', westX - wallT - 0.001, cz - bh / 2, bh, winY, nWinZ)}

      {/* ── Warm hanging lights (BAYC bar / clubhouse) ── */}
      {Array.from({ length: 12 }).map((_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const bulbColors = ["#FFB347", "#FF6B6B", "#4ECDC4", "#FFE66D", "#FF6BB5", "#6BCB77"];
        const bc = bulbColors[i % bulbColors.length];
        const lx = cx - bw * 0.35 + col * (bw * 0.24);
        const lz = cz - bh * 0.3 + row * (bh * 0.3);
        return (
          <group key={`cl${i}`}>
            <mesh position={[lx, foundH + wallH - 0.1, lz]}>
              <cylinderGeometry args={[0.004, 0.004, 0.18, 4]} />
              <meshBasicMaterial color="#333" />
            </mesh>
            <mesh position={[lx, foundH + wallH - 0.22, lz]}>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshStandardMaterial color={bc} emissive={bc} emissiveIntensity={1.0} />
            </mesh>
            <pointLight position={[lx, foundH + wallH - 0.25, lz]} intensity={0.12} distance={3.5} color={bc} />
          </group>
        );
      })}

      {/* ── String lights along north wall (party bunting) ── */}
      {Array.from({ length: 25 }).map((_, i) => {
        const t = i / 24;
        const lx = cx - bw * 0.45 + t * bw * 0.9;
        const ly = foundH + wallH - 0.06;
        const lz = northZ + wallT * 0.6;
        const sag = Math.sin(t * Math.PI) * 0.12;
        const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#FF6BB5", "#6BCB77"];
        return (
          <mesh key={`sl${i}`} position={[lx, ly - sag, lz]}>
            <sphereGeometry args={[0.018, 6, 6]} />
            <meshStandardMaterial color={colors[i % 5]} emissive={colors[i % 5]} emissiveIntensity={1.5} />
          </mesh>
        );
      })}
      {/* Bunting flags along north wall */}
      {Array.from({ length: 15 }).map((_, i) => {
        const t = (i + 0.5) / 15;
        const lx = cx - bw * 0.42 + t * bw * 0.84;
        const ly = foundH + wallH - 0.14 - Math.sin(t * Math.PI) * 0.08;
        const lz = northZ + wallT * 0.7;
        const flagColors = ["#FF4444", "#FFAA00", "#44BB44", "#4488FF", "#FF44FF"];
        return (
          <mesh key={`flag${i}`} position={[lx, ly, lz]} rotation={[0.2, 0, Math.sin(i) * 0.3]}>
            <boxGeometry args={[0.06, 0.08, 0.005]} />
            <meshStandardMaterial color={flagColors[i % flagColors.length]} />
          </mesh>
        );
      })}

      {/* ── Neon sign on north wall ── */}
      <mesh position={[cx, foundH + wallH * 0.7, northZ + wallT * 0.6]}>
        <boxGeometry args={[1.4, 0.35, 0.02]} />
        <meshStandardMaterial color="#1A1A1A" />
      </mesh>
      <mesh position={[cx, foundH + wallH * 0.7, northZ + wallT * 0.62]}>
        <boxGeometry args={[1.3, 0.28, 0.01]} />
        <meshStandardMaterial color="#FF6B00" emissive="#FF6B00" emissiveIntensity={1.8} transparent opacity={0.9} />
      </mesh>
      <pointLight position={[cx, foundH + wallH * 0.7, northZ + wallT + 0.4]} intensity={0.35} distance={5} color="#FF6B00" />

      {/* ── Neighboring city buildings ── */}
      {/* Behind (north) */}
      <CityBuilding position={[cx - 6, 0, northZ - 5]} width={4} depth={3} height={4.5} color="#7A6B5A" />
      <CityBuilding position={[cx + 2, 0, northZ - 6]} width={5} depth={3.5} height={6} color="#6B5A4A" />
      <CityBuilding position={[cx + 9, 0, northZ - 4.5]} width={3.5} depth={3} height={3.5} color="#8A7A6A" />
      <CityBuilding position={[cx - 12, 0, northZ - 7]} width={4.5} depth={4} height={5.5} color="#5A4A3A" />
      {/* Left (west) */}
      <CityBuilding position={[westX - 5, 0, cz - 4]} width={3} depth={4} height={5} color="#6A5848" />
      <CityBuilding position={[westX - 4.5, 0, cz + 3]} width={3.5} depth={3.5} height={3.8} color="#7A6858" />
      {/* Right (east) */}
      <CityBuilding position={[eastX + 5, 0, cz - 2]} width={4} depth={3.5} height={4.2} color="#5A5040" />
      <CityBuilding position={[eastX + 4, 0, cz + 5]} width={3} depth={4} height={5.5} color="#6A6050" />
      {/* Behind far */}
      <CityBuilding position={[cx - 3, 0, northZ - 12]} width={6} depth={4} height={8} color="#5A4A3A" />
      <CityBuilding position={[cx + 8, 0, northZ - 11]} width={5} depth={3} height={7} color="#6A5848" />
      {/* Far sides */}
      <CityBuilding position={[westX - 10, 0, cz]} width={4} depth={5} height={6.5} color="#4A4038" />
      <CityBuilding position={[eastX + 10, 0, cz + 2]} width={5} depth={4} height={5} color="#5A5040" />

      {/* ── Street lights ── */}
      {[[-3, 1], [3, 1], [-3, -1], [3, -1]].map(([ox, oz], i) => (
        <group key={`streetlight${i}`} position={[cx + ox * (bw / 2 + 1.5), 0, cz + oz * (bh / 2 + 1.5)]}>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.02, 0.03, 1.6, 6]} />
            <meshStandardMaterial color="#333" metalness={0.6} />
          </mesh>
          <mesh position={[0, 1.65, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#FFE8A0" emissive="#FFD060" emissiveIntensity={1.5} />
          </mesh>
          <pointLight position={[0, 1.6, 0]} intensity={0.3} distance={4} color="#FFD060" />
        </group>
      ))}
    </group>
  );
}

// ── Room 3D ──
function Room3D({
  room,
  onFloorClick,
  clickEnabled,
}: {
  room: RoomDef;
  onFloorClick?: (x: number, y: number) => void;
  clickEnabled?: boolean;
}) {
  const w = room.w * S;
  const h = room.h * S;
  const x = room.x * S + w / 2;
  const z = room.y * S + h / 2;
  const wallH = 0.75;
  const wallT = 0.08;

  const downRef = useRef<{ x: number; y: number; t: number; button: number } | null>(null);

  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    downRef.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
      t: performance.now(),
      button: e.nativeEvent.button,
    };
  };

  const handleUp = (e: ThreeEvent<PointerEvent>) => {
    if (!clickEnabled) return;
    const down = downRef.current;
    downRef.current = null;
    if (!down) return;
    if (down.button !== 0) return;

    const dist = Math.hypot(e.nativeEvent.clientX - down.x, e.nativeEvent.clientY - down.y);
    const dt = performance.now() - down.t;
    if (dist > 6 || dt > 450) return;

    const tx = Math.floor(e.point.x / S + 0.5);
    const ty = Math.floor(e.point.z / S + 0.5);
    onFloorClick?.(tx, ty);
  };

  return (
    <group position={[x, 0, z]}>
      {/* Room floor */}
      <mesh
        position={[0, 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerDown={handleDown}
        onPointerUp={handleUp}
      >
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={room.floorColor} />
      </mesh>
      {room.carpetColor && (
        <mesh
          position={[0, 0.006, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerDown={handleDown}
          onPointerUp={handleUp}
        >
          <planeGeometry args={[w * 0.7, h * 0.7]} />
          <meshStandardMaterial color={room.carpetColor} />
        </mesh>
      )}

      {/* Room walls */}
      {/* Back */}
      <mesh position={[0, wallH / 2, -h / 2]}>
        <boxGeometry args={[w + wallT, wallH, wallT]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Left */}
      <mesh position={[-w / 2, wallH / 2, 0]}>
        <boxGeometry args={[wallT, wallH, h + wallT]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Right */}
      <mesh position={[w / 2, wallH / 2, 0]}>
        <boxGeometry args={[wallT, wallH, h + wallT]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Front - door opening in center */}
      {(() => {
        const doorW = 0.5;
        const sideW = (w - doorW) / 2;
        return (
          <>
            <mesh position={[-(doorW / 2 + sideW / 2), wallH / 2, h / 2]}>
              <boxGeometry args={[sideW, wallH, wallT]} />
              <meshStandardMaterial color={room.wallColor} />
            </mesh>
            <mesh position={[(doorW / 2 + sideW / 2), wallH / 2, h / 2]}>
              <boxGeometry args={[sideW, wallH, wallT]} />
              <meshStandardMaterial color={room.wallColor} />
            </mesh>
            {/* Door frame top */}
            <mesh position={[0, wallH - 0.05, h / 2]}>
              <boxGeometry args={[doorW + 0.06, 0.05, wallT + 0.02]} />
              <meshStandardMaterial color="#5C4033" />
            </mesh>
          </>
        );
      })()}

      {/* Room name neon sign on back wall */}
      <mesh position={[0, wallH - 0.12, -h / 2 + wallT / 2 + 0.001]}>
        <planeGeometry args={[Math.min(w * 0.6, 1.2), 0.15]} />
        <meshStandardMaterial color="#1A1A1A" />
      </mesh>
      <Html position={[0, wallH - 0.12, -h / 2 + wallT / 2 + 0.01]} center>
        <div className="px-2 py-0.5 text-[9px] font-bold whitespace-nowrap pointer-events-none select-none" style={{ fontFamily: "monospace", color: "#00CED1", textShadow: "0 0 8px #00CED1" }}>
          {room.name}
        </div>
      </Html>
    </group>
  );
}

// ── Character base (shared between agents and player) ──
function useWalkAnimation(
  ref: React.RefObject<THREE.Group | null>,
  leftLeg: React.RefObject<THREE.Mesh | null>,
  rightLeg: React.RefObject<THREE.Mesh | null>,
  leftArm: React.RefObject<THREE.Mesh | null>,
  rightArm: React.RefObject<THREE.Mesh | null>,
  targetX: number,
  targetZ: number,
  smoothPos: React.MutableRefObject<THREE.Vector3>,
  prevPos: React.MutableRefObject<{ x: number; z: number }>,
  lerpSpeed = 0.15
) {
  useFrame(() => {
    if (!ref.current) return;

    smoothPos.current.x += (targetX - smoothPos.current.x) * lerpSpeed;
    smoothPos.current.z += (targetZ - smoothPos.current.z) * lerpSpeed;

    const dx = Math.abs(targetX - smoothPos.current.x);
    const dz = Math.abs(targetZ - smoothPos.current.z);
    const moving = dx > 0.005 || dz > 0.005;

    ref.current.position.set(smoothPos.current.x, 0, smoothPos.current.z);

    // Walking bounce or idle bob
    if (moving) {
      ref.current.position.y = Math.abs(Math.sin(Date.now() * 0.015)) * 0.025;
    } else {
      ref.current.position.y = Math.sin(Date.now() * 0.003) * 0.008;
    }

    // Leg & arm swing
    const swing = moving ? Math.sin(Date.now() * 0.016) * 0.5 : 0;
    if (leftLeg.current) leftLeg.current.rotation.x = moving ? swing : leftLeg.current.rotation.x * 0.85;
    if (rightLeg.current) rightLeg.current.rotation.x = moving ? -swing : rightLeg.current.rotation.x * 0.85;
    if (leftArm.current) leftArm.current.rotation.x = moving ? -swing * 0.5 : leftArm.current.rotation.x * 0.85;
    if (rightArm.current) rightArm.current.rotation.x = moving ? swing * 0.5 : rightArm.current.rotation.x * 0.85;

    // Face direction
    if (targetX !== prevPos.current.x || targetZ !== prevPos.current.z) {
      const dirX = targetX - prevPos.current.x;
      const dirZ = targetZ - prevPos.current.z;
      if (Math.abs(dirX) > 0.001 || Math.abs(dirZ) > 0.001) {
        const angle = Math.atan2(dirX, dirZ);
        // Smooth rotation
        let diff = angle - ref.current.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        ref.current.rotation.y += diff * 0.12;
      }
      prevPos.current = { x: targetX, z: targetZ };
    }
  });
}

// ── Agent 3D ──
function Agent3D({ agent, selected, onClick }: { agent: Agent; selected?: boolean; onClick: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const smoothPos = useRef(new THREE.Vector3(agent.x * S, 0, agent.y * S));
  const prevPos = useRef({ x: agent.x * S, z: agent.y * S });
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);

  useWalkAnimation(ref, leftLeg, rightLeg, leftArm, rightArm, agent.x * S, agent.y * S, smoothPos, prevPos, 0.1);

  return (
    <group
      ref={ref}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; }}
    >
      {/* Body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.22, 0.28, 0.14]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.47, 0]} castShadow>
        <boxGeometry args={[0.18, 0.18, 0.16]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 0.47, 0.081]}>
        <boxGeometry args={[0.14, 0.08, 0.01]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Eyes */}
      {[-0.035, 0.035].map((ox, i) => (
        <mesh key={i} position={[ox, 0.48, 0.09]}>
          <boxGeometry args={[0.035, 0.035, 0.01]} />
          <meshStandardMaterial
            color={agent.status === "thinking" ? "#6366F1" : "#00FF88"}
            emissive={agent.status === "thinking" ? "#6366F1" : "#00FF88"}
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}
      {/* Arms */}
      <mesh ref={leftArm} position={[-0.14, 0.24, 0]}>
        <boxGeometry args={[0.05, 0.18, 0.07]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      <mesh ref={rightArm} position={[0.14, 0.24, 0]}>
        <boxGeometry args={[0.05, 0.18, 0.07]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      {/* Antenna + LED */}
      <mesh position={[0, 0.61, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.1, 6]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      <mesh position={[0, 0.67, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color={STATUS_COLORS[agent.status]} emissive={STATUS_COLORS[agent.status]} emissiveIntensity={1.8} />
      </mesh>
      {/* Legs */}
      <mesh ref={leftLeg} position={[-0.055, 0.06, 0]}>
        <boxGeometry args={[0.07, 0.12, 0.09]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      <mesh ref={rightLeg} position={[0.055, 0.06, 0]}>
        <boxGeometry args={[0.07, 0.12, 0.09]} />
        <meshStandardMaterial color={agent.color} />
      </mesh>
      {/* Shadow */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.14, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.12} />
      </mesh>
      {/* Selection ring */}
      {(selected || hovered) && (
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.26, 32]} />
          <meshBasicMaterial color={selected ? "#6366F1" : "#90CAF9"} transparent opacity={0.7} />
        </mesh>
      )}
      {/* Name tag */}
      <Html position={[0, 0.82, 0]} center>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-[rgba(20,20,30,0.9)] rounded-full whitespace-nowrap pointer-events-none select-none">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[agent.status] }} />
          <span className="text-[9px] text-white font-bold">{agent.name}</span>
        </div>
      </Html>
    </group>
  );
}

// ── Walking dust particles ──
function WalkingDust({ player }: { player: Player }) {
  const particles = useRef<THREE.InstancedMesh>(null);
  const dataRef = useRef<{ positions: Float32Array; velocities: Float32Array; lifetimes: Float32Array; spawnTimer: number }>({
    positions: new Float32Array(30 * 3),
    velocities: new Float32Array(30 * 3),
    lifetimes: new Float32Array(30).fill(-1),
    spawnTimer: 0,
  });
  const prevPos = useRef({ x: player.x, y: player.y });
  const dummy = useRef(new THREE.Object3D());
  const color = useRef(new THREE.Color("#C8B898"));

  useFrame((_, delta) => {
    if (!particles.current) return;
    const d = dataRef.current;
    const dt = Math.min(delta, 0.05);

    const dx = player.x - prevPos.current.x;
    const dy = player.y - prevPos.current.y;
    const speed = Math.hypot(dx, dy);
    prevPos.current = { x: player.x, y: player.y };

    // Spawn particles when moving
    if (speed > 0.01) {
      d.spawnTimer += dt;
      if (d.spawnTimer > 0.06) {
        d.spawnTimer = 0;
        for (let i = 0; i < 30; i++) {
          if (d.lifetimes[i] <= 0) {
            d.positions[i * 3] = player.x * S + (Math.random() - 0.5) * 0.08;
            d.positions[i * 3 + 1] = 0.02;
            d.positions[i * 3 + 2] = player.y * S + (Math.random() - 0.5) * 0.08;
            d.velocities[i * 3] = (Math.random() - 0.5) * 0.3;
            d.velocities[i * 3 + 1] = Math.random() * 0.4 + 0.1;
            d.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
            d.lifetimes[i] = 0.4 + Math.random() * 0.3;
            break;
          }
        }
      }
    }

    // Update all particles
    for (let i = 0; i < 30; i++) {
      if (d.lifetimes[i] > 0) {
        d.lifetimes[i] -= dt;
        d.positions[i * 3] += d.velocities[i * 3] * dt;
        d.positions[i * 3 + 1] += d.velocities[i * 3 + 1] * dt;
        d.positions[i * 3 + 2] += d.velocities[i * 3 + 2] * dt;
        d.velocities[i * 3 + 1] -= 0.5 * dt; // gravity

        const life = Math.max(0, d.lifetimes[i]);
        const scale = life * 0.06;
        dummy.current.position.set(d.positions[i * 3], d.positions[i * 3 + 1], d.positions[i * 3 + 2]);
        dummy.current.scale.setScalar(scale);
      } else {
        dummy.current.scale.setScalar(0);
        dummy.current.position.set(0, -10, 0);
      }
      dummy.current.updateMatrix();
      particles.current.setMatrixAt(i, dummy.current.matrix);
    }
    particles.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={particles} args={[undefined, undefined, 30]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={color.current} transparent opacity={0.5} />
    </instancedMesh>
  );
}

// ── Player 3D (Voxel Bored Ape - 3D model) ──
function Player3D({ player, config }: { player: Player; config?: { color: string; skinTone?: string } }) {
  const ref = useRef<THREE.Group>(null);
  const smoothPos = useRef(new THREE.Vector3(player.x * S, 0, player.y * S));
  const smoothAngle = useRef(player.angle);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const prevPos = useRef({ x: player.x, y: player.y });

  const furColor = "#5C3A1E";
  const faceColor = "#C4A882";
  const sweaterColor = "#3B5DC9";
  const glassesColor = "#2ECC40";
  const earringColor = "#FFD700";

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.05);
    const tx = player.x * S;
    const tz = player.y * S;
    const posFactor = 1 - Math.exp(-18 * dt);
    const rotFactor = 1 - Math.exp(-14 * dt);

    smoothPos.current.x += (tx - smoothPos.current.x) * posFactor;
    smoothPos.current.z += (tz - smoothPos.current.z) * posFactor;
    if (Math.abs(tx - smoothPos.current.x) < 0.0005) smoothPos.current.x = tx;
    if (Math.abs(tz - smoothPos.current.z) < 0.0005) smoothPos.current.z = tz;

    const speed = Math.hypot(player.x - prevPos.current.x, player.y - prevPos.current.y);
    const moving = speed > 0.001;
    prevPos.current = { x: player.x, y: player.y };

    ref.current.position.set(smoothPos.current.x, 0, smoothPos.current.z);
    if (moving) {
      ref.current.position.y = Math.abs(Math.sin(Date.now() * 0.015)) * 0.025;
    } else {
      ref.current.position.y = Math.sin(Date.now() * 0.003) * 0.008;
    }

    let diff = player.angle - smoothAngle.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    smoothAngle.current += diff * rotFactor;
    ref.current.rotation.y = smoothAngle.current;

    const swing = moving ? Math.sin(Date.now() * 0.016) * 0.5 : 0;
    const dampFactor = 1 - Math.exp(-8 * dt);
    if (leftLeg.current) leftLeg.current.rotation.x += ((moving ? swing : 0) - leftLeg.current.rotation.x) * dampFactor;
    if (rightLeg.current) rightLeg.current.rotation.x += ((moving ? -swing : 0) - rightLeg.current.rotation.x) * dampFactor;
    if (leftArm.current) leftArm.current.rotation.x += ((moving ? -swing * 0.5 : 0) - leftArm.current.rotation.x) * dampFactor;
    if (rightArm.current) rightArm.current.rotation.x += ((moving ? swing * 0.5 : 0) - rightArm.current.rotation.x) * dampFactor;
  });

  return (
    <group ref={ref}>
      {/* Legs */}
      <mesh ref={leftLeg} position={[-0.055, 0.06, 0]}>
        <boxGeometry args={[0.07, 0.12, 0.08]} />
        <meshStandardMaterial color="#2D3748" />
      </mesh>
      <mesh ref={rightLeg} position={[0.055, 0.06, 0]}>
        <boxGeometry args={[0.07, 0.12, 0.08]} />
        <meshStandardMaterial color="#2D3748" />
      </mesh>
      {/* Body (blue sweater) */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.26, 0.26, 0.15]} />
        <meshStandardMaterial color={sweaterColor} />
      </mesh>
      {/* Sweater logo */}
      <mesh position={[0, 0.23, 0.076]}>
        <circleGeometry args={[0.04, 8]} />
        <meshStandardMaterial color={glassesColor} />
      </mesh>
      {/* Arms */}
      <mesh ref={leftArm} position={[-0.165, 0.24, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.08]} />
        <meshStandardMaterial color={sweaterColor} />
      </mesh>
      <mesh ref={rightArm} position={[0.165, 0.24, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.08]} />
        <meshStandardMaterial color={sweaterColor} />
      </mesh>
      {/* Hands */}
      <mesh position={[-0.165, 0.13, 0]}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      <mesh position={[0.165, 0.13, 0]}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.47, 0]} castShadow>
        <boxGeometry args={[0.22, 0.22, 0.2]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      <mesh position={[0, 0.56, -0.02]}>
        <boxGeometry args={[0.2, 0.06, 0.14]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      {/* Muzzle */}
      <mesh position={[0, 0.43, 0.1]}>
        <boxGeometry args={[0.16, 0.14, 0.06]} />
        <meshStandardMaterial color={faceColor} />
      </mesh>
      {[-0.025, 0.025].map((ox, i) => (
        <mesh key={`n${i}`} position={[ox, 0.42, 0.135]}>
          <boxGeometry args={[0.02, 0.02, 0.01]} />
          <meshStandardMaterial color="#3A2510" />
        </mesh>
      ))}
      {/* Green glasses */}
      <mesh position={[0, 0.49, 0.11]}>
        <boxGeometry args={[0.22, 0.06, 0.02]} />
        <meshStandardMaterial color={glassesColor} />
      </mesh>
      <mesh position={[-0.055, 0.49, 0.12]}>
        <boxGeometry args={[0.07, 0.04, 0.01]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.055, 0.49, 0.12]}>
        <boxGeometry args={[0.07, 0.04, 0.01]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Lens glare */}
      <mesh position={[-0.04, 0.495, 0.126]}>
        <boxGeometry args={[0.02, 0.02, 0.005]} />
        <meshStandardMaterial color="#FFF" emissive="#FFF" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.07, 0.495, 0.126]}>
        <boxGeometry args={[0.02, 0.02, 0.005]} />
        <meshStandardMaterial color="#FFF" emissive="#FFF" emissiveIntensity={0.3} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.14, 0.48, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.06]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      <mesh position={[-0.14, 0.48, 0]}>
        <boxGeometry args={[0.03, 0.05, 0.04]} />
        <meshStandardMaterial color={faceColor} />
      </mesh>
      <mesh position={[0.14, 0.48, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.06]} />
        <meshStandardMaterial color={furColor} />
      </mesh>
      <mesh position={[0.14, 0.48, 0]}>
        <boxGeometry args={[0.03, 0.05, 0.04]} />
        <meshStandardMaterial color={faceColor} />
      </mesh>
      {/* Gold earring */}
      <mesh position={[-0.17, 0.44, 0]}>
        <torusGeometry args={[0.02, 0.005, 6, 8]} />
        <meshStandardMaterial color={earringColor} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Shadow */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.16, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.18} />
      </mesh>
      {/* Crown */}
      <Html position={[0, 0.68, 0]} center>
        <span className="text-sm select-none pointer-events-none">👑</span>
      </Html>
      {/* Name tag */}
      <Html position={[0, 0.8, 0]} center>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none select-none" style={{ backgroundColor: sweaterColor }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span className="text-[9px] text-white font-bold">{player.name}</span>
        </div>
      </Html>
    </group>
  );
}

// ── Camera target tracker (single-stage, delta-time based) ──
function CameraTarget({ player, controlsRef }: { player: Player; controlsRef: React.RefObject<any> }) {
  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    const dt = Math.min(delta, 0.05);
    const factor = 1 - Math.exp(-8 * dt); // Smooth but responsive

    const px = player.x * S;
    const pz = player.y * S;
    const target = controlsRef.current.target;

    target.x += (px - target.x) * factor;
    target.z += (pz - target.z) * factor;
    // Keep y at ground level
    target.y += (0 - target.y) * factor;
  });

  return null;
}

// ── Main Scene ──
interface OfficeSceneProps {
  agents: Agent[];
  player: Player;
  rooms: RoomDef[];
  furniture: FurnitureItem[];
  playerConfig?: { color: string; hairStyle?: string; outfitStyle?: string; skinTone?: string; accessory?: string };
  selectedAgentId?: string;
  onAgentClick: (agent: Agent) => void;
  editMode?: boolean;
  selectedFurnitureId?: string | null;
  hoveredFurnitureId?: string | null;
  onFurnitureClick?: (id: string) => void;
  onFurnitureHover?: (id: string | null) => void;
  onMapClick?: (x: number, y: number) => void;
}

function ControlsUpdater({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  useFrame(() => {
    controlsRef.current?.update();
  });
  return null;
}

export function OfficeScene({
  agents,
  player,
  rooms,
  furniture,
  playerConfig,
  selectedAgentId,
  onAgentClick,
  editMode,
  selectedFurnitureId,
  hoveredFurnitureId,
  onFurnitureClick,
  onFurnitureHover,
  onMapClick,
}: OfficeSceneProps) {
  const controlsRef = useRef<any>(null);

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        style={{ touchAction: "none" }}
        camera={{ position: [14, 12, 14], fov: 35, near: 0.1, far: 100 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        {/* City night atmosphere */}
        <color attach="background" args={["#0A0A14"]} />
        <fog attach="fog" args={["#0A0A14", 30, 60]} />

        {/* Warm interior lighting */}
        <ambientLight intensity={0.55} color="#FFE8C8" />
        <directionalLight
          position={[10, 20, 8]}
          intensity={0.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          color="#FFE0B0"
        />
        {/* Moonlight from above-right */}
        <directionalLight position={[-8, 15, -6]} intensity={0.15} color="#8899CC" />
        {/* Warm interior fill */}
        <directionalLight position={[5, 8, 12]} intensity={0.4} color="#FFD090" />
        <hemisphereLight args={["#1A1A30", "#4A3520", 0.25]} />

        {/* Camera controls - mouse drag rotate, wheel zoom, right-drag pan; works on trackpad wheel for zoom */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          enablePan
          enableZoom
          enableRotate
          minDistance={3}
          maxDistance={22}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.6}
          minAzimuthAngle={-Math.PI}
          maxAzimuthAngle={Math.PI}
          zoomSpeed={0.9}
          rotateSpeed={0.7}
          panSpeed={0.75}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
          target={[player.x * S, 0, player.y * S]}
        />
        <ControlsUpdater controlsRef={controlsRef} />
        <CameraTarget player={player} controlsRef={controlsRef} />

        {/* Building (click-to-move) */}
        <BuildingExterior
          rooms={rooms}
          clickEnabled={!editMode}
          onFloorClick={(x, y) => onMapClick?.(x, y)}
        />

        {/* All interior objects raised by foundation height */}
        <group position={[0, 0.25, 0]}>
          {/* Rooms */}
          {rooms.map((room) => (
            <Room3D
              key={room.id}
              room={room}
              clickEnabled={!editMode}
              onFloorClick={(x, y) => onMapClick?.(x, y)}
            />
          ))}

          {/* Furniture */}
          {furniture.map(f => (
            <FurnitureModel
              key={f.id}
              type={f.type}
              position={[f.x * S, 0, f.y * S]}
              editMode={editMode}
              selected={selectedFurnitureId === f.id}
              hovered={hoveredFurnitureId === f.id}
              onClick={() => onFurnitureClick?.(f.id)}
              onPointerOver={() => onFurnitureHover?.(f.id)}
              onPointerOut={() => onFurnitureHover?.(null)}
            />
          ))}

          {/* Agents */}
          {agents.map(agent => (
            <Agent3D
              key={agent.id}
              agent={agent}
              selected={agent.id === selectedAgentId}
              onClick={() => onAgentClick(agent)}
            />
          ))}

          {/* Player */}
          <Player3D player={player} config={playerConfig} />

          {/* Walking dust particles */}
          <WalkingDust player={player} />
        </group>
      </Canvas>
    </div>
  );
}
