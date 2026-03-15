import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import { OfficeRoom } from "./OfficeRoom";
import { Agent3D } from "./Agent3D";
import { Furniture3D } from "./Furniture3D";
import type { Agent, FurnitureItem } from "@/types/agent";

interface OfficeScene3DProps {
  agents: Agent[];
  furniture: FurnitureItem[];
  selectedAgentId?: string;
  onAgentClick: (agent: Agent) => void;
}

export function OfficeScene3D({
  agents,
  furniture,
  selectedAgentId,
  onAgentClick,
}: OfficeScene3DProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{
          position: [12, 10, 14],
          fov: 40,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#E8EEF4"]} />
        <fog attach="fog" args={["#E8EEF4", 20, 40]} />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[8, 12, 8]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={30}
          shadow-camera-left={-12}
          shadow-camera-right={12}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
        />
        <hemisphereLight
          args={["#87CEEB", "#E2E8F0", 0.3]}
        />

        <Suspense fallback={null}>
          {/* Room */}
          <OfficeRoom />

          {/* Furniture */}
          {furniture.map((item) => (
            <Furniture3D key={item.id} item={item} />
          ))}

          {/* Agents */}
          {agents.map((agent) => (
            <Agent3D
              key={agent.id}
              agent={agent}
              isSelected={agent.id === selectedAgentId}
              onClick={() => onAgentClick(agent)}
            />
          ))}
        </Suspense>

        <OrbitControls
          makeDefault
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2.5}
          minDistance={6}
          maxDistance={25}
          target={[5, 0, 5]}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
