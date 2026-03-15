import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useDayNight } from "@/hooks/useDayNight";
import { useCityBuildings } from "@/hooks/useCityBuildings";
import { Vehicle3D } from "@/components/city/Vehicle3D";
import type { CityBuilding } from "@/types/building";
import { STYLE_TRANSPORT_MAP } from "@/types/building";

// ── District data ──
const DISTRICTS = [
  { name: "Praça Central", emoji: "🏛️", x: 0, z: 0, radius: 5, color: "#10B981" },
  { name: "Distrito Criativo", emoji: "🎨", x: -14, z: -8, radius: 4, color: "#F59E0B" },
  { name: "Distrito Inovação", emoji: "🔬", x: 14, z: -8, radius: 4, color: "#6366F1" },
  { name: "Distrito Comércio", emoji: "🛍️", x: -14, z: 10, radius: 4, color: "#EF4444" },
  { name: "Distrito Social", emoji: "☕", x: 14, z: 10, radius: 4, color: "#EC4899" },
];

// ── Static building defs (reduced) ──
const CITY_BUILDINGS = [
  { x: -18, z: -12, w: 3.5, d: 3, h: 2.8, color: "#8B6B3A" },
  { x: -12, z: -12, w: 3, d: 2.5, h: 2.2, color: "#7A5A3A" },
  { x: -18, z: -6, w: 3, d: 3, h: 3, color: "#6B5A4A" },
  { x: -12, z: -6, w: 2.8, d: 2.8, h: 2.5, color: "#8A7A5A" },
  { x: 12, z: -12, w: 3.5, d: 3, h: 3.5, color: "#3A4A6A" },
  { x: 18, z: -12, w: 3, d: 2.5, h: 2.8, color: "#4A5A7A" },
  { x: 12, z: -6, w: 3, d: 3, h: 2.5, color: "#5A6A8A" },
  { x: 18, z: -6, w: 2.8, d: 2.8, h: 3.2, color: "#4A5A6A" },
  { x: -18, z: 8, w: 3.5, d: 3, h: 2.5, color: "#6A4A3A" },
  { x: -12, z: 8, w: 3, d: 2.5, h: 2.2, color: "#7A5A4A" },
  { x: -18, z: 14, w: 3, d: 3, h: 2.8, color: "#8A6A4A" },
  { x: -12, z: 14, w: 2.5, d: 2.5, h: 2, color: "#9A7A5A" },
  { x: 12, z: 8, w: 3.5, d: 3, h: 2.2, color: "#5A4A4A" },
  { x: 18, z: 8, w: 3, d: 2.5, h: 2.5, color: "#6A5A5A" },
  { x: 12, z: 14, w: 3, d: 3, h: 2.8, color: "#4A5A5A" },
  { x: 18, z: 14, w: 2.8, d: 2.8, h: 2, color: "#5A6A5A" },
  { x: -6, z: -14, w: 3, d: 2.5, h: 3, color: "#5A5A3A" },
  { x: 0, z: -14, w: 3.5, d: 3, h: 3.5, color: "#6A6A4A" },
  { x: 6, z: -14, w: 3, d: 2.5, h: 2.8, color: "#4A4A5A" },
  { x: -6, z: 18, w: 3, d: 2.5, h: 2.2, color: "#5A4A5A" },
  { x: 0, z: 18, w: 3.5, d: 3, h: 2.5, color: "#6A5A4A" },
  { x: 6, z: 18, w: 3, d: 2.5, h: 2, color: "#7A6A5A" },
];

// ── NPC data (reduced to 6) ──
const NPC_DATA = [
  { x: 2, z: 1, color: "#7A6B8A", name: "Kaori" },
  { x: -2, z: -1, color: "#8A7B6A", name: "Atlas" },
  { x: 0, z: 3, color: "#6B8A7A", name: "Nova" },
  { x: -10, z: -3, color: "#9A7A6A", name: "Corretor" },
  { x: 8, z: 5, color: "#6A9A8A", name: "Turista" },
  { x: 5, z: -5, color: "#6A8A9A", name: "Músico" },
];

