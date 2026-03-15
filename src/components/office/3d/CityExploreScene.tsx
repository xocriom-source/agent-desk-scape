import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Html, Stars } from "@react-three/drei";
import * as THREE from "three";

const S = 0.5;

// ── District data ──
const DISTRICTS = [
  { name: "Praça Central", emoji: "🏛️", x: 0, z: 0, radius: 5, color: "#10B981" },
  { name: "Distrito Criativo", emoji: "🎨", x: -14, z: -8, radius: 4, color: "#F59E0B" },
  { name: "Distrito Inovação", emoji: "🔬", x: 14, z: -8, radius: 4, color: "#6366F1" },
  { name: "Distrito Comércio", emoji: "🛍️", x: -14, z: 10, radius: 4, color: "#EF4444" },
  { name: "Distrito Social", emoji: "☕", x: 14, z: 10, radius: 4, color: "#EC4899" },
];

// ── Building definitions ──
const CITY_BUILDINGS = [
  // Creative District
  { x: -18, z: -12, w: 3.5, d: 3, h: 2.8, color: "#8B6B3A", label: "🎵 Music Studio" },
  { x: -12, z: -12, w: 3, d: 2.5, h: 2.2, color: "#7A5A3A", label: "🎨 Art Studio" },
  { x: -18, z: -6, w: 3, d: 3, h: 3, color: "#6B5A4A", label: "✍️ Writing Studio" },
  { x: -12, z: -6, w: 2.8, d: 2.8, h: 2.5, color: "#8A7A5A", label: "📸 Photo Lab" },
  // Innovation District
  { x: 12, z: -12, w: 3.5, d: 3, h: 3.5, color: "#3A4A6A", label: "💻 Coding Lab" },
  { x: 18, z: -12, w: 3, d: 2.5, h: 2.8, color: "#4A5A7A", label: "🧠 AI Lab" },
  { x: 12, z: -6, w: 3, d: 3, h: 2.5, color: "#5A6A8A", label: "🔧 Workshop" },
  { x: 18, z: -6, w: 2.8, d: 2.8, h: 3.2, color: "#4A5A6A", label: "📊 Data Center" },
  // Commerce District
  { x: -18, z: 8, w: 3.5, d: 3, h: 2.5, color: "#6A4A3A", label: "🏪 Marketplace" },
  { x: -12, z: 8, w: 3, d: 2.5, h: 2.2, color: "#7A5A4A", label: "📋 Hiring Board" },
  { x: -18, z: 14, w: 3, d: 3, h: 2.8, color: "#8A6A4A", label: "🏦 Trade Hub" },
  { x: -12, z: 14, w: 2.5, d: 2.5, h: 2, color: "#9A7A5A", label: "🎫 Event Hall" },
  // Social District
  { x: 12, z: 8, w: 3.5, d: 3, h: 2.2, color: "#5A4A4A", label: "☕ Café Central" },
  { x: 18, z: 8, w: 3, d: 2.5, h: 2.5, color: "#6A5A5A", label: "🍕 Restaurante" },
  { x: 12, z: 14, w: 3, d: 3, h: 2.8, color: "#4A5A5A", label: "📚 Biblioteca" },
  { x: 18, z: 14, w: 2.8, d: 2.8, h: 2, color: "#5A6A5A", label: "🎭 Teatro" },
  // Mid-ring buildings
  { x: -6, z: -14, w: 3, d: 2.5, h: 3, color: "#5A5A3A", label: "🏢 TechFlow HQ" },
  { x: 0, z: -14, w: 3.5, d: 3, h: 3.5, color: "#6A6A4A", label: "🏢 Neural Works" },
  { x: 6, z: -14, w: 3, d: 2.5, h: 2.8, color: "#4A4A5A", label: "🏢 ByteShift" },
  { x: -6, z: 18, w: 3, d: 2.5, h: 2.2, color: "#5A4A5A", label: "🏠 Residências A" },
  { x: 0, z: 18, w: 3.5, d: 3, h: 2.5, color: "#6A5A4A", label: "🏠 Residências B" },
  { x: 6, z: 18, w: 3, d: 2.5, h: 2, color: "#7A6A5A", label: "🏠 Residências C" },
];

