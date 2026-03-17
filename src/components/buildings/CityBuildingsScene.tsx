import { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sky, Text, Environment, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Building3D } from "./Building3D";
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
      targetPos.current.set(
        target.coordinates.x + 8,
        target.height + 6,
        target.coordinates.z + 12
      );
      lookTarget.current.set(target.coordinates.x, target.height / 2, target.coordinates.z);
    }
  }, [target, fly]);

  useFrame((_, delta) => {
    if (isFlying.current && progress.current < 1) {
      progress.current = Math.min(1, progress.current + delta * 0.3);
      const t = 1 - Math.pow(1 - progress.current, 3); // ease out cubic
      
      camera.position.lerp(targetPos.current, t * 0.05);
      const currentLook = new THREE.Vector3();
      currentLook.lerp(lookTarget.current, t * 0.05);
      camera.lookAt(lookTarget.current);
      
      if (progress.current >= 1) isFlying.current = false;
    }
  });

  return null;
}

function CityGround() {
  return (
    <group>
      {/* Main ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="hsl(220, 15%, 18%)" roughness={0.95} />
      </mesh>
      {/* Infinite landscape rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[100, 250, 32]} />
        <meshStandardMaterial color="hsl(220, 12%, 12%)" roughness={0.98} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <ringGeometry args={[250, 600, 32]} />
        <meshStandardMaterial color="hsl(220, 10%, 8%)" roughness={1} />
      </mesh>
      {/* Distant hill silhouettes */}
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
      {/* Grid lines */}
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
            <Text
              position={[0, 0.1, -11]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={1}
              color={d.color}
              anchorX="center"
              fillOpacity={0.4}
            >
              {d.emoji} {d.name}
            </Text>
          </group>
        );
      })}
      
      {/* Roads */}
      {[-1, 1].map(dir => (
        <mesh key={`road-x-${dir}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, dir * 10]}>
          <planeGeometry args={[200, 2]} />
          <meshStandardMaterial color="hsl(220, 10%, 25%)" roughness={0.8} />
        </mesh>
      ))}
      {[-1, 1].map(dir => (
        <mesh key={`road-z-${dir}`} rotation={[-Math.PI / 2, 0, 0]} position={[dir * 10, 0.02, 0]}>
          <planeGeometry args={[2, 200]} />
          <meshStandardMaterial color="hsl(220, 10%, 25%)" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Lighting() {
  const dn = useDayNight();
  const lightMult = dn.isNight ? 1 : dn.isSunset ? 0.6 : dn.isSunrise ? 0.4 : 0;
  return (
    <>
      <ambientLight intensity={dn.ambientIntensity} color={dn.ambientColor} />
      <directionalLight
        position={dn.sunPosition}
        intensity={dn.sunIntensity}
        color={dn.sunColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight args={[dn.skyColor, dn.groundColor, dn.hemiIntensity]} />
      {/* Moon */}
      {dn.isNight && (
        <group position={[-25, 35, -20]}>
          <mesh>
            <sphereGeometry args={[2.5, 16, 16]} />
            <meshBasicMaterial color="#E8E8F0" />
          </mesh>
          <mesh>
            <sphereGeometry args={[4, 16, 16]} />
            <meshBasicMaterial color="#8899CC" transparent opacity={0.08} />
          </mesh>
          <directionalLight intensity={0.25} color="#8899CC" />
        </group>
      )}
      {dn.showStars && <Stars radius={100} depth={50} count={1500} factor={4} saturation={0.3} fade speed={0.5} />}
      {/* Street light point lights - key intersections */}
      {[[-20,-20],[-20,20],[20,-20],[20,20],[0,-10],[0,10],[-10,0],[10,0]].map(([x,z],i) => (
        lightMult > 0 ? (
          <pointLight key={`pl-${i}`} position={[x, 2.5, z]} color="#FFD060" intensity={lightMult * 3} distance={10} decay={2} />
        ) : null
      ))}
    </>
  );
}

export function CityBuildingsScene({ buildings, targetBuilding, onBuildingClick, flyToTarget }: CityBuildingsSceneProps) {
  const dn = useDayNight();
  
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 30, 50], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: dn.exposure }}
      >
        <fog attach="fog" args={[dn.fogColor, 30, 150]} />
        <Lighting />
        <Sky sunPosition={dn.sunPosition} turbidity={dn.isNight ? 20 : 8} rayleigh={dn.isNight ? 0 : 2} />
        
        <CityGround />
        
        {/* Street lights */}
        {[[-20,-20],[-20,20],[20,-20],[20,20],[-10,0],[10,0],[0,-10],[0,10]].map(([x,z],i) => (
          <group key={`sl-${i}`} position={[x, 0, z]}>
            <mesh position={[0, 1.1, 0]}>
              <cylinderGeometry args={[0.02, 0.035, 2.2, 4]} />
              <meshStandardMaterial color="#2A2A2A" metalness={0.7} />
            </mesh>
            <mesh position={[0, 2.25, 0]}>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial color="#FFE8A0" emissive="#FFD060" emissiveIntensity={2.5} />
            </mesh>
          </group>
        ))}
        
        {/* Trees */}
        {[[-15,-15],[-15,15],[15,-15],[15,15],[-25,0],[25,0],[0,-25],[0,25],[-8,15],[8,-15]].map(([x,z],i) => (
          <group key={`tree-${i}`} position={[x, 0, z]}>
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.06, 0.1, 0.8, 5]} />
              <meshStandardMaterial color="#5A3A20" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1, 0]}>
              <sphereGeometry args={[0.7, 6, 5]} />
              <meshStandardMaterial color={["#1A6B2A","#2D5A1E","#1B7A30","#3A7A2A"][i%4]} roughness={0.85} />
            </mesh>
          </group>
        ))}
        
        {buildings.map(b => (
          <Building3D
            key={b.id}
            building={b}
            onClick={() => onBuildingClick?.(b)}
            highlighted={targetBuilding?.id === b.id}
          />
        ))}

        <CameraController target={targetBuilding} fly={flyToTarget} />
        <OrbitControls
          maxPolarAngle={Math.PI / 2.2}
          minDistance={5}
          maxDistance={100}
          enableDamping
        />
      </Canvas>
    </div>
  );
}
