import { useRef, useState, memo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { CityBuilding } from "@/types/building";

interface Building3DProps {
  building: CityBuilding;
  onClick?: () => void;
  highlighted?: boolean;
}

const STYLE_GEOMETRY: Record<string, { widthTop: number; widthBottom: number; segments: number }> = {
  corporate: { widthTop: 2.2, widthBottom: 2.4, segments: 4 },
  creative: { widthTop: 2, widthBottom: 2.5, segments: 6 },
  startup: { widthTop: 1.5, widthBottom: 2, segments: 4 },
  tech: { widthTop: 2, widthBottom: 2, segments: 4 },
  agency: { widthTop: 2.3, widthBottom: 2.3, segments: 4 },
  minimal: { widthTop: 1.8, widthBottom: 1.8, segments: 4 },
  futuristic: { widthTop: 1.5, widthBottom: 2.5, segments: 8 },
  industrial: { widthTop: 2.5, widthBottom: 2.5, segments: 4 },
};

// Shared color instances to avoid GC pressure
const BLACK = new THREE.Color(0x000000);
const WINDOW_COLOR = new THREE.Color("hsl(45, 90%, 70%)");

export const Building3D = memo(function Building3D({ building, onClick, highlighted = false }: Building3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const geo = STYLE_GEOMETRY[building.style] || STYLE_GEOMETRY.corporate;
  const h = building.height;
  const color = new THREE.Color(building.primaryColor);
  const secColor = new THREE.Color(building.secondaryColor);

  const windowFloors = Math.min(building.floors, 6); // Cap window rows for perf

  return (
    <group
      position={[building.coordinates.x, 0, building.coordinates.z]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main building body */}
      <mesh ref={meshRef} position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[geo.widthBottom, h, geo.widthBottom]} />
        <meshStandardMaterial
          color={color}
          emissive={highlighted || hovered ? color : BLACK}
          emissiveIntensity={highlighted ? 0.3 : hovered ? 0.15 : 0}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Windows - emissive strips on 2 sides only (perf) */}
      {Array.from({ length: windowFloors }).map((_, floor) => (
        <group key={floor}>
          {[-1, 1].map(side => (
            <mesh key={side} position={[side * (geo.widthBottom / 2 + 0.01), 1 + floor * (h / building.floors), 0]}>
              <planeGeometry args={[0.01, 0.4]} />
              <meshStandardMaterial emissive={WINDOW_COLOR} emissiveIntensity={0.8} color="black" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Roof accent */}
      <mesh position={[0, h + 0.15, 0]} castShadow>
        <boxGeometry args={[geo.widthTop + 0.3, 0.3, geo.widthTop + 0.3]} />
        <meshStandardMaterial color={secColor} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Neon sign */}
      {building.customizations.neonSign && (
        <Text
          position={[0, h + 0.8, geo.widthBottom / 2 + 0.1]}
          fontSize={0.35}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor={building.primaryColor}
          maxWidth={4}
        >
          {building.name}
        </Text>
      )}

      {/* Rooftop antenna */}
      {building.customizations.rooftop && (
        <mesh position={[0, h + 1, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.5, 6]} />
          <meshStandardMaterial color="gray" metalness={0.8} />
        </mesh>
      )}

      {/* Garden at base */}
      {building.customizations.garden && (
        <mesh position={[geo.widthBottom / 2 + 0.8, 0.3, 0]}>
          <sphereGeometry args={[0.5, 6, 6]} />
          <meshStandardMaterial color="hsl(120, 60%, 35%)" roughness={0.9} />
        </mesh>
      )}

      {/* Hologram effect */}
      {building.customizations.hologram && (
        <mesh position={[0, h + 1.8, 0]}>
          <dodecahedronGeometry args={[0.4, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            transparent
            opacity={0.5}
            wireframe
          />
        </mesh>
      )}

      {/* Hover label - lightweight Text instead of Html DOM */}
      {hovered && (
        <group position={[0, h + 2, 0]}>
          <Text
            fontSize={0.5}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="black"
          >
            {building.name}
          </Text>
          <Text
            position={[0, -0.5, 0]}
            fontSize={0.3}
            color="#9ca3af"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="black"
          >
            {building.claimed ? building.ownerName : "Available"}
          </Text>
        </group>
      )}

      {/* Highlighted ring */}
      {highlighted && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[geo.widthBottom, geo.widthBottom + 0.5, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
            transparent
            opacity={0.6}
          />
        </mesh>
      )}
    </group>
  );
});