// ── NPC data with activities ──
const NPC_DATA = [
  { x: 2, z: 1, color: "#7A6B8A", name: "Kaori", activity: "meditating" },
  { x: -2, z: -1, color: "#8A7B6A", name: "Atlas", activity: "reading" },
  { x: 0, z: 3, color: "#6B8A7A", name: "Nova", activity: "sketching" },
  { x: -1, z: -3, color: "#8A6B7A", name: "Sage", activity: "chatting" },
  { x: 3, z: -2, color: "#7A8A6B", name: "Drift", activity: "walking" },
  { x: -3, z: 2, color: "#6A7B8A", name: "Echo", activity: "walking" },
  // Street wanderers
  { x: -10, z: -3, color: "#9A7A6A", name: "Corretor", activity: "walking" },
  { x: 8, z: 5, color: "#6A9A8A", name: "Turista", activity: "walking" },
  { x: -5, z: 12, color: "#8A6A9A", name: "Artista", activity: "walking" },
  { x: 10, z: -10, color: "#7A9A6A", name: "Estudante", activity: "walking" },
  { x: -8, z: 8, color: "#9A8A7A", name: "Chef", activity: "walking" },
  { x: 5, z: -5, color: "#6A8A9A", name: "Músico", activity: "walking" },
];

// ── City Building Component ──
function CityBuilding3D({ x, z, w, d, h, color, label }: { x: number; z: number; w: number; d: number; h: number; color: string; label: string }) {
  const [hovered, setHovered] = useState(false);
  const windowData = useMemo(() => {
    const rows = Math.floor(h / 0.5);
    const cols = Math.max(1, Math.floor(w / 0.8));
    const states: boolean[][] = [];
    for (let r = 0; r < rows; r++) {
      states[r] = [];
      for (let c = 0; c < cols; c++) states[r][c] = Math.random() > 0.3;
    }
    return { rows, cols, states };
  }, [h, w]);

  return (
    <group position={[x, 0, z]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main building body */}
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={hovered ? new THREE.Color(color).multiplyScalar(1.3).getStyle() : color} roughness={0.85} />
      </mesh>
      {/* Roof trim */}
      <mesh position={[0, h + 0.03, 0]}>
        <boxGeometry args={[w + 0.1, 0.06, d + 0.1]} />
        <meshStandardMaterial color="#2A2A2A" />
      </mesh>
      {/* Windows on front face */}
      {windowData.states.map((row, ri) =>
        row.map((lit, ci) => (
          <mesh key={`w${ri}-${ci}`} position={[
            -w / 2 + 0.35 + ci * (w / (windowData.cols + 0.5)),
            0.4 + ri * 0.5,
            d / 2 + 0.01
          ]}>
            <boxGeometry args={[0.2, 0.26, 0.01]} />
            <meshStandardMaterial color={lit ? "#FFE4A8" : "#1A1A2A"} emissive={lit ? "#FFD060" : "#000"} emissiveIntensity={lit ? 0.5 : 0} />
          </mesh>
        ))
      )}
      {/* Door */}
      <mesh position={[0, 0.35, d / 2 + 0.01]}>
        <boxGeometry args={[0.4, 0.7, 0.02]} />
        <meshStandardMaterial color="#3A2A1A" />
      </mesh>
      {/* Awning */}
      <mesh position={[0, 0.75, d / 2 + 0.15]}>
        <boxGeometry args={[0.7, 0.03, 0.3]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.6).getStyle()} />
      </mesh>
      {/* Label */}
      <Html position={[0, h + 0.35, 0]} center>
        <div className={`px-2 py-0.5 text-[8px] font-bold whitespace-nowrap pointer-events-none select-none rounded-md border transition-all ${
          hovered ? "bg-white/90 text-gray-900 border-white/50 scale-110" : "bg-black/70 text-gray-300 border-gray-700"
        }`}>
          {label}
        </div>
      </Html>
    </group>
  );
}

