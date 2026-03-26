/**
 * inputStore — Decoupled input system.
 * Captures keyboard/mouse state independently of rendering.
 * Components read input state without managing listeners.
 */

import { create } from "zustand";

export interface InputState {
  keys: Set<string>;
  mouseDown: boolean;
  pointerLocked: boolean;
  mouseDeltaX: number;
  mouseDeltaY: number;

  // Actions
  pressKey: (key: string) => void;
  releaseKey: (key: string) => void;
  setMouseDown: (down: boolean) => void;
  setPointerLocked: (locked: boolean) => void;
  setMouseDelta: (dx: number, dy: number) => void;
  resetMouseDelta: () => void;
  isPressed: (key: string) => boolean;
}

export const useInputStore = create<InputState>((set, get) => ({
  keys: new Set<string>(),
  mouseDown: false,
  pointerLocked: false,
  mouseDeltaX: 0,
  mouseDeltaY: 0,

  pressKey: (key) => set((s) => {
    const newKeys = new Set(s.keys);
    newKeys.add(key.toLowerCase());
    return { keys: newKeys };
  }),
  releaseKey: (key) => set((s) => {
    const newKeys = new Set(s.keys);
    newKeys.delete(key.toLowerCase());
    return { keys: newKeys };
  }),
  setMouseDown: (down) => set({ mouseDown: down }),
  setPointerLocked: (locked) => set({ pointerLocked: locked }),
  setMouseDelta: (dx, dy) => set((s) => ({
    mouseDeltaX: s.mouseDeltaX + dx,
    mouseDeltaY: s.mouseDeltaY + dy,
  })),
  resetMouseDelta: () => set({ mouseDeltaX: 0, mouseDeltaY: 0 }),
  isPressed: (key) => get().keys.has(key.toLowerCase()),
}));

/** 
 * Initialize global input listeners. Call once at app level.
 * Returns cleanup function.
 */
export function initInputListeners(): () => void {
  const { pressKey, releaseKey } = useInputStore.getState();

  const onKeyDown = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    pressKey(e.key);
  };
  const onKeyUp = (e: KeyboardEvent) => {
    releaseKey(e.key);
  };
  const onBlur = () => {
    useInputStore.setState({ keys: new Set() });
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onBlur);
  };
}
