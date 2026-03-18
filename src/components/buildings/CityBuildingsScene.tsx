import { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sky, Text, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Building3D } from "./Building3D";
import { VoxelCar, StreetLamp, Bench, TrashCan, Hydrant, PottedPlant } from "./VoxelProps";
import { useDayNight } from "@/hooks/useDayNight";
import type { CityBuilding } from "@/types/building";
import { DISTRICTS } from "@/types/building";

interface CityBuildingsSceneProps {
  buildings: CityBuilding[];
  targetBuilding?: CityBuilding | null;
  onBuildingClick?: (building: CityBuilding) => void;
  flyToTarget?: boolean;
}

function CameraController({ target, fly }: { target?: CityBuilding | null; fly?: boolean }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 25, 40));
  const lookTarget = useRef(new THREE.Vector3(0, 0, 0));
  const progress = useRef(0);
  const isFlying = useRef(false);

  useEffect(() => {
    if (target && fly) {
      progress.current = 0;
      isFlying.current = true;
      targetPos.current.set(target.coordinates.x + 8, target.height + 6, target.coordinates.z + 12);
      lookTarget.current.set(target.coordinates.x, target.height / 2, target.coordinates.z);
    }
  }, [target, fly]);

  useFrame((_, delta) => {
    if (isFlying.current && progress.current < 1) {
      progress.current = Math.min(1, progress.current + delta * 0.3);
      const t = 1 - Math.pow(1 - progress.current, 3);
      camera.position.lerp(targetPos.current, t * 0.05);
      camera.lookAt(lookTarget.current);
      if (progress.current >= 1) isFlying.current = false;
    }
  });

  return null;
}

// ── Street furniture along roads (deterministic) ──
function StreetFurniture({ nightIntensity }: { nightIntensity: number }) {
  const items = useMemo(() => {
    const result: Array<{ type: string; pos: [number, number, number]; rot?: number; color?: string; variant?: number }> = [];

    // Street lamps along main roads
    const lampPositions: [number, number][] = [
      [-20, -20], [-20, 20], [20, -20], [20, 20],
      [-10, 0], [10, 0], [0, -10], [0, 10],
      [-30, -10], [-30, 10], [30, -10], [30, 10],
      [-10, -30], [-10, 30], [10, -30], [10, 30],
    ];
    lampPositions.forEach(([x, z]) => result.push({ type: "lamp", pos: [x, 0, z] }));

    // Parked cars (voxel style) along streets
    const carColors = ["#3366CC", "#CC3333", "#33AA55", "#EEEE33", "#8833AA", "#FF8800", "#2288AA", "#555555"];
    const carPositions: [number, number, number][] = [
      [-7, 0, 12], [7, 0, -12], [-12, 0, 7], [12, 0, -7],
      [-18, 0, 12], [18, 0, -12], [-25, 0, -18], [25, 0, 18],
      [-5, 0, -22], [15, 0, 22], [-22, 0, 5], [22, 0, -5],
      [-35, 0, -15], [35, 0, 15], [-15, 0, 35], [15, 0, -35],
    ];
    carPositions.forEach(([x, y, z], i) => {
      result.push({ type: "car", pos: [x, y, z], rot: (i % 4) * Math.PI / 2, color: carColors[i % carColors.length] });
    });

    // Benches in parks/plazas
    [[-5, 5], [5, -5], [-15, -5], [15, 5], [0, 0]].forEach(([x, z], i) => {
      result.push({ type: "bench", pos: [x, 0, z], rot: (i % 2) * Math.PI / 2 });
    });

    // Trash cans
    [[-8, 11], [8, -11], [-22, -8], [22, 8], [-3, -15], [3, 15]].forEach(([x, z]) => {
      result.push({ type: "trash", pos: [x, 0, z] });
    });

    // Hydrants
    [[-6, 13], [6, -13], [-18, 5], [18, -5]].forEach(([x, z]) => {
      result.push({ type: "hydrant", pos: [x, 0, z] });
    });

    // Potted plants at intersections
    [[-9, 9], [9, -9], [-9, -9], [9, 9], [-11, 11], [11, -11]].forEach(([x, z], i) => {
      result.push({ type: "plant", pos: [x, 0, z], variant: i % 4 });
    });

    return result;
  }, []);

  return (
    <group>
      {items.map((item, i) => {
        switch (item.type) {
          case "lamp": return <StreetLamp key={i} position={item.pos} lightIntensity={nightIntensity * 3} />;
          case "car": return <VoxelCar key={i} position={item.pos} rotation={item.rot} color={item.color} />;
          case "bench": return <Bench key={i} position={item.pos} rotation={item.rot} />;
          case "trash": return <TrashCan key={i} position={item.pos} />;
          case "hydrant": return <Hydrant key={i} position={item.pos} />;
          case "plant": return <PottedPlant key={i} position={item.pos} variant={item.variant} scale={1.2} />;
          default: return null;
        }
      })}
    </group>
  );
}

