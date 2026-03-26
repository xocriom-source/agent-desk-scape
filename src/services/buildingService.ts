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

export async function fetchUserBuildings(userId: string): Promise<BuildingSummary[]> {
  const { data, error } = await supabase
    .from("city_buildings")
    .select("id, name, style, city, country, district, floors, height, primary_color, secondary_color, created_at, is_for_sale")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[buildingService:fetchUserBuildings]", error.message);
    return [];
  }
  return (data || []) as BuildingSummary[];
}

export async function fetchBuildingAgentCount(buildingId: string): Promise<number> {
  const { count, error } = await supabase
    .from("external_agents")
    .select("id", { count: "exact", head: true })
    .eq("building_id", buildingId);

  if (error) return 0;
  return count || 0;
}

export async function fetchRecentActivity(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from("activity_feed")
    .select("*")
    .eq("actor_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[buildingService:fetchRecentActivity]", error.message);
    return [];
  }
  return data || [];
}

export async function fetchUserPlan(userId: string) {
  const { data, error } = await supabase
    .from("user_plans")
    .select("plan_id, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("[buildingService:fetchUserPlan]", error.message);
    return { plan_id: "explorer", status: "active" };
  }
  return data || { plan_id: "explorer", status: "active" };
}

export async function fetchOnboardingStatus(userId: string) {
  const { data, error } = await supabase
    .from("user_onboarding")
    .select("current_step, completed")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { current_step: 0, completed: false };
  return data || { current_step: 0, completed: false };
}
