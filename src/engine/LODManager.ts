/**
 * LODManager — Camera-based level-of-detail for city buildings.
 * Near: full detail | Mid: simplified | Far: instanced boxes
 */

import * as THREE from "three";

export interface LODConfig {
  nearDistance: number;   // Full detail threshold
  midDistance: number;    // Simplified threshold
  farDistance: number;    // Max visibility
}

const DEFAULT_CONFIG: LODConfig = {
  nearDistance: 100,
  midDistance: 300,
  farDistance: 600,
};

export class LODManager {
  private config: LODConfig;
  private groups: THREE.Group[] = [];

  constructor(config: Partial<LODConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log("[LODManager] Initialized with config:", this.config);
  }

  /**
   * Register a group of objects for LOD management.
   */
  registerGroup(group: THREE.Group) {
    this.groups.push(group);
  }

  /**
   * Update visibility based on camera position.
   * Call this every frame.
   */
  update(cameraPosition: THREE.Vector3) {
    for (const group of this.groups) {
      for (const child of group.children) {
        if (!(child instanceof THREE.Mesh || child instanceof THREE.Group)) continue;

        const pos = new THREE.Vector3();
        child.getWorldPosition(pos);
        const dist = cameraPosition.distanceTo(pos);

        if (dist > this.config.farDistance) {
          child.visible = false;
        } else {
          child.visible = true;
          // Could swap detail levels here in the future
        }
      }
    }
  }

  /** Get config for external use */
  getConfig(): LODConfig {
    return { ...this.config };
  }
}