// ── Lightweight static building (NO Html, NO Text) ──
function StaticBuilding({ x, z, w, d, h, color }: { x: number; z: number; w: number; d: number; h: number; color: string }) {
  const windowRows = Math.floor(h / 0.5);
  const windowCols = Math.max(1, Math.floor(w / 0.8));

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, h + 0.03, 0]}>
        <boxGeometry args={[w + 0.1, 0.06, d + 0.1]} />
        <meshStandardMaterial color="#2A2A2A" />
      </mesh>
      {/* Simplified windows - front face only, fewer */}
      {Array.from({ length: Math.min(windowRows, 4) }).map((_, ri) =>
        Array.from({ length: Math.min(windowCols, 3) }).map((_, ci) => (
          <mesh key={`w${ri}-${ci}`} position={[
            -w / 2 + 0.35 + ci * (w / (windowCols + 0.5)),
            0.4 + ri * 0.5,
            d / 2 + 0.01
          ]}>
            <boxGeometry args={[0.2, 0.26, 0.01]} />
            <meshStandardMaterial color="#FFE4A8" emissive="#FFD060" emissiveIntensity={0.5} />
          </mesh>
        ))
      )}
      <mesh position={[0, 0.35, d / 2 + 0.01]}>
        <boxGeometry args={[0.4, 0.7, 0.02]} />
        <meshStandardMaterial color="#3A2A1A" />
      </mesh>
    </group>
  );
}

// ── Lightweight dynamic building (NO Html labels, NO Text neon) ──
function LightBuilding3D({ building, highlighted }: { building: CityBuilding; highlighted?: boolean }) {
  const h = building.height;
  const w = 2.2;
  const color = building.primaryColor;

  return (
    <group position={[building.coordinates.x, 0, building.coordinates.z]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial
          color={color}
          emissive={highlighted ? color : "#000000"}
          emissiveIntensity={highlighted ? 0.3 : 0}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>
      {/* Roof */}
      <mesh position={[0, h + 0.15, 0]}>
        <boxGeometry args={[w + 0.3, 0.3, w + 0.3]} />
        <meshStandardMaterial color={building.secondaryColor} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Simplified windows - 2 per floor, front only */}
      {Array.from({ length: Math.min(building.floors, 5) }).map((_, floor) => (
        <group key={floor}>
          {[-0.4, 0.4].map((ox, i) => (
            <mesh key={i} position={[ox, 1 + floor * (h / building.floors), w / 2 + 0.01]}>
              <planeGeometry args={[0.3, 0.35]} />
              <meshStandardMaterial emissive="#FFD060" emissiveIntensity={0.6} color="black" />
            </mesh>
          ))}
        </group>
      ))}
      {/* Highlight ring */}
      {highlighted && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[w, w + 0.5, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

// ── Simplified Plaza (fewer meshes) ──
function CityPlaza() {
  return (
    <group>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#B0A890" roughness={0.75} />
      </mesh>
      {/* Fountain */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.9, 1, 0.24, 12]} />
        <meshStandardMaterial color="#6B6B78" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.06, 12]} />
        <meshStandardMaterial color="#3A80B0" transparent opacity={0.55} roughness={0.05} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
        <meshStandardMaterial color="#8A8A98" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#C0A870" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* 4 trees */}
      {[[-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5]].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.07, 0.1, 1, 4]} />
            <meshStandardMaterial color="#5A3A20" />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.5, 6, 6]} />
            <meshStandardMaterial color="#2D5A1E" />
          </mesh>
        </group>
      ))}
      {/* 4 lamp posts */}
      {[[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]].map(([lx, lz], i) => (
        <group key={`l${i}`} position={[lx, 0, lz]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.025, 0.04, 1.8, 4]} />
            <meshStandardMaterial color="#333" metalness={0.6} />
          </mesh>
          <mesh position={[0, 1.82, 0]}>
            <sphereGeometry args={[0.04, 4, 4]} />
            <meshStandardMaterial color="#FFE8A0" emissive="#FFD060" emissiveIntensity={3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── NPC (NO Html label - pure mesh) ──
function CityNPC({ startX, startZ, color }: { startX: number; startZ: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const posRef = useRef({ x: startX, z: startZ, targetX: startX, targetZ: startZ });
  const timerRef = useRef(Math.random() * 3);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.05);
    const p = posRef.current;
    const dx = p.targetX - p.x;
    const dz = p.targetZ - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.3) {
      timerRef.current += dt;
      if (timerRef.current > 4 + Math.random() * 5) {
        timerRef.current = 0;
        p.targetX = startX + (Math.random() - 0.5) * 10;
        p.targetZ = startZ + (Math.random() - 0.5) * 10;
      }
    } else {
      p.x += (dx / dist) * 0.5 * dt;
      p.z += (dz / dist) * 0.5 * dt;
      ref.current.rotation.y = Math.atan2(dx, dz);
    }
    ref.current.position.set(p.x, 0, p.z);
  });

  const darkColor = new THREE.Color(color).multiplyScalar(0.7).getStyle();

  return (
    <group ref={ref} position={[startX, 0, startZ]}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.18, 0.24, 0.12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.045, 0.05, 0]}>
        <boxGeometry args={[0.06, 0.1, 0.07]} />
        <meshStandardMaterial color={darkColor} />
      </mesh>
      <mesh position={[0.045, 0.05, 0]}>
        <boxGeometry args={[0.06, 0.1, 0.07]} />
        <meshStandardMaterial color={darkColor} />
      </mesh>
    </group>
  );
}

