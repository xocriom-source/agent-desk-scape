import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import type { Agent } from "@/types/agent";

interface Agent3DProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

export function Agent3D({ agent, isSelected, onClick }: Agent3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const targetPos = useMemo(
    () => new THREE.Vector3(agent.position.x, 0, agent.position.z),
    [agent.position.x, agent.position.z]
  );

  const color = useMemo(() => new THREE.Color(agent.color), [agent.color]);
  const darkerColor = useMemo(() => {
    const c = new THREE.Color(agent.color);
    c.multiplyScalar(0.7);
    return c;
  }, [agent.color]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smooth movement
    groupRef.current.position.lerp(targetPos, delta * 3);

    // Bobbing animation
    if (bodyRef.current) {
      const time = Date.now() * 0.003;
      const bobAmount = agent.status === "idle" ? 0.02 : 0.06;
      bodyRef.current.position.y = 0.5 + Math.sin(time + parseInt(agent.id.slice(-1)) * 2) * bobAmount;
    }
  });

  const statusColor =
    agent.status === "active" ? "#10B981" : agent.status === "thinking" ? "#6366F1" : "#F59E0B";

  return (
    <group
      ref={groupRef}
      position={[agent.position.x, 0, agent.position.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "default")}
    >
      {/* Shadow */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.01}>
        <circleGeometry args={[0.35, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.15} />
      </mesh>

      {/* Body */}
      <mesh ref={bodyRef} position-y={0.5} castShadow>
        {/* Torso */}
        <boxGeometry args={[0.5, 0.55, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Head */}
      <mesh position-y={1.05} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.15} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.1, 1.1, 0.18]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.1, 1.1, 0.18]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Eye pupils */}
      <mesh position={[-0.1, 1.09, 0.19]}>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.1, 1.09, 0.19]}>
        <boxGeometry args={[0.04, 0.04, 0.02]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.15]} />
        <meshStandardMaterial color={darkerColor} />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={agent.status === "thinking" ? 1.5 : 0.5}
        />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.35, 0.5, 0]} castShadow>
        <boxGeometry args={[0.15, 0.4, 0.2]} />
        <meshStandardMaterial color={darkerColor} roughness={0.4} />
      </mesh>
      <mesh position={[0.35, 0.5, 0]} castShadow>
        <boxGeometry args={[0.15, 0.4, 0.2]} />
        <meshStandardMaterial color={darkerColor} roughness={0.4} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.12, 0.15, 0]}>
        <boxGeometry args={[0.15, 0.3, 0.2]} />
        <meshStandardMaterial color={darkerColor} roughness={0.5} />
      </mesh>
      <mesh position={[0.12, 0.15, 0]}>
        <boxGeometry args={[0.15, 0.3, 0.2]} />
        <meshStandardMaterial color={darkerColor} roughness={0.5} />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
          <ringGeometry args={[0.45, 0.55, 24]} />
          <meshBasicMaterial color="#6366F1" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Thinking particles */}
      {agent.status === "thinking" && (
        <>
          <ThinkingBubble offset={0} />
          <ThinkingBubble offset={1} />
          <ThinkingBubble offset={2} />
        </>
      )}

      {/* Name label */}
      <Billboard position-y={1.7}>
        <Text
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#0F172A"
          font={undefined}
        >
          {agent.name}
        </Text>
        <Text
          fontSize={0.1}
          color={statusColor}
          anchorX="center"
          anchorY="middle"
          position-y={-0.18}
          outlineWidth={0.015}
          outlineColor="#0F172A"
          font={undefined}
        >
          {agent.role}
        </Text>
      </Billboard>
    </group>
  );
}

function ThinkingBubble({ offset }: { offset: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    const t = Date.now() * 0.002 + offset * 2;
    ref.current.position.x = Math.sin(t) * 0.3;
    ref.current.position.y = 1.6 + Math.sin(t * 1.5) * 0.15 + offset * 0.12;
    ref.current.position.z = Math.cos(t) * 0.3;
    ref.current.scale.setScalar(0.5 + Math.sin(t) * 0.2);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.04, 6, 6]} />
      <meshBasicMaterial color="#6366F1" transparent opacity={0.6} />
    </mesh>
  );
}
