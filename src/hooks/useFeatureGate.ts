import { useSubscription } from "./useSubscription";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Feature gates mapped to minimum plan required.
 * "explorer" = free tier, "business" = $49/mo, "mogul" = $199/mo
 * Admins bypass ALL gates automatically (God Mode).
 */
const FEATURE_PLAN_MAP: Record<string, string> = {
  // Explorer (free)
  basic_receptionist: "explorer",
  public_chat: "explorer",
  daily_missions: "explorer",
  single_building: "explorer",

  // Business ($49/mo)
  analytics: "business",
  marketplace: "business",
  advanced_receptionist: "business",
  multi_floor: "business",
  team_agents: "business",
  custom_branding: "business",
  meeting_system: "business",
  integrations: "business",

  // Mogul ($199/mo)
  unlimited_buildings: "mogul",
  unlimited_agents: "mogul",
  dedicated_api: "mogul",
  custom_ai: "mogul",
  vip_support: "mogul",
  all_cities: "mogul",
  white_label: "mogul",
};

const PLAN_TIER: Record<string, number> = {
  explorer: 0,
  business: 1,
  mogul: 2,
};

export interface FeatureGateResult {
  allowed: boolean;
  requiredPlan: string;
  currentPlan: string;
  loading: boolean;
  isAdmin: boolean;
}

export function useFeatureGate(featureKey: string): FeatureGateResult {
  const { planId, loading } = useSubscription();
  const { isAdmin } = useAuth();

  const requiredPlan = FEATURE_PLAN_MAP[featureKey] || "mogul";
  const currentTier = PLAN_TIER[planId] ?? 0;
  const requiredTier = PLAN_TIER[requiredPlan] ?? 0;

  return {
    allowed: isAdmin || currentTier >= requiredTier,
    requiredPlan,
    currentPlan: isAdmin ? "admin" : planId,
    loading,
    isAdmin,
  };
}

export function useMultiFeatureGate(featureKeys: string[]) {
  const { planId, loading } = useSubscription();
  const currentTier = PLAN_TIER[planId] ?? 0;

  const results: Record<string, boolean> = {};
  for (const key of featureKeys) {
    const requiredPlan = FEATURE_PLAN_MAP[key] || "mogul";
    const requiredTier = PLAN_TIER[requiredPlan] ?? 0;
    results[key] = currentTier >= requiredTier;
  }

  return { gates: results, planId, loading };
}

export { FEATURE_PLAN_MAP, PLAN_TIER };