// ── Ground + Roads (simplified) ──
function CityGround() {
  return (
    <group>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#1A1E24" />
      </mesh>
      {/* Main cross roads */}
      <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 60]} />
        <meshStandardMaterial color="#2A2A30" />
      </mesh>
      <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 2]} />
        <meshStandardMaterial color="#2A2A30" />
      </mesh>
      {/* Ring roads */}
      {[
        [0, -7, 20, 1.5], [0, 7, 20, 1.5], [-7, 0, 1.5, 20], [7, 0, 1.5, 20],
      ].map(([x, z, w, h], i) => (
        <mesh key={i} position={[x, -0.014, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#282830" />
        </mesh>
      ))}
      {/* District ground indicators */}
      {DISTRICTS.slice(1).map((d, i) => (
        <mesh key={i} position={[d.x, -0.008, d.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[d.radius, 16]} />
          <meshStandardMaterial color={d.color} transparent opacity={0.06} />
        </mesh>
      ))}
    </group>
  );
}

// ── Street Lights (reduced count) ──
function StreetLights() {
  const positions = useMemo(() => {
    const pts: [number, number][] = [];
    for (let x = -24; x <= 24; x += 16) {
      for (let z = -24; z <= 24; z += 16) {
        if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;
        pts.push([x, z]);
      }
    }
    return pts;
  }, []);

  return (
    <group>
      {positions.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.025, 0.04, 2, 4]} />
            <meshStandardMaterial color="#333" metalness={0.6} />
          </mesh>
          <mesh position={[0, 2.05, 0]}>
            <sphereGeometry args={[0.05, 4, 4]} />
            <meshStandardMaterial color="#FFE8A0" emissive="#FFD060" emissiveIntensity={2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Player (only Html in the scene - just 1) ──
function CityPlayer({ position, name }: { position: [number, number, number]; name: string }) {
  const ref = useRef<THREE.Group>(null);
  const smoothPos = useRef(new THREE.Vector3(...position));

  useFrame(() => {
    if (!ref.current) return;
    smoothPos.current.lerp(new THREE.Vector3(...position), 0.15);
    ref.current.position.copy(smoothPos.current);
    ref.current.position.y = Math.sin(Date.now() * 0.003) * 0.008;
  });

  return (
    <group ref={ref} position={position}>
      <mesh position={[-0.055, 0.02, 0.02]}><boxGeometry args={[0.07, 0.04, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[0.055, 0.02, 0.02]}><boxGeometry args={[0.07, 0.04, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[-0.055, 0.1, 0]}><boxGeometry args={[0.07, 0.12, 0.08]} /><meshStandardMaterial color="#4A90D9" /></mesh>
      <mesh position={[0.055, 0.1, 0]}><boxGeometry args={[0.07, 0.12, 0.08]} /><meshStandardMaterial color="#4A90D9" /></mesh>
      <mesh position={[0, 0.27, 0]} castShadow><boxGeometry args={[0.26, 0.24, 0.15]} /><meshStandardMaterial color="#2E8B57" /></mesh>
      <mesh position={[-0.165, 0.26, 0]}><boxGeometry args={[0.06, 0.2, 0.08]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0.165, 0.26, 0]}><boxGeometry args={[0.06, 0.2, 0.08]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0, 0.48, 0]} castShadow><boxGeometry args={[0.24, 0.22, 0.2]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[-0.08, 0.72, 0]}><boxGeometry args={[0.06, 0.28, 0.05]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0.08, 0.72, 0]}><boxGeometry args={[0.06, 0.28, 0.05]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[-0.055, 0.50, 0.101]}><boxGeometry args={[0.06, 0.05, 0.01]} /><meshStandardMaterial color="#FFF" /></mesh>
      <mesh position={[0.055, 0.50, 0.101]}><boxGeometry args={[0.06, 0.05, 0.01]} /><meshStandardMaterial color="#FFF" /></mesh>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.16, 8]} /><meshBasicMaterial color="#000" transparent opacity={0.18} /></mesh>
      {/* Only Html in the entire scene */}
      <Html position={[0, 1.05, 0]} center>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none select-none bg-emerald-700">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] text-white font-bold">{name}</span>
        </div>
      </Html>
    </group>
  );
}

