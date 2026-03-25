/**
 * LODManager — 3-tier camera-based level-of-detail for city buildings.
 * Near (<100u): Full GLB models (when available)
 * Mid (<300u): Extruded geometry (real OSM footprints)
 * Far (<800u): Instanced simplified meshes
 * Beyond 800u: Hidden
 */

import * as THREE from "three";

export interface LODConfig {
  nearDistance: number;   // Full GLB threshold
  midDistance: number;    // Extrude threshold
  farDistance: number;    // Instanced / max visibility
}

const DEFAULT_CONFIG: LODConfig = {
  nearDistance: 100,
  midDistance: 300,
  farDistance: 800,
};

export type LODTier = "glb" | "extrude" | "instanced" | "hidden";

export class LODManager {
  private config: LODConfig;
  private extrudeGroup: THREE.Group | null = null;
  private glbGroup: THREE.Group | null = null;
  private instancedGroup: THREE.Group | null = null;
  private enabled = true;

  constructor(config: Partial<LODConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log("[LODManager] Initialized with 3-tier LOD:", this.config);
  }

  /** Register the extruded buildings group */
  registerExtrudeGroup(group: THREE.Group) {
    this.extrudeGroup = group;
  }

  /** Register the GLB models group */
  registerGLBGroup(group: THREE.Group) {
    this.glbGroup = group;
  }

  /** Register the instanced buildings group */
  registerInstancedGroup(group: THREE.Group) {
    this.instancedGroup = group;
  }

  /** Enable/disable LOD system */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    console.log(`[LODManager] ${enabled ? "Enabled" : "Disabled"}`);
  }

  /** Get LOD tier for a given distance */
  getTier(distance: number): LODTier {
    if (distance < this.config.nearDistance) return "glb";
    if (distance < this.config.midDistance) return "extrude";
    if (distance < this.config.farDistance) return "instanced";
    return "hidden";
  }

  /**
   * Update visibility based on camera position.
   * Extrude group: individual per-child visibility.
   * GLB group: individual per-child visibility.
   * Instanced group: always visible (GPU handles distance).
   */
  update(cameraPosition: THREE.Vector3) {
    if (!this.enabled) return;

    const pos = new THREE.Vector3();

    // Update extruded buildings
    if (this.extrudeGroup) {
      for (const child of this.extrudeGroup.children) {
        child.getWorldPosition(pos);
        const dist = cameraPosition.distanceTo(pos);
        const tier = this.getTier(dist);

        // Show extrude when in mid range, or near range if no GLB available
        if (tier === "extrude") {
          child.visible = true;
        } else if (tier === "glb") {
          // Check if this building has a GLB counterpart
          const buildingId = child.userData?.buildingId;
          const hasGLB = buildingId && this.glbGroup?.children.some(
            g => g.userData?.buildingId === buildingId
          );
          child.visible = !hasGLB; // Show extrude if no GLB
        } else {
          child.visible = false; // hidden or instanced range
        }
      }
    }

    // Update GLB models
    if (this.glbGroup) {
      for (const child of this.glbGroup.children) {
        child.getWorldPosition(pos);
        const dist = cameraPosition.distanceTo(pos);
        const tier = this.getTier(dist);
        child.visible = tier === "glb"; // Only show GLBs up close
      }
    }

    // Instanced group stays always visible (GPU culls naturally)
    // Individual instance visibility is handled by distance in shader
  }

  getConfig(): LODConfig {
    return { ...this.config };
  }
}
