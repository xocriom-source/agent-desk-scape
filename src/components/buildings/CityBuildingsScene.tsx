import { useRef, useEffect, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sky, Text, Environment } from "@react-three/drei";
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
        <Sky sunPosition={[dn.sunPosition.x, dn.sunPosition.y, dn.sunPosition.z]} turbidity={dn.isNight ? 20 : 8} rayleigh={dn.isNight ? 0 : 2} />
        
        <CityGround />
        
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
