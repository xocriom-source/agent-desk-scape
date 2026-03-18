/**
 * React hook that integrates ChunkManager + QualitySettings
 * into the city scene. Provides chunk-based LoD data per frame.
 */

import { useState, useMemo, useCallback, useRef } from "react";
import { computeVisibleChunks, getLodLevel, type BuildingDef, type ChunkData } from "./ChunkManager";
import { QUALITY_PRESETS, detectQuality, type QualityLevel, type QualityConfig } from "./QualitySettings";

export interface LodBuilding {
  index: number;
  def: BuildingDef;
  lod: number;
  distance: number;
  chunkKey: string;
}

export function useCityLod(buildings: BuildingDef[]) {
  const [quality, setQuality] = useState<QualityLevel>(() => {
    const saved = localStorage.getItem("city_quality");
    if (saved && saved in QUALITY_PRESETS) return saved as QualityLevel;
    return detectQuality();
  });

  const config = useMemo(() => QUALITY_PRESETS[quality], [quality]);
  const lastChunkKey = useRef("");

  const changeQuality = useCallback((q: QualityLevel) => {
    setQuality(q);
    localStorage.setItem("city_quality", q);
  }, []);

  /**
   * Call each frame (or throttled) with player position.
   * Returns buildings with their LoD levels and visible chunks.
   */
  const computeFrame = useCallback(
    (playerX: number, playerZ: number): { lodBuildings: LodBuilding[]; chunks: ChunkData[]; config: QualityConfig } => {
      const chunks = computeVisibleChunks(
        playerX, playerZ,
        config.chunkSize,
        config.chunkLoadRadius,
        buildings
      );

      const lodBuildings: LodBuilding[] = [];
      let fullDetailCount = 0;

      for (const chunk of chunks) {
        for (const idx of chunk.buildingIndices) {
          const def = buildings[idx];
          const dist = Math.hypot(def.x - playerX, def.z - playerZ);
          let lod = getLodLevel(dist, config.lodDistances, config.maxLod);

          // Cap full detail buildings
          if (lod === 0) {
            if (fullDetailCount >= config.maxFullDetailBuildings) {
              lod = 1;
            } else {
              fullDetailCount++;
            }
          }

          lodBuildings.push({ index: idx, def, lod, distance: dist, chunkKey: chunk.key });
        }
      }

      return { lodBuildings, chunks, config };
    },
    [buildings, config]
  );

  return { quality, config, changeQuality, computeFrame };
}
