/**
 * WorldTerrain — Generates a 3D terrain mesh with procedural elevation.
 * Optimized: reduced resolution, fewer horizon hills, cached geometry.
 */

import { useMemo } from "react";
import * as THREE from "three";
import { getTerrainHeight } from "@/systems/city/WorldGenerator";

interface WorldTerrainProps {
  size?: number;
  resolution?: number;
}

export function WorldTerrain({ size = 400, resolution = 64 }: WorldTerrainProps) {
  const { geometry, farGeometry } = useMemo(() => {
    // Main terrain
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    geo.rotateX(-Math.PI / 2);
    const positions = geo.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = getTerrainHeight(x, z);
      positions.setY(i, y);
    }
    
    positions.needsUpdate = true;
    geo.computeVertexNormals();
    
    // Far ring terrain (for horizon) — lower res
    const farGeo = new THREE.RingGeometry(size / 2, size * 1.5, 32, 4);
    farGeo.rotateX(-Math.PI / 2);
    const farPos = farGeo.attributes.position;
    for (let i = 0; i < farPos.count; i++) {
      const x = farPos.getX(i);
      const z = farPos.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      const y = getTerrainHeight(x, z) * Math.max(0, 1 - (dist - size / 2) / (size * 1.5));
      farPos.setY(i, y - 0.5);
    }
    farPos.needsUpdate = true;
    farGeo.computeVertexNormals();
    
    return { geometry: geo, farGeometry: farGeo };
  }, [size, resolution]);
  
  return (
    <group>
      {/* Main terrain */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          color="#1A1E24"
          roughness={0.95}
          metalness={0}
          flatShading
        />
      </mesh>
      
      {/* Far terrain ring */}
      <mesh geometry={farGeometry}>
        <meshStandardMaterial
          color="#111610"
          roughness={1}
          metalness={0}
        />
      </mesh>
      
      {/* Distant horizon hills — reduced count */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const dist = size * 0.7 + Math.sin(i * 2.7) * size * 0.12;
        const hh = 8 + Math.sin(i * 1.3) * 5;
        const ww = 50 + Math.sin(i * 0.7) * 20;
        return (
          <mesh key={i} position={[Math.cos(angle) * dist, hh / 2 - 2, Math.sin(angle) * dist]}>
            <sphereGeometry args={[ww, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#0A0F0A" roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}
