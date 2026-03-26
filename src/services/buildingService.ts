import { supabase } from "@/integrations/supabase/client";

export interface BuildingSummary {
  id: string;
  name: string;
  style: string;
  city: string | null;
  country: string | null;
  district: string;
  floors: number;
  height: number;
  primary_color: string | null;
  secondary_color: string | null;
  created_at: string;
  is_for_sale: boolean;
}

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

async function withRetry<T>(fn: () => Promise<T>, label: string, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) console.log(`[buildingService:${label}] Succeeded on retry ${attempt}`);
      return result;
    } catch (err) {
      console.warn(`[buildingService:${label}] Attempt ${attempt + 1} failed`, err);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, RETRY_DELAY * (attempt + 1)));
    }
  }
  throw new Error("Unreachable");
}

export async function fetchUserBuildings(userId: string): Promise<BuildingSummary[]> {
  return withRetry(async () => {
    console.log("[buildingService:fetchUserBuildings]", { userId });
    const { data, error } = await supabase
      .from("city_buildings")
      .select("id, name, style, city, country, district, floors, height, primary_color, secondary_color, created_at, is_for_sale")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[buildingService:fetchUserBuildings:error]", error.message);
      throw error;
    }
    console.log("[buildingService:fetchUserBuildings:success]", { count: data?.length });
    return (data || []) as BuildingSummary[];
  }, "fetchUserBuildings");
}

export async function fetchBuildingAgentCount(buildingId: string): Promise<number> {
  return withRetry(async () => {
    const { count, error } = await supabase
      .from("external_agents")
      .select("id", { count: "exact", head: true })
      .eq("building_id", buildingId);

    if (error) {
      console.warn("[buildingService:fetchBuildingAgentCount:error]", error.message);
      return 0;
    }
    return count || 0;
  }, "fetchBuildingAgentCount");
}

export async function fetchRecentActivity(userId: string, limit = 10) {
  return withRetry(async () => {
    console.log("[buildingService:fetchRecentActivity]", { userId, limit });
    const { data, error } = await supabase
      .from("activity_feed")
      .select("*")
      .eq("actor_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[buildingService:fetchRecentActivity:error]", error.message);
      throw error;
    }
    return data || [];
  }, "fetchRecentActivity");
}

export async function fetchUserPlan(userId: string) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from("user_plans")
      .select("plan_id, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("[buildingService:fetchUserPlan:error]", error.message);
      return { plan_id: "explorer", status: "active" };
    }
    return data || { plan_id: "explorer", status: "active" };
  }, "fetchUserPlan");
}

export async function fetchOnboardingStatus(userId: string) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from("user_onboarding")
      .select("current_step, completed")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[buildingService:fetchOnboardingStatus:error]", error.message);
      return { current_step: 0, completed: false };
    }
    return data || { current_step: 0, completed: false };
  }, "fetchOnboardingStatus");
}