// ── Enhanced Central Plaza ──
function CityPlaza() {
  const size = 10;

  return (
    <group position={[0, 0, 0]}>
      {/* Main plaza floor - stone tiles */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#B0A890" roughness={0.75} />
      </mesh>
      {/* Decorative rings */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2, 2.5, 32]} />
        <meshStandardMaterial color="#8A7A60" />
      </mesh>
      <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 1, 32]} />
        <meshStandardMaterial color="#908868" />
      </mesh>
      {/* Tile pattern lines */}
      {Array.from({ length: 11 }).map((_, i) => (
        <mesh key={`tl-h-${i}`} position={[0, 0.014, -size / 2 + i]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[size, 0.02]} />
          <meshBasicMaterial color="#9A8A70" />
        </mesh>
      ))}
      {Array.from({ length: 11 }).map((_, i) => (
        <mesh key={`tl-v-${i}`} position={[-size / 2 + i, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.02, size]} />
          <meshBasicMaterial color="#9A8A70" />
        </mesh>
      ))}

      {/* ── Grand Fountain ── */}
      <group>
        {/* Base pool */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.9, 1, 0.24, 24]} />
          <meshStandardMaterial color="#6B6B78" roughness={0.6} />
        </mesh>
        {/* Water in pool */}
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.85, 0.85, 0.06, 24]} />
          <meshStandardMaterial color="#3A80B0" transparent opacity={0.55} roughness={0.05} metalness={0.3} />
        </mesh>
        {/* Middle tier */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.4, 0.5, 0.12, 16]} />
          <meshStandardMaterial color="#7A7A88" roughness={0.5} />
        </mesh>
        {/* Middle water */}
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.04, 16]} />
          <meshStandardMaterial color="#4A90C0" transparent opacity={0.5} roughness={0.05} />
        </mesh>
        {/* Pillar */}
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.5, 8]} />
          <meshStandardMaterial color="#8A8A98" roughness={0.4} />
        </mesh>
        {/* Top ornament */}
        <mesh position={[0, 0.95, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color="#C0A870" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Water glow */}
        <pointLight position={[0, 0.4, 0]} intensity={0.5} distance={4} color="#4AC0FF" />
      </group>

      {/* ── Trees (6 around plaza) ── */}
      {[
        [-3.5, -3.5], [3.5, -3.5], [-3.5, 3.5], [3.5, 3.5], [-4, 0], [4, 0]
      ].map(([tx, tz], i) => (
        <group key={`tree-${i}`} position={[tx, 0, tz]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.07, 0.1, 1, 6]} />
            <meshStandardMaterial color="#5A3A20" />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshStandardMaterial color={["#2D5A1E", "#3A6B2A", "#4A7B3A"][i % 3]} />
          </mesh>
          <mesh position={[0, 1.45, 0]}>
            <sphereGeometry args={[0.35, 8, 8]} />
            <meshStandardMaterial color={["#3A6B2A", "#4A7B3A", "#2D5A1E"][i % 3]} />
          </mesh>
          {/* Tree shadow */}
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.6, 12]} />
            <meshBasicMaterial color="#000" transparent opacity={0.08} />
          </mesh>
        </group>
      ))}

      {/* ── Benches (8 around fountain) ── */}
      {[
        [0, -2.2, 0], [0, 2.2, 0], [-2.2, 0, Math.PI / 2], [2.2, 0, Math.PI / 2],
        [-1.6, -1.6, Math.PI / 4], [1.6, -1.6, -Math.PI / 4], [-1.6, 1.6, -Math.PI / 4], [1.6, 1.6, Math.PI / 4],
      ].map(([bx, bz, rot], i) => (
        <group key={`bench-${i}`} position={[bx, 0, bz]} rotation={[0, rot, 0]}>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.7, 0.04, 0.22]} />
            <meshStandardMaterial color="#6B4226" />
          </mesh>
          {[[-0.3, -0.08], [0.3, -0.08], [-0.3, 0.08], [0.3, 0.08]].map(([lx, lz], j) => (
            <mesh key={j} position={[lx, 0.09, lz]}>
              <boxGeometry args={[0.03, 0.18, 0.03]} />
              <meshStandardMaterial color="#3A3A3A" />
            </mesh>
          ))}
          <mesh position={[0, 0.35, -0.09]}>
            <boxGeometry args={[0.7, 0.22, 0.03]} />
            <meshStandardMaterial color="#6B4226" />
          </mesh>
        </group>
      ))}

      {/* ── Lamp posts (8 around perimeter) ── */}
      {[
        [-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5],
        [0, -4.8], [0, 4.8], [-4.8, 0], [4.8, 0],
      ].map(([lx, lz], i) => (
        <group key={`lamp-${i}`} position={[lx, 0, lz]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.025, 0.04, 1.8, 6]} />
            <meshStandardMaterial color="#333" metalness={0.7} />
          </mesh>
          {/* Lamp head */}
          <mesh position={[0, 1.85, 0]}>
            <cylinderGeometry args={[0.08, 0.04, 0.08, 6]} />
            <meshStandardMaterial color="#444" metalness={0.5} />
          </mesh>
          <mesh position={[0, 1.82, 0]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color="#FFE8A0" emissive="#FFD060" emissiveIntensity={2} />
          </mesh>
          <pointLight position={[0, 1.8, 0]} intensity={0.2} distance={4} color="#FFD060" />
        </group>
      ))}

      {/* ── Flower beds ── */}
      {[[-2, -4], [2, -4], [-2, 4], [2, 4]].map(([fx, fz], i) => (
        <group key={`flower-${i}`} position={[fx, 0, fz]}>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.8, 0.12, 0.4]} />
            <meshStandardMaterial color="#4A3A2A" />
          </mesh>
          {Array.from({ length: 5 }).map((_, j) => (
            <mesh key={j} position={[-0.3 + j * 0.15, 0.2, (Math.random() - 0.5) * 0.2]}>
              <sphereGeometry args={[0.06, 6, 6]} />
              <meshStandardMaterial color={["#FF6B8A", "#FFB347", "#FF69B4", "#FF4500", "#DA70D6"][j % 5]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Plaza label */}
      <Html position={[0, 2.5, 0]} center>
        <div className="px-4 py-1.5 text-xs font-bold whitespace-nowrap pointer-events-none select-none rounded-xl bg-emerald-900/85 text-emerald-300 border border-emerald-600/50 shadow-lg shadow-emerald-500/20">
          🏛️ Praça Central
        </div>
      </Html>
    </group>
  );
}

// ── NPC with activities ──
function CityNPC({ startX, startZ, color, name, activity }: { startX: number; startZ: number; color: string; name: string; activity: string }) {
  const ref = useRef<THREE.Group>(null);
  const posRef = useRef({ x: startX, z: startZ, targetX: startX, targetZ: startZ });
  const timerRef = useRef(Math.random() * 3);
  const isWalker = activity === "walking";

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.05);
    const p = posRef.current;

    if (isWalker) {
      const dx = p.targetX - p.x;
      const dz = p.targetZ - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 0.3) {
        timerRef.current += dt;
        if (timerRef.current > 3 + Math.random() * 4) {
          timerRef.current = 0;
          p.targetX = startX + (Math.random() - 0.5) * 12;
          p.targetZ = startZ + (Math.random() - 0.5) * 12;
        }
      } else {
        p.x += (dx / dist) * 0.6 * dt;
        p.z += (dz / dist) * 0.6 * dt;
        ref.current.rotation.y = Math.atan2(dx, dz);
      }
    } else {
      // Idle animation
      ref.current.rotation.y += Math.sin(Date.now() * 0.0005 + startX) * 0.001;
    }

    ref.current.position.set(p.x, 0, p.z);
    if (isWalker) {
      const dist = Math.hypot(p.targetX - p.x, p.targetZ - p.z);
      if (dist > 0.3) ref.current.position.y = Math.abs(Math.sin(Date.now() * 0.01)) * 0.015;
    } else {
      ref.current.position.y = Math.sin(Date.now() * 0.002 + startX) * 0.005;
    }
  });

  const activityEmoji = { meditating: "🧘", reading: "📖", sketching: "🎨", chatting: "💬", walking: "" }[activity] || "";

  return (
    <group ref={ref} position={[startX, 0, startZ]}>
      {/* Body */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.18, 0.24, 0.12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Eyes */}
      {[-0.03, 0.03].map((ox, i) => (
        <mesh key={i} position={[ox, 0.41, 0.075]}>
          <boxGeometry args={[0.03, 0.03, 0.01]} />
          <meshStandardMaterial color="#FFF" emissive="#FFF" emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* Legs */}
      <mesh position={[-0.045, 0.05, 0]}>
        <boxGeometry args={[0.06, 0.1, 0.07]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.7).getStyle()} />
      </mesh>
      <mesh position={[0.045, 0.05, 0]}>
        <boxGeometry args={[0.06, 0.1, 0.07]} />
        <meshStandardMaterial color={new THREE.Color(color).multiplyScalar(0.7).getStyle()} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.12, 0.2, 0]}>
        <boxGeometry args={[0.04, 0.16, 0.06]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.12, 0.2, 0]}>
        <boxGeometry args={[0.04, 0.16, 0.06]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Shadow */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.12, 12]} />
        <meshBasicMaterial color="#000" transparent opacity={0.1} />
      </mesh>
      {/* Name + Activity */}
      <Html position={[0, 0.62, 0]} center>
        <div className="px-1.5 py-0.5 text-[7px] font-bold whitespace-nowrap pointer-events-none select-none rounded-md bg-black/70 text-gray-300 border border-gray-700/50">
          {activityEmoji && <span className="mr-0.5">{activityEmoji}</span>}{name}
        </div>
      </Html>
    </group>
  );
}