// ── Camera Follow (proper lock - drives OrbitControls target) ──
function CameraFollow({ target, controlsRef }: { target: [number, number, number]; controlsRef: React.RefObject<any> }) {
  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    const dt = Math.min(delta, 0.05);
    const factor = 1 - Math.exp(-8 * dt);
    const t = controlsRef.current.target;
    t.x += (target[0] - t.x) * factor;
    t.z += (target[2] - t.z) * factor;
    t.y += (0.5 - t.y) * factor;
    controlsRef.current.update();
  });
  return null;
}

// ── Main Export ──
interface CityExploreSceneProps {
  playerName: string;
  flyMode?: boolean;
  inVehicle?: boolean;
  vehicleType?: string;
  vehicleColor?: string;
  onVehicleToggle?: (val: boolean) => void;
  onReady?: () => void;
}

export function CityExploreScene({ playerName, flyMode, inVehicle, vehicleType, vehicleColor, onVehicleToggle, onReady }: CityExploreSceneProps) {
  const controlsRef = useRef<any>(null);
  const dn = useDayNight();

  const userId = useMemo(() => {
    const stored = localStorage.getItem("agentoffice_user");
    return stored ? JSON.parse(stored).email || "" : "";
  }, []);

  const { visibleBuildings, userBuilding, updateCameraCenter } = useCityBuildings(userId);

  const startPos = useMemo<[number, number, number]>(() => {
    if (userBuilding) {
      const sx = Math.max(-35, Math.min(35, userBuilding.coordinates.x * 0.4));
      const sz = Math.max(-35, Math.min(35, userBuilding.coordinates.z * 0.4));
      return [sx + 2, 0, sz + 2];
    }
    return [0, 0, 5];
  }, [userBuilding]);

  const [playerPos, setPlayerPos] = useState<[number, number, number]>(startPos);
  const hasSpawned = useRef(false);

  useEffect(() => {
    if (!hasSpawned.current && userBuilding) {
      setPlayerPos(startPos);
      hasSpawned.current = true;
    }
  }, [startPos, userBuilding]);

  const handleFloorClick = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.nativeEvent.button !== 0) return;
    const { x, z } = e.point;
    setPlayerPos([x, 0, z]);
    updateCameraCenter(x * 2.5, z * 2.5);
  }, [updateCameraCenter]);

  // Keyboard movement
  useEffect(() => {
    const keys = new Set<string>();
    const onDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === "e" && onVehicleToggle) onVehicleToggle(!inVehicle);
    };
    const onUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    const speed = inVehicle ? 0.6 : 0.3;
    const interval = setInterval(() => {
      let dx = 0, dz = 0;
      if (keys.has("arrowup") || keys.has("w")) dz -= speed;
      if (keys.has("arrowdown") || keys.has("s")) dz += speed;
      if (keys.has("arrowleft") || keys.has("a")) dx -= speed;
      if (keys.has("arrowright") || keys.has("d")) dx += speed;
      if (dx !== 0 || dz !== 0) {
        setPlayerPos(prev => {
          const newPos: [number, number, number] = [
            Math.max(-35, Math.min(35, prev[0] + dx)),
            0,
            Math.max(-35, Math.min(35, prev[2] + dz)),
          ];
          updateCameraCenter(newPos[0] * 2.5, newPos[2] * 2.5);
          return newPos;
        });
      }
    }, 50);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      clearInterval(interval);
    };
  }, [updateCameraCenter, inVehicle, onVehicleToggle]);

  // Lightweight building mapping (no Building3D component - too heavy)
  const dynamicBuildings = useMemo(() => {
    return visibleBuildings.slice(0, 20).map(b => ({
      ...b,
      coordinates: { ...b.coordinates, x: b.coordinates.x * 0.4, z: b.coordinates.z * 0.4 },
    }));
  }, [visibleBuildings]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        shadows
        style={{ touchAction: "none", width: "100%", height: "100%", display: "block" }}
        camera={{ position: [12, 15, 18], fov: 40, near: 0.5, far: 150 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = dn.exposure;
          onReady?.();
        }}
      >
        <color attach="background" args={[dn.bgColor]} />
        <fog attach="fog" args={[dn.fogColor, 20, 60]} />

        <ambientLight intensity={dn.ambientIntensity} color={dn.ambientColor} />
        <directionalLight
          position={dn.sunPosition}
          intensity={dn.sunIntensity}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-camera-far={40}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          color={dn.sunColor}
        />
        <hemisphereLight args={[dn.skyColor, dn.groundColor, dn.hemiIntensity]} />

        {dn.showStars && <Stars radius={60} depth={30} count={800} factor={3} saturation={0.2} fade speed={0.5} />}

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.15}
          enablePan={false}
          enableZoom
          enableRotate
          minDistance={6}
          maxDistance={22}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.6}
          zoomSpeed={0.8}
          rotateSpeed={0.5}
          target={[playerPos[0], 0.5, playerPos[2]]}
        />
        <CameraFollow target={playerPos} controlsRef={controlsRef} />

        {/* Clickable ground */}
        <mesh position={[0, -0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={handleFloorClick}>
          <planeGeometry args={[80, 80]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        <CityGround />
        <CityPlaza />
        <StreetLights />

        {/* Static buildings */}
        {CITY_BUILDINGS.map((b, i) => (
          <StaticBuilding key={i} x={b.x} z={b.z} w={b.w} d={b.d} h={b.h} color={b.color} />
        ))}

        {/* Dynamic buildings (lightweight) */}
        {dynamicBuildings.map(b => (
          <LightBuilding3D key={b.id} building={b} highlighted={userBuilding?.id === b.id} />
        ))}

        {/* Only show vehicle for user building */}
        {userBuilding && dynamicBuildings.filter(b => b.id === userBuilding.id).map(b => {
          const transport = b.transportType || STYLE_TRANSPORT_MAP[b.style] || "car";
          if (transport === "none") return null;
          return (
            <Vehicle3D
              key={`v-${b.id}`}
              type={transport}
              position={[b.coordinates.x + 1.5, 0, b.coordinates.z + 1.5]}
              color={b.primaryColor}
              ownerName={b.name}
              isActive
            />
          );
        })}

        {/* NPCs (no labels) */}
        {NPC_DATA.map((npc, i) => (
          <CityNPC key={i} startX={npc.x} startZ={npc.z} color={npc.color} />
        ))}

        {/* Player + vehicle */}
        {inVehicle && vehicleType && vehicleType !== "none" && (
          <Vehicle3D type={vehicleType as any} position={playerPos} color={vehicleColor} ownerName={playerName} isActive />
        )}
        {!inVehicle && <CityPlayer position={playerPos} name={playerName} />}
      </Canvas>
    </div>
  );
}
