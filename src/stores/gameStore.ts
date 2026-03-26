/**
 * gameStore — Centralized Zustand store for all game state.
 * Replaces 20+ scattered useState calls across CityExplore.
 * Split into logical slices: player, vehicle, world, ui, camera.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { TransportType } from "@/types/building";

// ── Player Slice ──
export interface PlayerState {
  position: [number, number, number];
  rotation: number;
  movementMode: "walk" | "fly" | "vehicle";
  speed: number;
  isMoving: boolean;
}

// ── Vehicle Slice ──
export interface VehicleState {
  isInVehicle: boolean;
  currentType: TransportType;
  color: string;
  velocity: number;
  steeringAngle: number;
  acceleration: number;
}

// ── World Slice ──
export interface WorldState {
  currentCity: { name: string; flag: string; lat: number; lon: number };
  loadingStatus: "idle" | "loading" | "generating" | "ready" | "error";
  loadingProgress: number;
  isOSMMode: boolean;
  cityReady: boolean;
}

// ── UI Slice ──
export type PanelName =
  | "chat" | "missions" | "leaderboard" | "ranking" | "vehicleShop"
  | "marketplace" | "proximity" | "teleport" | "personalAgent"
  | "teamAgents" | "publicSpaces" | "messenger" | "training"
  | "meeting" | "teamChat" | "focusMode" | "analytics"
  | "events" | "screenShare" | "integrations" | "engagement"
  | "status" | "objects" | "ads" | "settings";

export type CityViewMode = "canvas" | "flyover";

export interface UIState {
  activePanel: PanelName | null;
  showIntro: boolean;
  showQualityMenu: boolean;
  tutorialCompleted: boolean;
  hudVisible: boolean;
  selectedBuildingId: string | null;
  selectedAgentId: string | null;
  cityViewMode: CityViewMode;
}

// ── Camera Slice ──
export interface CameraState {
  distance: number;
  polarAngle: number;
  azimuthAngle: number;
}

// ── Combined Store ──
export interface GameStore {
  // Player
  player: PlayerState;
  setPlayerPosition: (pos: [number, number, number]) => void;
  setPlayerRotation: (rot: number) => void;
  setMovementMode: (mode: PlayerState["movementMode"]) => void;
  setPlayerMoving: (moving: boolean) => void;

  // Vehicle
  vehicle: VehicleState;
  enterVehicle: (type: TransportType, color: string) => void;
  exitVehicle: () => void;
  setVehicleVelocity: (v: number) => void;
  setVehicleSteering: (angle: number) => void;
  setVehicleAcceleration: (a: number) => void;

  // World
  world: WorldState;
  setLoadingStatus: (status: WorldState["loadingStatus"]) => void;
  setLoadingProgress: (p: number) => void;
  setCityReady: (ready: boolean) => void;
  setCurrentCity: (city: WorldState["currentCity"]) => void;
  setOSMMode: (osm: boolean) => void;

  // UI
  ui: UIState;
  openPanel: (panel: PanelName) => void;
  closePanel: () => void;
  togglePanel: (panel: PanelName) => void;
  setShowIntro: (show: boolean) => void;
  selectBuilding: (id: string | null) => void;
  selectAgent: (id: string | null) => void;
  setHudVisible: (visible: boolean) => void;
  setCityViewMode: (mode: CityViewMode) => void;

  // Camera
  camera: CameraState;
  setCameraDistance: (d: number) => void;
}

const getInitialCity = (): WorldState["currentCity"] => {
  try {
    const stored = localStorage.getItem("agentoffice_city");
    if (stored) {
      const parsed = JSON.parse(stored);
      return { name: parsed.name || "São Paulo", flag: parsed.flag || "🇧🇷", lat: parsed.lat || -23.55, lon: parsed.lon || -46.63 };
    }
  } catch { /* ignore */ }
  return { name: "São Paulo", flag: "🇧🇷", lat: -23.55, lon: -46.63 };
};

