import { memo, useMemo, Suspense } from "react";
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

/** Visible fallback — red wireframe box so we SEE when GLB fails */
function GLBFallback({ height }: { height: number }) {
  return (
    <mesh position={[0, height / 2, 0]}>
      <boxGeometry args={[2, height, 2]} />
      <meshStandardMaterial color="#FF0000" wireframe />
    </mesh>
  );
}

/** Renders a GLB model scaled/colored to fit the city building slot */
function GLBBuildingModelInner({ buildingId, height, primaryColor, isSkyscraper = false }: GLBBuildingModelProps) {
  const seed = useMemo(() => hash(buildingId), [buildingId]);
  const asset = useMemo(() => pickBuildingModel(seed, isSkyscraper), [seed, isSkyscraper]);

  // useGLTF must be called unconditionally (React hook rules)
  const { scene } = useGLTF(asset.path);

  // Debug: log which model is being used
  useMemo(() => {
    console.log(`[GLB] Building "${buildingId}" → model: ${asset.id} (${asset.path}), height: ${height}, skyscraper: ${isSkyscraper}`);
  }, [buildingId, asset.id, asset.path, height, isSkyscraper]);

  const clonedScene = useMemo(() => {
    if (!scene) {
      console.error(`[GLB] No scene returned for ${asset.path}`);
      return null;
    }

    const clone = scene.clone(true);

    // Compute bounding box to normalize scale
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);

    console.log(`[GLB] ${asset.id} original size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);

    if (size.y < 0.001) {
      console.warn(`[GLB] ${asset.id} has near-zero height! Model may be empty or flat.`);
    }

    // Scale to fit target height
    const scaleFactor = height / Math.max(size.y, 0.01);
    clone.scale.setScalar(scaleFactor * asset.scale);

    // Re-center on ground after scaling
    const newBox = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    newBox.getCenter(center);
    clone.position.x = -center.x;
    clone.position.z = -center.z;
    clone.position.y = -newBox.min.y;

    // Apply rotation variation
    const rotations = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    clone.rotation.y = rotations[seed % rotations.length];

    // Apply building color strongly to all meshes
    clone.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;

      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;

      if (!primaryColor) return;

      const tintColor = new THREE.Color(primaryColor);
      const originalMaterial = mesh.material;
      const isMultiMaterial = Array.isArray(originalMaterial);
      const materials = isMultiMaterial ? originalMaterial : [originalMaterial];

      const tintedMaterials = materials
        .filter(Boolean)
        .map((material) => {
          const clonedMaterial = material.clone() as THREE.Material & {
            color?: THREE.Color;
            roughness?: number;
          };

          if (clonedMaterial.color instanceof THREE.Color) {
            const origLightness = clonedMaterial.color.getHSL({ h: 0, s: 0, l: 0 }).l;
            clonedMaterial.color.lerp(tintColor, 0.65);
            const tintHSL = clonedMaterial.color.getHSL({ h: 0, s: 0, l: 0 });
            const blendedL = tintHSL.l * 0.6 + origLightness * 0.4;
            clonedMaterial.color.setHSL(tintHSL.h, tintHSL.s * 0.9, blendedL);
          }

          if ("roughness" in clonedMaterial && typeof clonedMaterial.roughness === "number") {
            clonedMaterial.roughness = Math.min(clonedMaterial.roughness, 0.85);
          }

          clonedMaterial.needsUpdate = true;
          return clonedMaterial;
        });

      if (tintedMaterials.length > 0) {
        mesh.material = isMultiMaterial ? tintedMaterials : tintedMaterials[0];
      }
    });

    // Count meshes for debug
    let meshCount = 0;
    clone.traverse((c) => { if ((c as THREE.Mesh).isMesh) meshCount++; });
    console.log(`[GLB] ${asset.id} → ${meshCount} meshes, final scale: ${clone.scale.x.toFixed(3)}`);

    return clone;
  }, [scene, height, primaryColor, seed, asset.scale, asset.id, asset.path]);

  if (!clonedScene) {
    return <GLBFallback height={height} />;
  }

  return <primitive object={clonedScene} />;
}

/** Wrapped with Suspense — shows red wireframe while loading */
export const GLBBuildingModel = memo(function GLBBuildingModel(props: GLBBuildingModelProps) {
  return (
    <Suspense fallback={<GLBFallback height={props.height} />}>
      <GLBBuildingModelInner {...props} />
    </Suspense>
  );
});

/** Detail prop model (awning, parasol, etc) */
function GLBDetailModelInner({ seed, position, scale = 1 }: { seed: number; position: [number, number, number]; scale?: number }) {
  const asset = useMemo(() => pickDetailModel(seed), [seed]);
  const { scene } = useGLTF(asset.path);

  const clonedScene = useMemo(() => {
    if (!scene) return null;
    const clone = scene.clone(true);
    clone.scale.setScalar(scale * asset.scale);
    const box = new THREE.Box3().setFromObject(clone);
    clone.position.y = -box.min.y;
    clone.rotation.y = (seed % 4) * Math.PI / 2;
    return clone;
  }, [scene, scale, seed, asset.scale]);

  if (!clonedScene) return null;

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
  const allPaths = [...GLB_BUILDINGS, ...GLB_SKYSCRAPERS];
  console.log(`[GLB] Preloading ${allPaths.length} building models...`);
  allPaths.forEach(asset => {
    useGLTF.preload(asset.path);
  });
}