// ── Trees (improved variety) ──
function CityTrees() {
  const trees = useMemo(() => {
    const positions: [number, number][] = [
      [-15, -15], [-15, 15], [15, -15], [15, 15],
      [-25, 0], [25, 0], [0, -25], [0, 25],
      [-8, 15], [8, -15], [-35, -10], [35, 10],
      [-10, -35], [10, 35], [-28, 15], [28, -15],
    ];
    return positions;
  }, []);

  const treeColors = ["#1A6B2A", "#2D5A1E", "#1B7A30", "#3A7A2A", "#246B1E", "#2A8B35"];
  const trunkColors = ["#5A3A20", "#4A2A15", "#6B4A2A"];

  return (
    <group>
      {trees.map(([x, z], i) => {
        const scale = 0.8 + (i % 3) * 0.2;
        const crownShape = i % 3; // 0: round, 1: tall, 2: wide
        return (
          <group key={`tree-${i}`} position={[x, 0, z]} scale={scale}>
            {/* Trunk */}
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.08, 0.7, 0.08]} />
              <meshStandardMaterial color={trunkColors[i % trunkColors.length]} roughness={0.9} />
            </mesh>
            {/* Crown layers (voxel style) */}
            {crownShape === 0 ? (
              <>
                <mesh position={[0, 0.85, 0]}><boxGeometry args={[0.8, 0.5, 0.8]} /><meshStandardMaterial color={treeColors[i % treeColors.length]} roughness={0.85} /></mesh>
                <mesh position={[0, 1.2, 0]}><boxGeometry args={[0.55, 0.35, 0.55]} /><meshStandardMaterial color={treeColors[(i + 1) % treeColors.length]} roughness={0.85} /></mesh>
              </>
            ) : crownShape === 1 ? (
              <>
                <mesh position={[0, 0.8, 0]}><boxGeometry args={[0.6, 0.4, 0.6]} /><meshStandardMaterial color={treeColors[i % treeColors.length]} roughness={0.85} /></mesh>
                <mesh position={[0, 1.1, 0]}><boxGeometry args={[0.5, 0.35, 0.5]} /><meshStandardMaterial color={treeColors[(i + 1) % treeColors.length]} roughness={0.85} /></mesh>
                <mesh position={[0, 1.35, 0]}><boxGeometry args={[0.35, 0.25, 0.35]} /><meshStandardMaterial color={treeColors[(i + 2) % treeColors.length]} roughness={0.85} /></mesh>
              </>
            ) : (
              <>
                <mesh position={[0, 0.8, 0]}><boxGeometry args={[0.9, 0.35, 0.9]} /><meshStandardMaterial color={treeColors[i % treeColors.length]} roughness={0.85} /></mesh>
                <mesh position={[0, 1.05, 0]}><boxGeometry args={[0.7, 0.25, 0.7]} /><meshStandardMaterial color={treeColors[(i + 1) % treeColors.length]} roughness={0.85} /></mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

function CityGround() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="hsl(220, 15%, 18%)" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[100, 250, 32]} />
        <meshStandardMaterial color="hsl(220, 12%, 12%)" roughness={0.98} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <ringGeometry args={[250, 600, 32]} />
        <meshStandardMaterial color="hsl(220, 10%, 8%)" roughness={1} />
      </mesh>
      {/* Distant hills */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const dist = 110 + Math.sin(i * 2.1) * 20;
        const hh = 6 + Math.sin(i * 1.5) * 3;
        return (
          <mesh key={`hill-${i}`} position={[Math.cos(angle) * dist, hh / 2 - 1, Math.sin(angle) * dist]}>
            <sphereGeometry args={[30, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="hsl(220, 10%, 7%)" roughness={1} />
          </mesh>
        );
      })}
      {/* Grid */}
      <gridHelper args={[200, 40, "hsl(220, 20%, 25%)", "hsl(220, 15%, 22%)"]} position={[0, 0.01, 0]} />

      {/* District markers */}
      {DISTRICTS.map(d => {
        const offsets: Record<string, [number, number]> = {
          tech: [-30, -20], creator: [30, -20], startup: [-30, 20], agency: [30, 20], central: [0, 0],
        };
        const [ox, oz] = offsets[d.id] || [0, 0];
        return (
          <group key={d.id} position={[ox, 0.02, oz]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[25, 25]} />
              <meshStandardMaterial color={d.color} transparent opacity={0.05} />
            </mesh>
            <Text position={[0, 0.1, -11]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1} color={d.color} anchorX="center" fillOpacity={0.4}>
              {d.emoji} {d.name}
            </Text>
          </group>
        );
      })}

      {/* Roads with lane markings */}
      {[-1, 1].map(dir => (
        <group key={`road-x-${dir}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, dir * 10]}>
            <planeGeometry args={[200, 2.5]} />
            <meshStandardMaterial color="hsl(220, 8%, 22%)" roughness={0.8} />
          </mesh>
          {/* Center lane dashes */}
          {Array.from({ length: 40 }).map((_, i) => (
            <mesh key={`dash-x-${dir}-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-95 + i * 5, 0.025, dir * 10]}>
              <planeGeometry args={[1.5, 0.08]} />
              <meshStandardMaterial color="#FFD060" transparent opacity={0.5} />
            </mesh>
          ))}
        </group>
      ))}
      {[-1, 1].map(dir => (
        <group key={`road-z-${dir}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[dir * 10, 0.02, 0]}>
            <planeGeometry args={[2.5, 200]} />
            <meshStandardMaterial color="hsl(220, 8%, 22%)" roughness={0.8} />
          </mesh>
          {Array.from({ length: 40 }).map((_, i) => (
            <mesh key={`dash-z-${dir}-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[dir * 10, 0.025, -95 + i * 5]}>
              <planeGeometry args={[0.08, 1.5]} />
              <meshStandardMaterial color="#FFD060" transparent opacity={0.5} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Crosswalks at intersections */}
      {[[-10, -10], [-10, 10], [10, -10], [10, 10]].map(([x, z], idx) => (
        <group key={`cross-${idx}`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x + (i - 2) * 0.4, 0.03, z]}>
              <planeGeometry args={[0.25, 2]} />
              <meshStandardMaterial color="#DDDDDD" transparent opacity={0.4} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Sidewalks along roads */}
      {[-1, 1].map(dir => (
        <group key={`sw-${dir}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, dir * 10 + dir * 1.6]}>
            <planeGeometry args={[200, 0.6]} />
            <meshStandardMaterial color="hsl(220, 10%, 28%)" roughness={0.95} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, dir * 10 - dir * 1.6]}>
            <planeGeometry args={[200, 0.6]} />
            <meshStandardMaterial color="hsl(220, 10%, 28%)" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Lighting() {
  const dn = useDayNight();
  return (
    <>
      <ambientLight intensity={dn.ambientIntensity} color={dn.ambientColor} />
      <directionalLight
        position={dn.sunPosition}
        intensity={dn.sunIntensity}
        color={dn.sunColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <hemisphereLight args={[dn.skyColor, dn.groundColor, dn.hemiIntensity]} />
      {dn.isNight && (
        <group position={[-25, 35, -20]}>
          <mesh><sphereGeometry args={[2.5, 16, 16]} /><meshBasicMaterial color="#E8E8F0" /></mesh>
          <mesh><sphereGeometry args={[4, 16, 16]} /><meshBasicMaterial color="#8899CC" transparent opacity={0.08} /></mesh>
          <directionalLight intensity={0.25} color="#8899CC" />
        </group>
      )}
      {dn.showStars && <Stars radius={100} depth={50} count={1500} factor={4} saturation={0.3} fade speed={0.5} />}
    </>
  );
}

export function CityBuildingsScene({ buildings, targetBuilding, onBuildingClick, flyToTarget }: CityBuildingsSceneProps) {
  const dn = useDayNight();
  const nightIntensity = dn.isNight ? 1 : dn.isSunset ? 0.6 : dn.isSunrise ? 0.4 : 0;

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 30, 50], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: dn.exposure }}
        dpr={[1, 1.5]}
      >
        <fog attach="fog" args={[dn.fogColor, 30, 150]} />
        <Lighting />
        <Sky sunPosition={dn.sunPosition} turbidity={dn.isNight ? 20 : 8} rayleigh={dn.isNight ? 0 : 2} />

        <CityGround />
        <CityTrees />
        <StreetFurniture nightIntensity={nightIntensity} />

        {buildings.map(b => (
          <Building3D key={b.id} building={b} onClick={() => onBuildingClick?.(b)} highlighted={targetBuilding?.id === b.id} />
        ))}

        <CameraController target={targetBuilding} fly={flyToTarget} />
        <OrbitControls maxPolarAngle={Math.PI / 2.2} minDistance={5} maxDistance={100} enableDamping />
      </Canvas>
    </div>
  );
}
