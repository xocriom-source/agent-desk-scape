import { useMemo } from "react";
import * as THREE from "three";

const ROOM_W = 10;
const ROOM_D = 10;
const WALL_H = 2.5;

export function OfficeRoom() {
  const floorTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Tile pattern
    const tileSize = 64;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const isAlt = (x + y) % 2 === 0;
        ctx.fillStyle = isAlt ? "#E2E8F0" : "#CBD5E1";
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        // Grout lines
        ctx.strokeStyle = "#B0BEC5";
        ctx.lineWidth = 1;
        ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }, []);

  return (
    <group>
      {/* Floor */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial map={floorTexture} roughness={0.6} />
      </mesh>

      {/* Carpet */}
      <mesh rotation-x={-Math.PI / 2} position={[5, 0.01, 3.5]}>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color="#4338CA" roughness={0.9} transparent opacity={0.2} />
      </mesh>

      {/* Back wall */}
      <mesh position={[ROOM_W / 2, WALL_H / 2, 0]} receiveShadow>
        <boxGeometry args={[ROOM_W, WALL_H, 0.1]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.8} />
      </mesh>

      {/* Left wall */}
      <mesh position={[0, WALL_H / 2, ROOM_D / 2]} receiveShadow>
        <boxGeometry args={[0.1, WALL_H, ROOM_D]} />
        <meshStandardMaterial color="#D1D5DB" roughness={0.8} />
      </mesh>

      {/* Right wall (partial, with window gap) */}
      <mesh position={[ROOM_W, WALL_H / 2, ROOM_D / 2]} receiveShadow>
        <boxGeometry args={[0.1, WALL_H, ROOM_D]} />
        <meshStandardMaterial color="#D1D5DB" roughness={0.8} />
      </mesh>

      {/* Window on back wall */}
      <mesh position={[5, 1.5, -0.01]}>
        <planeGeometry args={[3, 1.5]} />
        <meshBasicMaterial color="#87CEEB" transparent opacity={0.4} />
      </mesh>
      {/* Window frame */}
      <mesh position={[5, 1.5, 0.01]}>
        <boxGeometry args={[3.1, 1.6, 0.05]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.4} />
      </mesh>
      {/* Window cross */}
      <mesh position={[5, 1.5, 0.03]}>
        <boxGeometry args={[0.05, 1.5, 0.02]} />
        <meshStandardMaterial color="#94A3B8" />
      </mesh>
      <mesh position={[5, 1.5, 0.03]}>
        <boxGeometry args={[3, 0.05, 0.02]} />
        <meshStandardMaterial color="#94A3B8" />
      </mesh>

      {/* Baseboard */}
      <mesh position={[ROOM_W / 2, 0.05, 0.02]}>
        <boxGeometry args={[ROOM_W, 0.1, 0.05]} />
        <meshStandardMaterial color="#64748B" roughness={0.6} />
      </mesh>

      {/* Ceiling light strips */}
      {[3, 7].map((x) => (
        <group key={x}>
          <mesh position={[x, WALL_H - 0.05, ROOM_D / 2]}>
            <boxGeometry args={[0.3, 0.05, 6]} />
            <meshStandardMaterial color="#F1F5F9" roughness={0.2} />
          </mesh>
          <pointLight
            position={[x, WALL_H - 0.1, ROOM_D / 2]}
            intensity={0.4}
            distance={8}
            color="#FFF8E7"
          />
        </group>
      ))}
    </group>
  );
}
