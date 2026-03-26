import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CityBuilding } from "@/types/building";

const LOAD_RADIUS = 500;

/**
 * Fetches REAL buildings from city_buildings table.
 * No NPC fillers, no fake data — only real user-owned buildings.
 */
export function useCityBuildings(userId?: string) {
  const [allBuildings, setAllBuildings] = useState<CityBuilding[]>([]);
  const [userBuilding, setUserBuilding] = useState<CityBuilding | null>(null);
  const [cameraCenter, setCameraCenter] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBuildings();
  }, [userId]);

  const fetchBuildings = async () => {
    setLoading(true);

    // Fetch all buildings with owner_id (real users only)
    const { data: dbBuildings, error } = await supabase
      .from("city_buildings")
      .select("*")
      .not("owner_id", "is", null);

    if (error || !dbBuildings) {
      console.error("Error fetching city buildings:", error);
      setLoading(false);
      return;
    }

    // Map DB rows to CityBuilding format
    const mapped: CityBuilding[] = dbBuildings.map((b) => ({
      id: b.id,
      name: b.name,
      ownerName: "", // Will be enriched below
      district: (b.district || "central") as any,
      style: (b.style || "corporate") as any,
      floors: b.floors,
      height: b.height,
      primaryColor: b.primary_color || "#3b82f6",
      secondaryColor: b.secondary_color || "#1e3a5f",
      bio: "",
      links: [],
      customizations: (b.customizations || {}) as any,
      createdAt: b.created_at,
      coordinates: { x: Number(b.position_x) || 0, z: Number(b.position_z) || 0 },
      claimed: true,
      ownerId: b.owner_id || "",
    }));

    // Enrich with owner names in batch
    const ownerIds = [...new Set(dbBuildings.filter((b) => b.owner_id).map((b) => b.owner_id!))];
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, company_name")
        .in("id", ownerIds);

      if (profiles) {
        const profileMap = new Map(profiles.map((p) => [p.id, p]));
        for (const b of mapped) {
          const profile = profileMap.get(b.ownerId);
          if (profile) {
            b.ownerName = profile.company_name || profile.display_name || "";
          }
        }
      }
    }

    // Find user's building
    let ub: CityBuilding | null = null;
    if (userId) {
      ub = mapped.find((b) => b.ownerId === userId) || null;
    }

    setUserBuilding(ub);
    if (ub) {
      setCameraCenter({ x: ub.coordinates.x, z: ub.coordinates.z });
    }

    setAllBuildings(mapped);
    setLoading(false);
  };

  // No NPC buildings — real data only
  const npcBuildings: CityBuilding[] = [];

  const visibleBuildings = useMemo(() => {
    return allBuildings.filter((b) => {
      const dx = b.coordinates.x - cameraCenter.x;
      const dz = b.coordinates.z - cameraCenter.z;
      return Math.sqrt(dx * dx + dz * dz) < LOAD_RADIUS;
    });
  }, [allBuildings, cameraCenter]);

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
    loading,
  };
}
