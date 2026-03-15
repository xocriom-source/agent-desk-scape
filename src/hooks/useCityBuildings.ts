import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { CityBuilding } from "@/types/building";
import { getAllBuildings, generateBuilding, saveBuilding, seedDemoBuildings } from "@/data/buildingRegistry";

const LOAD_RADIUS = 300;
const NPC_FILL_COUNT = 40;

const NPC_NAMES = [
  "Apex Digital", "Nebula Labs", "Zenith Corp", "Pulse Studio",
  "Orbit Works", "Flux Agency", "Vortex Inc", "Prism Hub",
  "Atlas Tech", "Nova Creative", "Ember Startup", "Cipher Dev",
  "Quantum Forge", "Aether Studio", "Helix Solutions", "Onyx Group",
  "Drift Design", "Blaze Media", "Iron Pixel", "Spark Ventures",
  "Cobalt Systems", "Jade Studios", "Raven Digital", "Storm Labs",
  "Echo Dynamics", "Lunar Works", "Solar Forge", "Titan Corp",
  "Crimson Studio", "Azure Labs", "Crystal Hub", "Frost Tech",
  "Granite Works", "Ivory Design", "Marble Inc", "Opal Creative",
  "Pearl Studio", "Ruby Labs", "Sapphire Corp", "Topaz Digital",
  "Amber Works", "Bronze Hub", "Copper Studios", "Diamond Tech",
  "Emerald Labs", "Garnet Corp", "Indigo Studio", "Jasper Works",
  "Lapis Digital", "Malachite Lab", "Nickel Corp", "Obsidian Hub",
  "Platinum Studio", "Quartz Labs", "Rose Gold Inc", "Silver Digital",
  "Tungsten Works", "Uranium Labs", "Vermillion Corp", "Wolfram Studio",
];

const NPC_TYPES = ["tech", "creator", "startup", "agency", "dev"];

export function useCityBuildings(userId?: string) {
  const [allBuildings, setAllBuildings] = useState<CityBuilding[]>([]);
  const [userBuilding, setUserBuilding] = useState<CityBuilding | null>(null);
  const [cameraCenter, setCameraCenter] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const npcBuildingsRef = useRef<CityBuilding[]>([]);

  // Seed demos + load all buildings on mount
  useEffect(() => {
    seedDemoBuildings();
    const buildings = getAllBuildings();
    
    // Find user's building
    let ub: CityBuilding | null = null;
    if (userId) {
      ub = buildings.find(b => b.ownerId === userId && b.claimed) || null;
    }
    if (!ub) {
      // Try finding by username
      const stored = localStorage.getItem("agentoffice_user");
      if (stored) {
        const name = JSON.parse(stored).name;
        if (name) {
          ub = buildings.find(b => b.ownerName.toLowerCase() === name.toLowerCase() && b.claimed) || null;
        }
      }
    }

    setUserBuilding(ub);
    if (ub) {
      setCameraCenter({ x: ub.coordinates.x, z: ub.coordinates.z });
    }

    setAllBuildings(buildings);
  }, [userId]);

  // Generate NPC filler buildings (stable, generated once)
  const npcBuildings = useMemo(() => {
    if (npcBuildingsRef.current.length > 0) return npcBuildingsRef.current;
    
    const existing = getAllBuildings();
    const fillers: CityBuilding[] = [];
    const usedPositions = new Set(existing.map(b => `${Math.round(b.coordinates.x)},${Math.round(b.coordinates.z)}`));
    
    for (let i = 0; i < NPC_FILL_COUNT && i < NPC_NAMES.length; i++) {
      const name = NPC_NAMES[i];
      const type = NPC_TYPES[i % NPC_TYPES.length];
      const b = generateBuilding(name, type);
      
      // Ensure no overlap
      const key = `${Math.round(b.coordinates.x)},${Math.round(b.coordinates.z)}`;
      if (usedPositions.has(key)) {
        b.coordinates.x += 6;
        b.coordinates.z += 4;
      }
      usedPositions.add(`${Math.round(b.coordinates.x)},${Math.round(b.coordinates.z)}`);
      
      b.id = `npc_${i}_${name.replace(/\s/g, "")}`;
      b.claimed = true;
      b.ownerId = `npc_${name.toLowerCase().replace(/\s/g, "_")}`;
      fillers.push(b);
    }
    
    npcBuildingsRef.current = fillers;
    return fillers;
  }, []);

  // Get visible buildings within radius of camera center
  const visibleBuildings = useMemo(() => {
    const combined = [...allBuildings, ...npcBuildings];
    return combined.filter(b => {
      const dx = b.coordinates.x - cameraCenter.x;
      const dz = b.coordinates.z - cameraCenter.z;
      return Math.sqrt(dx * dx + dz * dz) < LOAD_RADIUS;
    });
  }, [allBuildings, npcBuildings, cameraCenter]);

  const updateCameraCenter = useCallback((x: number, z: number) => {
    setCameraCenter({ x, z });
  }, []);

  return {
    visibleBuildings,
    userBuilding,
    allBuildings,
    npcBuildings,
    updateCameraCenter,
    cameraCenter,
  };
}
