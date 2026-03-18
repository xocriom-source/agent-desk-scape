import { useState, memo, useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { CityBuilding } from "@/types/building";
import { BuildingProps, useBuildingProps } from "./VoxelProps";
import { GLBBuildingModel, GLBDetailModel } from "./GLBBuildingModel";

interface Building3DProps {
  building: CityBuilding;
  onClick?: () => void;
  highlighted?: boolean;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

export const Building3D = memo(function Building3D({ building, onClick, highlighted = false }: Building3DProps) {
  const [hovered, setHovered] = useState(false);
  const seed = useMemo(() => hash(building.id), [building.id]);
  const h = building.height;
  const w = 2.5;
  const d = 2.2;

  const buildingProps = useBuildingProps(building.id, w, d, h);

  return (
    <group
      position={[building.coordinates.x, 0, building.coordinates.z]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* ── GLB Building Model — SOLE body, no voxel fallback ── */}
      <GLBBuildingModel
        buildingId={building.id}
        height={h}
        primaryColor={building.primaryColor}
        isSkyscraper={h > 7}
      />

      {/* ── GLB Detail props (awnings, parasols) ── */}
      {seed % 3 === 0 && (
        <GLBDetailModel seed={seed} position={[0, 0, d / 2 + 0.3]} scale={h * 0.15} />
      )}
      {seed % 5 === 0 && (
        <GLBDetailModel seed={seed + 3} position={[w / 2 + 0.5, 0, 0]} scale={0.8} />
      )}

      {/* ── Neon Sign ── */}
      {building.customizations.neonSign && (
        <group position={[0, h * 0.7, d / 2 + 0.06]}>
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[w * 0.8, 0.35, 0.04]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <Text
            position={[0, 0, 0.02]}
            fontSize={0.22}
            color={building.primaryColor}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="black"
            maxWidth={w * 0.75}
          >
            {building.name}
          </Text>
        </group>
      )}

      {/* ── Hologram ── */}
      {building.customizations.hologram && (
        <group position={[0, h + 0.8, 0]}>
          <mesh>
            <boxGeometry args={[0.35, 0.35, 0.35]} />
            <meshStandardMaterial
              color={building.primaryColor}
              emissive={building.primaryColor}
              emissiveIntensity={0.8}
              transparent
              opacity={0.5}
              wireframe
            />
          </mesh>
        </group>
      )}

      {/* ── Building props (benches, plants, signs, etc.) ── */}
      <BuildingProps props={buildingProps} />

      {/* ── Hover label ── */}
      {hovered && (
        <group position={[0, h + 1.5, 0]}>
          <mesh position={[0, 0, -0.05]}>
            <boxGeometry args={[2.5, 0.8, 0.05]} />
            <meshStandardMaterial color="#111" transparent opacity={0.85} />
          </mesh>
          <Text fontSize={0.35} color="white" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="black">
            {building.name}
          </Text>
          <Text position={[0, -0.35, 0]} fontSize={0.2} color="#9ca3af" anchorX="center" anchorY="middle">
            {building.claimed ? `👤 ${building.ownerName}` : "🏷️ Available"}
          </Text>
        </group>
      )}

      {/* ── Highlighted ring ── */}
      {highlighted && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[w * 0.7, w * 0.7 + 0.4, 4]} />
          <meshStandardMaterial color={building.primaryColor} emissive={building.primaryColor} emissiveIntensity={1} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
});