const getTutorialDone = (): boolean => {
  try { return localStorage.getItem("ads_tutorial_done") === "true"; } catch { return false; }
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set) => ({
    // ── Player ──
    player: {
      position: [0, 0, 5],
      rotation: 0,
      movementMode: "walk",
      speed: 0,
      isMoving: false,
    },
    setPlayerPosition: (pos) => set((s) => ({ player: { ...s.player, position: pos } })),
    setPlayerRotation: (rot) => set((s) => ({ player: { ...s.player, rotation: rot } })),
    setMovementMode: (mode) => set((s) => ({ player: { ...s.player, movementMode: mode } })),
    setPlayerMoving: (moving) => set((s) => ({ player: { ...s.player, isMoving: moving } })),

    // ── Vehicle ──
    vehicle: {
      isInVehicle: false,
      currentType: "car" as TransportType,
      color: "#4A90D9",
      velocity: 0,
      steeringAngle: 0,
      acceleration: 0,
    },
    enterVehicle: (type, color) => set((s) => ({
      vehicle: { ...s.vehicle, isInVehicle: true, currentType: type, color, velocity: 0, steeringAngle: 0 },
      player: { ...s.player, movementMode: "vehicle" },
    })),
    exitVehicle: () => set((s) => ({
      vehicle: { ...s.vehicle, isInVehicle: false, velocity: 0, steeringAngle: 0, acceleration: 0 },
      player: { ...s.player, movementMode: "walk" },
    })),
    setVehicleVelocity: (v) => set((s) => ({ vehicle: { ...s.vehicle, velocity: v } })),
    setVehicleSteering: (angle) => set((s) => ({ vehicle: { ...s.vehicle, steeringAngle: angle } })),
    setVehicleAcceleration: (a) => set((s) => ({ vehicle: { ...s.vehicle, acceleration: a } })),

    // ── World ──
    world: {
      currentCity: getInitialCity(),
      loadingStatus: "idle",
      loadingProgress: 0,
      isOSMMode: false,
      cityReady: false,
    },
    setLoadingStatus: (status) => set((s) => ({ world: { ...s.world, loadingStatus: status } })),
    setLoadingProgress: (p) => set((s) => ({ world: { ...s.world, loadingProgress: p } })),
    setCityReady: (ready) => set((s) => ({ world: { ...s.world, cityReady: ready, loadingStatus: ready ? "ready" : s.world.loadingStatus } })),
    setCurrentCity: (city) => {
      localStorage.setItem("agentoffice_city", JSON.stringify(city));
      set((s) => ({ world: { ...s.world, currentCity: city } }));
    },
    setOSMMode: (osm) => set((s) => ({ world: { ...s.world, isOSMMode: osm } })),

    // ── UI ──
    ui: {
      activePanel: null,
      showIntro: true,
      showQualityMenu: false,
      tutorialCompleted: getTutorialDone(),
      hudVisible: true,
      selectedBuildingId: null,
      selectedAgentId: null,
      cityViewMode: "canvas" as CityViewMode,
    },
    openPanel: (panel) => set((s) => ({ ui: { ...s.ui, activePanel: panel } })),
    closePanel: () => set((s) => ({ ui: { ...s.ui, activePanel: null } })),
    togglePanel: (panel) => set((s) => ({
      ui: { ...s.ui, activePanel: s.ui.activePanel === panel ? null : panel },
    })),
    setShowIntro: (show) => set((s) => ({ ui: { ...s.ui, showIntro: show } })),
    selectBuilding: (id) => set((s) => ({ ui: { ...s.ui, selectedBuildingId: id } })),
    selectAgent: (id) => set((s) => ({ ui: { ...s.ui, selectedAgentId: id } })),
    setHudVisible: (visible) => set((s) => ({ ui: { ...s.ui, hudVisible: visible } })),

    // ── Camera ──
    camera: { distance: 25, polarAngle: Math.PI / 3, azimuthAngle: 0 },
    setCameraDistance: (d) => set((s) => ({ camera: { ...s.camera, distance: d } })),
  }))
);
