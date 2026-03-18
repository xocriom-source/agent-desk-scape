import { useRef, useEffect, useState, useMemo, memo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sky, Text, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Building3D } from "./Building3D";
import { VoxelCar, StreetLamp, Bench, TrashCan, Hydrant, PottedPlant, CafeTable, Dumpster, ParkingMeter } from "./VoxelProps";
import { preloadBuildingModels } from "./GLBBuildingModel";
import { useDayNight } from "@/hooks/useDayNight";
import { generateCityLayout, CITY_STREETS, CITY_ZONES, getZoneGlow } from "@/systems/city/CityLayoutGenerator";
import type { CityBuilding } from "@/types/building";
import { DISTRICTS } from "@/types/building";

preloadBuildingModels();

interface CityBuildingsSceneProps {
  buildings: CityBuilding[];
  targetBuilding?: CityBuilding | null;
  onBuildingClick?: (building: CityBuilding) => void;
  flyToTarget?: boolean;
}

// ── Camera ──
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

// ── Deterministic hash ──
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ── Street furniture distributed along streets contextually ──
const StreetFurniture = memo(function StreetFurniture({ nightIntensity }: { nightIntensity: number }) {
  const items = useMemo(() => {
    const result: Array<{ type: string; pos: [number, number, number]; rot?: number; color?: string; variant?: number }> = [];

    for (const street of CITY_STREETS) {
      const dx = street.end.x - street.start.x;
      const dz = street.end.z - street.start.z;
      const len = Math.sqrt(dx * dx + dz * dz);
      const steps = Math.floor(len / 6);
      const nx = dx / len;
      const nz = dz / len;
      const perpX = -nz;
      const perpZ = nx;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = street.start.x + dx * t;
        const z = street.start.z + dz * t;
        const seed = hash(`sf-${Math.round(x)}-${Math.round(z)}`);
        const side = (i % 2 === 0) ? 1 : -1;
        const offset = street.width / 2 + 0.8;

        // Lamps on both sides of main streets, one side for secondary
        if (street.type === "main" || i % 2 === 0) {
          result.push({ type: "lamp", pos: [x + perpX * offset * side, 0, z + perpZ * offset * side] });
        }
        if (street.type === "main" && i % 2 === 1) {
          result.push({ type: "lamp", pos: [x - perpX * offset * side, 0, z - perpZ * offset * side] });
        }

        // Contextual props based on zone
        const glow = getZoneGlow(x, z);
        if (glow > 0.5 && seed % 4 === 0) {
          // Commercial zone: cafe tables
          result.push({ type: "cafe", pos: [x + perpX * (offset + 0.6) * side, 0, z + perpZ * (offset + 0.6) * side] });
        }
        if (glow < 0.3 && seed % 5 === 0) {
          // Residential: benches
          result.push({ type: "bench", pos: [x + perpX * (offset + 0.3) * side, 0, z + perpZ * (offset + 0.3) * side], rot: Math.atan2(nz, nx) });
        }

        // Cars parked along streets
        if (seed % 3 === 0 && street.type !== "alley") {
          const carColors = ["#3366CC", "#CC3333", "#33AA55", "#EEEE33", "#8833AA", "#FF8800", "#2288AA", "#555555"];
          result.push({
            type: "car",
            pos: [x + perpX * (street.width / 2 + 0.3) * side, 0, z + perpZ * (street.width / 2 + 0.3) * side],
            rot: Math.atan2(nz, nx) + (side > 0 ? 0 : Math.PI),
            color: carColors[seed % carColors.length],
          });
        }

        // Trash/hydrant/meter scattered
        if (seed % 7 === 0) result.push({ type: "trash", pos: [x + perpX * offset * side, 0, z + perpZ * offset * side] });
        if (seed % 11 === 0) result.push({ type: "hydrant", pos: [x + perpX * (offset - 0.2) * side, 0, z + perpZ * (offset - 0.2) * side] });
        if (seed % 9 === 0 && street.type === "main") result.push({ type: "meter", pos: [x + perpX * (offset + 0.2) * side, 0, z + perpZ * (offset + 0.2) * side] });
      }
    }

    // Dumpsters in alleys
    for (const street of CITY_STREETS) {
      if (street.type !== "alley") continue;
      const seed = hash(`dump-${street.start.x}-${street.start.z}`);
      if (seed % 3 === 0) {
        const mx = (street.start.x + street.end.x) / 2;
        const mz = (street.start.z + street.end.z) / 2;
        result.push({ type: "dumpster", pos: [mx + 1.5, 0, mz], rot: seededRandom(seed) * Math.PI });
      }
    }

    return result;
  }, []);

  return (
    <group>
      {items.map((item, i) => {
        switch (item.type) {
          case "lamp": return <StreetLamp key={i} position={item.pos} lightIntensity={nightIntensity * 2.5} />;
          case "car": return <VoxelCar key={i} position={item.pos} rotation={item.rot} color={item.color} />;
          case "bench": return <Bench key={i} position={item.pos} rotation={item.rot} />;
          case "trash": return <TrashCan key={i} position={item.pos} />;
          case "hydrant": return <Hydrant key={i} position={item.pos} />;
          case "cafe": return <CafeTable key={i} position={item.pos} />;
          case "meter": return <ParkingMeter key={i} position={item.pos} />;
          case "dumpster": return <Dumpster key={i} position={item.pos} rotation={item.rot} />;
          case "plant": return <PottedPlant key={i} position={item.pos} variant={item.variant} scale={1.2} />;
          default: return null;
        }
      })}
    </group>
  );
});

