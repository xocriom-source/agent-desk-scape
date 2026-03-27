import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Map, Users2, Search, Compass } from "lucide-react";
import { motion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html, Stars, Text } from "@react-three/drei";
import * as THREE from "three";
import { useDayNight } from "@/hooks/useDayNight";
import { useCityBuildings } from "@/hooks/useCityBuildings";
import { Building3D } from "@/components/buildings/Building3D";
import type { CityBuilding } from "@/types/building";
import logo from "@/assets/logo.png";

// ── Cinematic Camera Entry ──
function CinematicEntry({ userBuilding, onComplete }: { userBuilding: CityBuilding | null; onComplete: () => void }) {
  const { camera } = useThree();
  const phase = useRef<"overview" | "zoom" | "done">("overview");
  const elapsed = useRef(0);
  const target = useMemo(() => {
    if (!userBuilding) return new THREE.Vector3(0, 0, 0);
    return new THREE.Vector3(userBuilding.coordinates.x, userBuilding.height / 2, userBuilding.coordinates.z);
  }, [userBuilding]);

  useEffect(() => {
    // Start from high overview
    camera.position.set(target.x + 60, 80, target.z + 60);
    camera.lookAt(target.x, 0, target.z);
  }, []);

  useFrame((_, delta) => {
    if (phase.current === "done") return;
    elapsed.current += delta;

    if (phase.current === "overview" && elapsed.current < 3) {
      // Slow pan overview
      const t = elapsed.current / 3;
      const ease = t * t * (3 - 2 * t); // smoothstep
      camera.position.lerp(
        new THREE.Vector3(target.x + 30, 50, target.z + 40),
        ease * 0.02
      );
      camera.lookAt(target);
    } else if (phase.current === "overview") {
      phase.current = "zoom";
      elapsed.current = 0;
    }

    if (phase.current === "zoom" && elapsed.current < 3) {
      const t = elapsed.current / 3;
      const ease = 1 - Math.pow(1 - t, 3);
      camera.position.lerp(
        new THREE.Vector3(target.x + 12, (userBuilding?.height || 5) + 8, target.z + 16),
        ease * 0.04
      );
      camera.lookAt(target);
    } else if (phase.current === "zoom") {
      phase.current = "done";
      onComplete();
    }
  });

  return null;
}

