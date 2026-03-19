/**
 * Hook to manage OSM-based city generation state.
 * Fetches real-world building/road data from OpenStreetMap and converts
 * it to the city's internal format for rendering with GLB models.
 */

import { useState, useCallback, useRef } from "react";
import {
  generateCityFromOSM,
  CITY_PRESETS,
  type OSMCityData,
  type CityPreset,
} from "@/systems/city/OSMCityGenerator";
import type { CityBuilding } from "@/types/building";
import type { Street } from "@/systems/city/CityLayoutGenerator";

export interface OSMCityState {
  /** Currently loaded OSM city data */
  data: OSMCityData | null;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Currently selected preset */
  activePreset: CityPreset | null;
  /** Whether OSM mode is active (vs procedural) */
  isOSMMode: boolean;
}

export function useOSMCity() {
  const [state, setState] = useState<OSMCityState>({
    data: null,
    loading: false,
    error: null,
    activePreset: null,
    isOSMMode: false,
  });

  const abortRef = useRef<AbortController | null>(null);

  /** Load a city from a preset */
  const loadPreset = useCallback(async (preset: CityPreset) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setState((s) => ({ ...s, loading: true, error: null, activePreset: preset, isOSMMode: true }));

    try {
      const data = await generateCityFromOSM(preset.lat, preset.lon, preset.radius);

      if (data.buildings.length === 0) {
        setState((s) => ({
          ...s,
          loading: false,
          error: "No buildings found in this area. Try a different location.",
        }));
        return;
      }

      setState((s) => ({
        ...s,
        data,
        loading: false,
        error: null,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load city data";
      console.error("[OSM] Error:", message);
      setState((s) => ({ ...s, loading: false, error: message }));
    }
  }, []);

  /** Load a custom location */
  const loadCustomLocation = useCallback(async (lat: number, lon: number, radius: number = 500) => {
    const customPreset: CityPreset = {
      id: "custom",
      name: "Custom Location",
      country: "",
      emoji: "📍",
      lat,
      lon,
      radius,
      description: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
    };
    await loadPreset(customPreset);
  }, [loadPreset]);

  /** Switch back to procedural mode */
  const switchToProcedural = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      activePreset: null,
      isOSMMode: false,
    });
  }, []);

  return {
    ...state,
    loadPreset,
    loadCustomLocation,
    switchToProcedural,
    presets: CITY_PRESETS,
  };
}
