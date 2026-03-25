/**
 * GLBLoader — Cached GLTF/GLB loader for vanilla Three.js.
 * Provides a promise-based loadModel() with internal dedup cache.
 */

import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const cache = new Map<string, Promise<GLTF>>();

/**
 * Load a GLB/GLTF model with internal caching.
 * Returns a cloned scene so each caller gets an independent instance.
 */
export function loadModel(path: string): Promise<GLTF> {
  if (!cache.has(path)) {
    console.log(`[GLBLoader] Loading: ${path}`);
    const promise = new Promise<GLTF>((resolve, reject) => {
      loader.load(
        path,
        (gltf) => {
          console.log(`[GLBLoader] Loaded: ${path}`);
          resolve(gltf);
        },
        undefined,
        (err) => {
          console.error(`[GLBLoader] Failed: ${path}`, err);
          cache.delete(path);
          reject(err);
        }
      );
    });
    cache.set(path, promise);
  }
  return cache.get(path)!;
}

/**
 * Load and return a cloned scene from a GLB.
 * Each call returns an independent Three.js Group.
 */
export async function loadModelClone(path: string): Promise<THREE.Group> {
  const gltf = await loadModel(path);
  return gltf.scene.clone(true);
}

/** Clear the model cache */
export function clearModelCache(): void {
  cache.clear();
  console.log("[GLBLoader] Cache cleared");
}

/** Get the number of cached models */
export function getCacheSize(): number {
  return cache.size;
}
