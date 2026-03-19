/**
 * Hook to manage OSM-based city generation state.
 * Auto-loads a default city on mount for instant world experience.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  generateCityFromOSM,
  CITY_PRESETS,
  type OSMCityData,
  type CityPreset,
} from "@/systems/city/OSMCityGenerator";
import type { CityBuilding } from "@/types/building";

export interface OSMCityState {
  data: OSMCityData | null;
  loading: boolean;
  error: string | null;
  activePreset: CityPreset | null;
  isOSMMode: boolean;
}

export function useOSMCity(autoLoad: boolean = true) {
  const [state, setState] = useState<OSMCityState>({
    data: null,
    loading: false,
    error: null,
    activePreset: null,
    isOSMMode: false,
  });

  const abortRef = useRef<AbortController | null>(null);
  const loadedRef = useRef(false);

  /** Load a city from a preset */
  const loadPreset = useCallback(async (preset: CityPreset) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setState((s) => ({ ...s, loading: true, error: null, activePreset: preset, isOSMMode: true }));

    try {
      const data = await generateCityFromOSM(preset.lat, preset.lon, preset.radius);

      if (data.buildings.length === 0) {
        setState((s) => ({
          ...s,
          loading: false,
          error: "No buildings found. Try a different location.",
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
  const loadCustomLocation = useCallback(async (lat: number, lon: number, radius: number = 600) => {
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

  // Auto-load Manhattan on mount for instant world experience
  useEffect(() => {
    if (autoLoad && !loadedRef.current) {
      loadedRef.current = true;
      // Use São Paulo (Av. Paulista) as default — or check user preference
      const defaultPreset = CITY_PRESETS.find(p => p.id === "manhattan") || CITY_PRESETS[0];
      loadPreset(defaultPreset);
    }
  }, [autoLoad, loadPreset]);

  return {
    ...state,
    loadPreset,
    loadCustomLocation,
    switchToProcedural,
    presets: CITY_PRESETS,
  };
}
