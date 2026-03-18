import { memo, useMemo, useRef, Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { pickBuildingModel, pickDetailModel, GLB_BUILDINGS, GLB_SKYSCRAPERS } from "@/data/glbAssetRegistry";

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

interface GLBBuildingModelProps {
  buildingId: string;
  height: number;
  primaryColor?: string;
  isSkyscraper?: boolean;
}

/** Renders a GLB model scaled/colored to fit the city building slot */
function GLBBuildingModelInner({ buildingId, height, primaryColor, isSkyscraper = false }: GLBBuildingModelProps) {
  const seed = useMemo(() => hash(buildingId), [buildingId]);
  const asset = useMemo(() => pickBuildingModel(seed, isSkyscraper), [seed, isSkyscraper]);

  const { scene } = useGLTF(asset.path);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Compute bounding box to normalize scale
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Scale to fit target height
    const targetHeight = height;
    const scaleFactor = targetHeight / Math.max(size.y, 0.1);
    clone.scale.setScalar(scaleFactor * asset.scale);

    // Center on ground
    const newBox = new THREE.Box3().setFromObject(clone);
    clone.position.y = -newBox.min.y;

    // Apply rotation variation
    const rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    clone.rotation.y = rotations[seed % rotations.length];

    // Tint with building color
    if (primaryColor) {
      const tintColor = new THREE.Color(primaryColor);
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
            // Blend original color with building color
            if (mat.color) {
              mat.color.lerp(tintColor, 0.15);
            }
            mesh.material = mat;
          }
        }
      });
    }

    return clone;
  }, [scene, height, primaryColor, seed, asset.scale]);

  return <primitive object={clonedScene} />;
}

/** Wrapped with Suspense — falls back to nothing while loading */
export const GLBBuildingModel = memo(function GLBBuildingModel(props: GLBBuildingModelProps) {
  return (
    <Suspense fallback={null}>
      <GLBBuildingModelInner {...props} />
    </Suspense>
  );
});

/** Detail prop model (awning, parasol, etc) */
function GLBDetailModelInner({ seed, position, scale = 1 }: { seed: number; position: [number, number, number]; scale?: number }) {
  const asset = useMemo(() => pickDetailModel(seed), [seed]);
  const { scene } = useGLTF(asset.path);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.scale.setScalar(scale * asset.scale);
    // Center
    const box = new THREE.Box3().setFromObject(clone);
    clone.position.y = -box.min.y;
    clone.rotation.y = (seed % 4) * Math.PI / 2;
    return clone;
  }, [scene, scale, seed, asset.scale]);

  return (
    <group position={position}>
      <primitive object={clonedScene} />
    </group>
  );
}

export const GLBDetailModel = memo(function GLBDetailModel(props: { seed: number; position: [number, number, number]; scale?: number }) {
  return (
    <Suspense fallback={null}>
      <GLBDetailModelInner {...props} />
    </Suspense>
  );
});

// Preload all building models
export function preloadBuildingModels() {
  [...GLB_BUILDINGS, ...GLB_SKYSCRAPERS].forEach(asset => {
    useGLTF.preload(asset.path);
  });
}