// ── Trees clustered in parks, along streets, AI vs Human themed ──
const CityTrees = memo(function CityTrees() {
  const trees = useMemo(() => {
    const positions: Array<{ pos: [number, number]; scale: number; crown: number; isAI: boolean }> = [];

    // Park trees (dense cluster in central dividing park)
    const parkZone = CITY_ZONES.find(z => z.type === "park");
    if (parkZone) {
      for (let i = 0; i < 25; i++) {
        const angle = seededRandom(i * 7) * Math.PI * 2;
        const dist = seededRandom(i * 13) * (parkZone.radius - 1);
        positions.push({
          pos: [parkZone.center.x + Math.cos(angle) * dist, parkZone.center.z + Math.sin(angle) * dist],
          scale: 0.8 + seededRandom(i * 3) * 0.5, crown: i % 3, isAI: false,
        });
      }
    }

    // Plaza greenery (both plazas)
    for (const pz of CITY_ZONES.filter(z => z.type === "plaza")) {
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const dist = pz.radius * 0.5;
        positions.push({
          pos: [pz.center.x + Math.cos(angle) * dist, pz.center.z + Math.sin(angle) * dist],
          scale: 0.7 + seededRandom(i * 5 + 100) * 0.3, crown: i % 3, isAI: pz.district === "ai",
        });
      }
    }

    // Human residential trees (south)
    for (let x = -45; x < 45; x += 8) {
      for (let z = 20; z < 48; z += 9) {
        const seed = hash(`tree-${x}-${z}`);
        if (seededRandom(seed) > 0.45) {
          positions.push({
            pos: [x + (seededRandom(seed + 1) - 0.5) * 3, z + (seededRandom(seed + 2) - 0.5) * 3],
            scale: 0.7 + seededRandom(seed + 3) * 0.4, crown: seed % 3, isAI: false,
          });
        }
      }
    }

    // AI district trees (north — sparse, geometric)
    for (let x = -40; x < 40; x += 12) {
      for (let z = -45; z < -10; z += 14) {
        const seed = hash(`ai-tree-${x}-${z}`);
        if (seededRandom(seed) > 0.6) {
          positions.push({
            pos: [x + (seededRandom(seed + 1) - 0.5) * 2, z + (seededRandom(seed + 2) - 0.5) * 2],
            scale: 0.6 + seededRandom(seed + 3) * 0.3, crown: seed % 3, isAI: true,
          });
        }
      }
    }

    // Boulevard trees along the divider
    for (let x = -50; x < 50; x += 6) {
      positions.push({ pos: [x, -3], scale: 0.9, crown: Math.abs(x) % 3, isAI: false });
      positions.push({ pos: [x, -7], scale: 0.85, crown: (Math.abs(x) + 1) % 3, isAI: true });
    }

    return positions;
  }, []);

  const humanTreeColors = ["#1A6B2A", "#2D5A1E", "#1B7A30", "#3A7A2A", "#246B1E", "#2A8B35"];
  const aiTreeColors = ["#1A8B6A", "#2D7A5E", "#1B9A70", "#108060", "#20AA75", "#0A7050"];
  const trunkColors = ["#5A3A20", "#4A2A15", "#6B4A2A"];
  const aiTrunkColors = ["#3A4858", "#2A3848", "#4A5868"];

  return (
    <group>
      {trees.map(({ pos: [x, z], scale, crown, isAI }, i) => {
        const colors = isAI ? aiTreeColors : humanTreeColors;
        const trunks = isAI ? aiTrunkColors : trunkColors;
        return (
          <group key={`tree-${i}`} position={[x, 0, z]} scale={scale}>
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.08, 0.7, 0.08]} />
              <meshStandardMaterial color={trunks[i % trunks.length]} roughness={0.9} />
            </mesh>
            {crown === 0 ? (
              <>
                <mesh position={[0, 0.85, 0]}><boxGeometry args={[0.8, 0.5, 0.8]} /><meshStandardMaterial color={colors[i % colors.length]} roughness={0.85} /></mesh>
                <mesh position={[0, 1.2, 0]}><boxGeometry args={[0.55, 0.35, 0.55]} /><meshStandardMaterial color={colors[(i + 1) % colors.length]} roughness={0.85} /></mesh>
              </>
            ) : crown === 1 ? (
              <>
                <mesh position={[0, 0.8, 0]}><boxGeometry args={[0.6, 0.4, 0.6]} /><meshStandardMaterial color={colors[i % colors.length]} roughness={0.85} /></mesh>
                <mesh position={[0, 1.1, 0]}><boxGeometry args={[0.5, 0.35, 0.5]} /><meshStandardMaterial color={colors[(i + 1) % colors.length]} roughness={0.85} /></mesh>
                <mesh position={[0, 1.35, 0]}><boxGeometry args={[0.35, 0.25, 0.35]} /><meshStandardMaterial color={colors[(i + 2) % colors.length]} roughness={0.85} /></mesh>
              </>
            ) : (
              <>
                <mesh position={[0, 0.8, 0]}><boxGeometry args={[0.9, 0.35, 0.9]} /><meshStandardMaterial color={colors[i % colors.length]} roughness={0.85} /></mesh>
                <mesh position={[0, 1.05, 0]}><boxGeometry args={[0.7, 0.25, 0.7]} /><meshStandardMaterial color={colors[(i + 1) % colors.length]} roughness={0.85} /></mesh>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
});

// ── Streets with lane markings ──
const CityStreets = memo(function CityStreets() {
  return (
    <group>
      {CITY_STREETS.map((street, idx) => {
        const dx = street.end.x - street.start.x;
        const dz = street.end.z - street.start.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        const mx = (street.start.x + street.end.x) / 2;
        const mz = (street.start.z + street.end.z) / 2;
        const angle = Math.atan2(dx, dz);

        const roadColor = street.type === "main" ? "hsl(220, 8%, 20%)" : street.type === "secondary" ? "hsl(220, 8%, 22%)" : "hsl(220, 6%, 24%)";
        const sidewalkColor = "hsl(220, 10%, 28%)";

        return (
          <group key={`street-${idx}`}>
            {/* Road surface */}
            <mesh rotation={[-Math.PI / 2, 0, angle]} position={[mx, 0.015, mz]}>
              <planeGeometry args={[street.width, len]} />
              <meshStandardMaterial color={roadColor} roughness={0.85} />
            </mesh>
            {/* Center line for main/secondary */}
            {street.type !== "alley" && (
              <group>
                {Array.from({ length: Math.floor(len / 3) }).map((_, i) => {
                  const t = (i + 0.5) / Math.floor(len / 3);
                  const px = street.start.x + dx * t;
                  const pz = street.start.z + dz * t;
                  return (
                    <mesh key={i} rotation={[-Math.PI / 2, 0, angle]} position={[px, 0.02, pz]}>
                      <planeGeometry args={[0.08, 1.2]} />
                      <meshStandardMaterial color="#FFD060" transparent opacity={street.type === "main" ? 0.5 : 0.3} />
                    </mesh>
                  );
                })}
              </group>
            )}
            {/* Sidewalks */}
            {street.type !== "alley" && (
              <>
                {[-1, 1].map(side => {
                  const perpX = -(dz / len);
                  const perpZ = (dx / len);
                  const sw = street.width / 2 + 0.4;
                  return (
                    <mesh key={side} rotation={[-Math.PI / 2, 0, angle]} position={[mx + perpX * sw * side, 0.025, mz + perpZ * sw * side]}>
                      <planeGeometry args={[0.5, len]} />
                      <meshStandardMaterial color={sidewalkColor} roughness={0.95} />
                    </mesh>
                  );
                })}
              </>
            )}
          </group>
        );
      })}

      {/* Crosswalks at main intersections */}
      {[
        [0, -18], [0, 18], [-18, 0], [18, 0],
      ].map(([x, z], idx) => (
        <group key={`cross-${idx}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x + (i - 2.5) * 0.45, 0.025, z]}>
              <planeGeometry args={[0.3, 2.5]} />
              <meshStandardMaterial color="#DDDDDD" transparent opacity={0.35} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
});

// ── Ground with zone tinting ──
const CityGround = memo(function CityGround() {
  return (
    <group>
      {/* Main ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="hsl(220, 15%, 16%)" roughness={0.95} />
      </mesh>
      {/* Extended ground rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[100, 250, 32]} />
        <meshStandardMaterial color="hsl(220, 12%, 10%)" roughness={0.98} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <ringGeometry args={[250, 600, 32]} />
        <meshStandardMaterial color="hsl(220, 10%, 6%)" roughness={1} />
      </mesh>

      {/* ═══ AI DISTRICT GROUND — teal/cyan tinted ═══ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -28]}>
        <planeGeometry args={[120, 50]} />
        <meshStandardMaterial color="hsl(180, 12%, 14%)" roughness={0.95} />
      </mesh>
      {/* AI glow border line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, -5]}>
        <planeGeometry args={[120, 0.3]} />
        <meshStandardMaterial color="#00E890" emissive="#00E890" emissiveIntensity={0.4} transparent opacity={0.5} />
      </mesh>

      {/* ═══ HUMAN DISTRICT GROUND — warm tinted ═══ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 22]}>
        <planeGeometry args={[120, 50]} />
        <meshStandardMaterial color="hsl(25, 8%, 16%)" roughness={0.95} />
      </mesh>

      {/* Zone ground tints */}
      {CITY_ZONES.filter(z => z.type !== "park" && z.type !== "plaza").map(zone => {
        const zoneColors: Record<string, string> = {
          commercial: "hsl(220, 20%, 18%)",
          skyline: "hsl(230, 18%, 15%)",
          residential: "hsl(30, 10%, 18%)",
          ai: "hsl(170, 15%, 13%)",
        };
        return (
          <mesh key={zone.id} rotation={[-Math.PI / 2, 0, 0]} position={[zone.center.x, 0.005, zone.center.z]}>
            <circleGeometry args={[zone.radius, 32]} />
            <meshStandardMaterial color={zoneColors[zone.type] || "hsl(220, 15%, 18%)"} transparent opacity={0.4} />
          </mesh>
        );
      })}

      {/* Park grass */}
      {CITY_ZONES.filter(z => z.type === "park" || z.type === "plaza").map(zone => (
        <mesh key={zone.id} rotation={[-Math.PI / 2, 0, 0]} position={[zone.center.x, 0.01, zone.center.z]}>
          <circleGeometry args={[zone.radius, 32]} />
          <meshStandardMaterial color={zone.type === "park" ? "hsl(120, 25%, 18%)" : "hsl(220, 12%, 22%)"} roughness={0.95} />
        </mesh>
      ))}

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

      {/* ═══ DISTRICT SECTION LABELS ═══ */}
      <Text
        position={[0, 0.12, 45]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2.5}
        color="#E8A580"
        anchorX="center"
        fillOpacity={0.25}
        font={undefined}
      >
        🏠 HUMAN DISTRICT
      </Text>
      <Text
        position={[0, 0.12, -48]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2.5}
        color="#40C88A"
        anchorX="center"
        fillOpacity={0.25}
        font={undefined}
      >
        🤖 AI DISTRICT
      </Text>

      {/* Individual district labels */}
      {DISTRICTS.map(d => {
        const zone = CITY_ZONES.find(z => z.district === d.id && z.type !== "park" && z.type !== "plaza");
        if (!zone) return null;
        return (
          <Text
            key={d.id}
            position={[zone.center.x, 0.1, zone.center.z + zone.radius + 1.5]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={1}
            color={d.color}
            anchorX="center"
            fillOpacity={0.35}
          >
            {d.emoji} {d.name}
          </Text>
        );
      })}
    </group>
  );
});

// ── Commercial glow planes (warm light pools on ground) ──
const CommercialGlow = memo(function CommercialGlow() {
  return (
    <group>
      {CITY_ZONES.filter(z => z.glowIntensity > 0.4).map(zone => {
        const isAI = zone.type === "ai";
        const glowColor = isAI ? "#00E890" : "#FFD060";
        return (
          <mesh key={zone.id} rotation={[-Math.PI / 2, 0, 0]} position={[zone.center.x, 0.02, zone.center.z]}>
            <circleGeometry args={[zone.radius * 0.6, 24]} />
            <meshStandardMaterial
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={zone.glowIntensity * 0.15}
              transparent
              opacity={zone.glowIntensity * 0.08}
            />
          </mesh>
        );
      })}
    </group>
  );
});

// ── Cinematic lighting ──
function Lighting() {
  const dn = useDayNight();
  return (
    <>
      <ambientLight intensity={dn.ambientIntensity * 0.9} color={dn.ambientColor} />
      <directionalLight
        position={dn.sunPosition}
        intensity={dn.sunIntensity}
        color={dn.sunColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={120}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <hemisphereLight args={[dn.skyColor, dn.groundColor, dn.hemiIntensity * 0.8]} />

      {/* Cool rim light from opposite side — adds depth */}
      <directionalLight position={[20, 15, -30]} intensity={0.15} color="#4488CC" />

      {/* Moon */}
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

// ── Main scene ──
export function CityBuildingsScene({ buildings, targetBuilding, onBuildingClick, flyToTarget }: CityBuildingsSceneProps) {
  const dn = useDayNight();
  const nightIntensity = dn.isNight ? 1 : dn.isSunset ? 0.6 : dn.isSunrise ? 0.4 : 0;

  // Generate NPC buildings to fill the city
  const allBuildings = useMemo(() => {
    const npcBuildings = generateCityLayout(buildings);
    return [...buildings, ...npcBuildings];
  }, [buildings]);

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 30, 50], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: dn.exposure }}
        dpr={[1, 1.5]}
      >
        <fog attach="fog" args={[dn.fogColor, 25, 120]} />
        <Lighting />
        <Sky sunPosition={dn.sunPosition} turbidity={dn.isNight ? 20 : 8} rayleigh={dn.isNight ? 0 : 2} />

        <CityGround />
        <CityStreets />
        <CityTrees />
        <StreetFurniture nightIntensity={nightIntensity} />
        <CommercialGlow />

        {allBuildings.map(b => (
          <Building3D key={b.id} building={b} onClick={() => onBuildingClick?.(b)} highlighted={targetBuilding?.id === b.id} />
        ))}

        <CameraController target={targetBuilding} fly={flyToTarget} />
        <OrbitControls maxPolarAngle={Math.PI / 2.2} minDistance={5} maxDistance={100} enableDamping />
      </Canvas>
    </div>
  );
}