// ── Player Character ──
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
      <mesh position={[-0.055, 0.02, 0.02]}><boxGeometry args={[0.07, 0.04, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[0.055, 0.02, 0.02]}><boxGeometry args={[0.07, 0.04, 0.1]} /><meshStandardMaterial color="#333" /></mesh>
      <mesh position={[-0.055, 0.1, 0]}><boxGeometry args={[0.07, 0.12, 0.08]} /><meshStandardMaterial color="#4A90D9" /></mesh>
      <mesh position={[0.055, 0.1, 0]}><boxGeometry args={[0.07, 0.12, 0.08]} /><meshStandardMaterial color="#4A90D9" /></mesh>
      <mesh position={[0, 0.27, 0]} castShadow><boxGeometry args={[0.26, 0.24, 0.15]} /><meshStandardMaterial color="#2E8B57" /></mesh>
      <mesh position={[-0.165, 0.26, 0]}><boxGeometry args={[0.06, 0.2, 0.08]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0.165, 0.26, 0]}><boxGeometry args={[0.06, 0.2, 0.08]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[0, 0.48, 0]} castShadow><boxGeometry args={[0.24, 0.22, 0.2]} /><meshStandardMaterial color="#F5DEB3" /></mesh>
      <mesh position={[-0.055, 0.50, 0.101]}><boxGeometry args={[0.06, 0.05, 0.01]} /><meshStandardMaterial color="#FFF" /></mesh>
      <mesh position={[-0.055, 0.495, 0.106]}><boxGeometry args={[0.03, 0.035, 0.005]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
      <mesh position={[0.055, 0.50, 0.101]}><boxGeometry args={[0.06, 0.05, 0.01]} /><meshStandardMaterial color="#FFF" /></mesh>
      <mesh position={[0.055, 0.495, 0.106]}><boxGeometry args={[0.03, 0.035, 0.005]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
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

// ── Ground with roads ──
function LiveCityGround() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#1A1E24" roughness={0.95} />
      </mesh>
      <gridHelper args={[300, 60, "#2A2A30", "#222228"]} position={[0, 0.01, 0]} />
      {/* Main roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[300, 2]} />
        <meshStandardMaterial color="#2A2A30" roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[2, 300]} />
        <meshStandardMaterial color="#2A2A30" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ── Camera Follow ──
function CameraFollow({ target, controlsRef }: { target: [number, number, number]; controlsRef: React.RefObject<any> }) {
  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    const dt = Math.min(delta, 0.05);
    const factor = 1 - Math.exp(-4 * dt);
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

// ── Main Page ──
export default function LiveCity() {
  const navigate = useNavigate();
  const controlsRef = useRef<any>(null);
  const [cinematicDone, setCinematicDone] = useState(false);

  const { profile, user } = useAuth();
  const userName = profile?.display_name || "Chefe";
  const userId = user?.email || user?.id || "";

  const { visibleBuildings, userBuilding, updateCameraCenter } = useCityBuildings(userId);

  // Player starts at user's building or origin
  const startPos = useMemo<[number, number, number]>(() => {
    if (userBuilding) return [userBuilding.coordinates.x + 4, 0, userBuilding.coordinates.z + 4];
    return [0, 0, 5];
  }, [userBuilding]);

  const [playerPos, setPlayerPos] = useState<[number, number, number]>(startPos);

  useEffect(() => {
    setPlayerPos(startPos);
  }, [startPos]);

  // Keyboard movement
  useEffect(() => {
    const keys = new Set<string>();
    const onDown = (e: KeyboardEvent) => keys.add(e.key);
    const onUp = (e: KeyboardEvent) => keys.delete(e.key);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    const interval = setInterval(() => {
      let dx = 0, dz = 0;
      if (keys.has("ArrowUp") || keys.has("w")) dz -= 0.4;
      if (keys.has("ArrowDown") || keys.has("s")) dz += 0.4;
      if (keys.has("ArrowLeft") || keys.has("a")) dx -= 0.4;
      if (keys.has("ArrowRight") || keys.has("d")) dx += 0.4;
      if (dx !== 0 || dz !== 0) {
        setPlayerPos(prev => {
          const newPos: [number, number, number] = [
            Math.max(-140, Math.min(140, prev[0] + dx)),
            0,
            Math.max(-140, Math.min(140, prev[2] + dz)),
          ];
          updateCameraCenter(newPos[0], newPos[2]);
          return newPos;
        });
      }
    }, 50);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      clearInterval(interval);
    };
  }, [updateCameraCenter]);

  // Click to teleport
  const handleFloorClick = useCallback((e: any) => {
    if (e.nativeEvent?.button !== 0) return;
    const { x, z } = e.point;
    setPlayerPos([x, 0, z]);
    updateCameraCenter(x, z);
  }, [updateCameraCenter]);

  const handleBuildingClick = useCallback((building: CityBuilding) => {
    if (building.id.startsWith("npc_")) return; // NPC buildings not enterable
    navigate(`/building/${building.id}`);
  }, [navigate]);

  const dn = useDayNight();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background select-none">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        <Canvas
          shadows
          style={{ touchAction: "none" }}
          camera={{ position: [0, 80, 60], fov: 45, near: 0.1, far: 500 }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = dn.exposure;
          }}
        >
          <color attach="background" args={[dn.bgColor]} />
          <fog attach="fog" args={[dn.fogColor, 40, 200]} />

          <ambientLight intensity={dn.ambientIntensity} color={dn.ambientColor} />
          <directionalLight
            position={dn.sunPosition}
            intensity={dn.sunIntensity}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={120}
            shadow-camera-left={-60}
            shadow-camera-right={60}
            shadow-camera-top={60}
            shadow-camera-bottom={-60}
            color={dn.sunColor}
          />
          <hemisphereLight args={[dn.skyColor, dn.groundColor, dn.hemiIntensity]} />

          {dn.showStars && <Stars radius={100} depth={50} count={3000} factor={4} saturation={0.2} fade speed={0.5} />}

          {/* Cinematic entry animation */}
          {!cinematicDone && (
            <CinematicEntry userBuilding={userBuilding} onComplete={() => setCinematicDone(true)} />
          )}

          {/* Controls (enabled after cinematic) */}
          {cinematicDone && (
            <>
              <OrbitControls
                ref={controlsRef}
                enableDamping dampingFactor={0.08}
                enablePan enableZoom enableRotate
                minDistance={5} maxDistance={80}
                minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.4}
                zoomSpeed={0.9} rotateSpeed={0.6} panSpeed={0.7}
                mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
                touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
                target={[playerPos[0], 0, playerPos[2]]}
              />
              <ControlsUpdater controlsRef={controlsRef} />
              <CameraFollow target={playerPos} controlsRef={controlsRef} />
            </>
          )}

          {/* Clickable ground */}
          <mesh position={[0, -0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={handleFloorClick}>
            <planeGeometry args={[300, 300]} />
            <meshBasicMaterial visible={false} />
          </mesh>

          <LiveCityGround />

          {/* All visible buildings */}
          {visibleBuildings.map(b => (
            <Building3D
              key={b.id}
              building={b}
              onClick={() => handleBuildingClick(b)}
              highlighted={userBuilding?.id === b.id}
            />
          ))}

          {/* Player */}
          <CityPlayer position={playerPos} name={userName} />
        </Canvas>
      </div>

      {/* Top HUD */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-0 left-0 right-0 z-40"
      >
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/city")}
              className="p-2 rounded-xl bg-card/80 backdrop-blur-md border border-border text-muted-foreground hover:text-foreground hover:bg-card transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/80 backdrop-blur-md border border-border">
              <img src={logo} alt="" className="w-5 h-5" />
              <span className="text-sm font-bold text-foreground">🏙️ Cidade Viva</span>
              <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                {visibleBuildings.length} prédios
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/find-building")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium"
            >
              <Search className="w-3.5 h-3.5" />
              Buscar Prédio
            </button>
            <button
              onClick={() => navigate("/city-explore")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium"
            >
              <Compass className="w-3.5 h-3.5" />
              Explorar
            </button>
            <button
              onClick={() => navigate("/office")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/80 backdrop-blur-md border border-primary/50 text-white hover:bg-primary transition-all text-xs font-medium"
            >
              <Building2 className="w-3.5 h-3.5" />
              Meu Escritório
            </button>
          </div>
        </div>
      </motion.div>

      {/* Bottom controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40"
      >
        <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-gray-700/50">
          <span className="text-[10px] text-gray-400">
            <span className="text-white font-bold">WASD</span> andar
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-[10px] text-gray-400">
            <span className="text-white font-bold">CLICK</span> teleportar
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-[10px] text-gray-400">
            <span className="text-white font-bold">SCROLL</span> zoom
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-[10px] text-gray-400">
            Clique em prédios para visitar
          </span>
        </div>
      </motion.div>

      {/* Building count indicator */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-4 left-4 z-40"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50">
          <Users2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-gray-300">
            <span className="text-white font-bold">{visibleBuildings.length}</span> prédios visíveis
          </span>
        </div>
      </motion.div>
    </div>
  );
}