// ── City Ground & Roads ──
function CityGround() {
  return (
    <group>
      {/* Base ground */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#1A1E24" />
      </mesh>

      {/* Main roads (cross-shaped through center) */}
      {/* North-South road */}
      <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 60]} />
        <meshStandardMaterial color="#2A2A30" />
      </mesh>
      {/* East-West road */}
      <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 2]} />
        <meshStandardMaterial color="#2A2A30" />
      </mesh>
      {/* Ring road around plaza */}
      {[
        [0, -7, 20, 1.5], [0, 7, 20, 1.5], [-7, 0, 1.5, 20], [7, 0, 1.5, 20],
      ].map(([x, z, w, h], i) => (
        <mesh key={`ring-${i}`} position={[x, -0.014, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#282830" />
        </mesh>
      ))}

      {/* Center lane markings */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh key={`cl-ns-${i}`} position={[0, -0.012, -28 + i * 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.06, 0.8]} />
          <meshBasicMaterial color="#44443A" />
        </mesh>
      ))}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh key={`cl-ew-${i}`} position={[-28 + i * 2, -0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.8, 0.06]} />
          <meshBasicMaterial color="#44443A" />
        </mesh>
      ))}

      {/* Sidewalk blocks */}
      {[-20, -10, 10, 20].flatMap(ox =>
        [-20, -10, 10, 20].map(oz => (
          <mesh key={`sw-${ox}-${oz}`} position={[ox, -0.012, oz]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[8, 8]} />
            <meshStandardMaterial color="#333338" />
          </mesh>
        ))
      )}

      {/* District ground indicators */}
      {DISTRICTS.slice(1).map((d, i) => (
        <mesh key={`dg-${i}`} position={[d.x, -0.008, d.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[d.radius, 32]} />
          <meshStandardMaterial color={d.color} transparent opacity={0.06} />
        </mesh>
      ))}
    </group>
  );
}

