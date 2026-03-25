/**
 * LODManager — Camera-based level-of-detail for city buildings.
 * DEBUG: LOD culling disabled to ensure all geometry is visible.
 */

import * as THREE from "three";

export interface LODConfig {
  nearDistance: number;
  midDistance: number;
  farDistance: number;
}

const DEFAULT_CONFIG: LODConfig = {
  nearDistance: 100,
  midDistance: 300,
  farDistance: 800,
};

export class LODManager {
  private config: LODConfig;
  private groups: THREE.Group[] = [];

  constructor(config: Partial<LODConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log("[LODManager] Initialized (culling DISABLED for debug)");
  }

  registerGroup(group: THREE.Group) {
    this.groups.push(group);
  }

  /**
   * DEBUG: LOD update disabled — all objects remain visible.
   * Re-enable distance culling once city renders correctly.
   */
  update(_cameraPosition: THREE.Vector3) {
    // LOD disabled for debugging — everything stays visible
    return;
  }

  getConfig(): LODConfig {
    return { ...this.config };
  }
}