// ── District Labels (floating) ──
function DistrictLabels() {
  return (
    <group>
      {DISTRICTS.slice(1).map((d, i) => (
        <Html key={i} position={[d.x, 4, d.z]} center>
          <div className="px-3 py-1 text-[9px] font-bold whitespace-nowrap pointer-events-none select-none rounded-lg border shadow-lg"
            style={{ backgroundColor: `${d.color}20`, color: d.color, borderColor: `${d.color}40` }}>
            {d.emoji} {d.name}
          </div>
        </Html>
      ))}
    </group>
  );
}

// ── Street Lights Grid ──
function StreetLights() {
  const positions = useMemo(() => {
    const pts: [number, number][] = [];
    for (let x = -24; x <= 24; x += 8) {
      for (let z = -24; z <= 24; z += 8) {
        if (Math.abs(x) < 6 && Math.abs(z) < 6) continue; // skip plaza area
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
            <cylinderGeometry args={[0.025, 0.04, 2, 6]} />
            <meshStandardMaterial color="#333" metalness={0.6} />
          </mesh>
          <mesh position={[0, 2.05, 0]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color="#FFE8A0" emissive="#FFD060" emissiveIntensity={1.5} />
          </mesh>
          <pointLight position={[0, 2, 0]} intensity={0.12} distance={5} color="#FFD060" />
        </group>
      ))}
    </group>
  );
}

// ── Player in City ──
function CityPlayer({ position, name }: { position: [number, number, number]; name: string }) {
  const ref = useRef<THREE.Group>(null);
  const smoothPos = useRef(new THREE.Vector3(...position));

  useFrame(() => {
    if (!ref.current) return;
    smoothPos.current.lerp(new THREE.Vector3(...position), 0.12);
    ref.current.position.copy(smoothPos.current);
    ref.current.position.y = Math.sin(Date.now() * 0.003) * 0.008;
  });

  return (
    <group ref={ref} position={position}>
      {/* Shoes */}
      <mesh position={[-0.055, 0.02, 0.02]}><boxGeometry args={[0.07, 0.04, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[0.055, 0.02, 0.02]}><boxGeometry args={[0.07, 0.04, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
      {/* Legs */}
      <mesh position={[-0.055, 0.1, 0]}><boxGeometry args={[0.07, 0.12, 0.08]} /><meshStandardMaterial color="#4A90D9" /></mesh>
      <mesh position={[0.055, 0.1, 0]}><boxGeometry args={[0.07, 0.12, 0.08]} /><meshStandardMaterial color="#4A90D9" /></mesh>
      {/* Body */}
      <mesh position={[0, 0.27, 0]} castShadow><boxGeometry args={[0.26, 0.24, 0.15]} /><meshStandardMaterial color="#2E8B57" /></mesh>
      {/* Arms */}
      <mesh position={[-0.165, 0.26, 0]}><boxGeometry args={[0.06, 0.2, 0.08]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0.165, 0.26, 0]}><boxGeometry args={[0.06, 0.2, 0.08]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      {/* Head */}
      <mesh position={[0, 0.48, 0]} castShadow><boxGeometry args={[0.24, 0.22, 0.2]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      {/* Ears */}
      <mesh position={[-0.08, 0.72, 0]}><boxGeometry args={[0.06, 0.28, 0.05]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0.08, 0.72, 0]}><boxGeometry args={[0.06, 0.28, 0.05]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      {/* Eyes */}
      <mesh position={[-0.055, 0.50, 0.101]}><boxGeometry args={[0.06, 0.05, 0.01]} /><meshStandardMaterial color="#FFF" /></mesh>
      <mesh position={[-0.055, 0.495, 0.106]}><boxGeometry args={[0.03, 0.035, 0.005]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      <mesh position={[0.055, 0.50, 0.101]}><boxGeometry args={[0.06, 0.05, 0.01]} /><meshStandardMaterial color="#FFF" /></mesh>
      <mesh position={[0.055, 0.495, 0.106]}><boxGeometry args={[0.03, 0.035, 0.005]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      {/* Shadow */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.16, 16]} /><meshBasicMaterial color="#000" transparent opacity={0.18} /></mesh>
      <Html position={[0, 0.95, 0]} center><span className="text-sm select-none pointer-events-none">👑</span></Html>
      <Html position={[0, 1.05, 0]} center>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none select-none bg-emerald-700">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] text-white font-bold">{name}</span>
        </div>
      </Html>
    </group>
  );
}

// ── Camera Follow ──
function CameraFollow({ target, controlsRef }: { target: [number, number, number]; controlsRef: React.RefObject<any> }) {
  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    const dt = Math.min(delta, 0.05);
    const factor = 1 - Math.exp(-6 * dt);
    const t = controlsRef.current.target;
    t.x += (target[0] - t.x) * factor;
    t.z += (target[2] - t.z) * factor;
    t.y += (0 - t.y) * factor;
  });
  return null;
}

function ControlsUpdater({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  useFrame(() => { controlsRef.current?.update(); });
  return null;
}

// ── Main Export ──
export function CityExploreScene({ playerName }: { playerName: string }) {
  const controlsRef = useRef<any>(null);
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 0, 5]);

  // Click to move
  const handleFloorClick = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.nativeEvent.button !== 0) return;
    const { x, z } = e.point;
    setPlayerPos([x, 0, z]);
  }, []);

  // Keyboard movement
  useEffect(() => {
    const keys = new Set<string>();
    const onDown = (e: KeyboardEvent) => keys.add(e.key);
    const onUp = (e: KeyboardEvent) => keys.delete(e.key);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    const interval = setInterval(() => {
      let dx = 0, dz = 0;
      if (keys.has("ArrowUp") || keys.has("w")) dz -= 0.3;
      if (keys.has("ArrowDown") || keys.has("s")) dz += 0.3;
      if (keys.has("ArrowLeft") || keys.has("a")) dx -= 0.3;
      if (keys.has("ArrowRight") || keys.has("d")) dx += 0.3;
      if (dx !== 0 || dz !== 0) {
        setPlayerPos(prev => [
          Math.max(-30, Math.min(30, prev[0] + dx)),
          0,
          Math.max(-30, Math.min(30, prev[2] + dz)),
        ]);
      }
    }, 50);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        style={{ touchAction: "none" }}
        camera={{ position: [12, 15, 18], fov: 40, near: 0.1, far: 250 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        <color attach="background" args={["#060610"]} />
        <fog attach="fog" args={["#060610", 30, 65]} />

        <ambientLight intensity={0.4} color="#FFE8C8" />
        <directionalLight position={[15, 25, 10]} intensity={0.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-far={80} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} color="#FFE0B0" />
        <directionalLight position={[-10, 18, -8]} intensity={0.15} color="#8899CC" />
        <hemisphereLight args={["#1A1A30", "#4A3520", 0.2]} />
        
        {/* Starry sky */}
        <Stars radius={80} depth={50} count={3000} factor={4} saturation={0.2} fade speed={0.5} />

        <OrbitControls
          ref={controlsRef}
          enableDamping dampingFactor={0.08}
          enablePan enableZoom enableRotate
          minDistance={4} maxDistance={50}
          minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.4}
          zoomSpeed={0.9} rotateSpeed={0.6} panSpeed={0.7}
          mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
          target={[playerPos[0], 0, playerPos[2]]}
        />
        <ControlsUpdater controlsRef={controlsRef} />
        <CameraFollow target={playerPos} controlsRef={controlsRef} />

        {/* Clickable ground */}
        <mesh position={[0, -0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={handleFloorClick}>
          <planeGeometry args={[80, 80]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        <CityGround />
        <CityPlaza />
        <DistrictLabels />
        <StreetLights />

        {/* Buildings */}
        {CITY_BUILDINGS.map((b, i) => (
          <CityBuilding3D key={i} x={b.x} z={b.z} w={b.w} d={b.d} h={b.h} color={b.color} label={b.label} />
        ))}

        {/* NPCs */}
        {NPC_DATA.map((npc, i) => (
          <CityNPC key={i} startX={npc.x} startZ={npc.z} color={npc.color} name={npc.name} activity={npc.activity} />
        ))}

        {/* Player */}
        <CityPlayer position={playerPos} name={playerName} />
      </Canvas>
    </div>
  );
}
