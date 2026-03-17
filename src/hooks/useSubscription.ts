import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionState {
  subscribed: boolean;
  planId: string;
  productId: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

const PLAN_LIMITS: Record<string, { maxBuildings: number; maxAgents: number; maxCities: number }> = {
  explorer: { maxBuildings: 1, maxAgents: 3, maxCities: 1 },
  business: { maxBuildings: 5, maxAgents: 10, maxCities: 2 },
  mogul: { maxBuildings: -1, maxAgents: -1, maxCities: -1 },
};

export const PLAN_DETAILS = {
  explorer: {
    name: "Explorer",
    price: "$0",
    priceId: "price_1TBqSC2OPq4ZTShLDF7B0nIF",
    productId: "prod_UAAnOz8omzjTgB",
    features: ["1 building", "3 agentes IA", "Recepcionista básico", "Chat público", "Missões diárias"],
  },
  business: {
    name: "Business",
    price: "$49",
    priceId: "price_1TBqSr2OPq4ZTShLjWu98mCC",
    productId: "prod_UAAoLCk0ESELPg",
    features: ["5 andares", "10 agentes IA", "Recepcionista avançado", "Analytics", "Marketplace", "Até 2 cidades"],
  },
  mogul: {
    name: "Mogul",
    price: "$199",
    priceId: "price_1TBqUP2OPq4ZTShLDxcdsGgH",
    productId: "prod_UAAqS62X5nnqac",
    features: ["Prédios ilimitados", "Agentes ilimitados", "Todas as cidades", "API dedicada", "IA customizada", "Suporte VIP"],
  },
};

export function useSubscription() {
  const { user, isAdmin } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    planId: "explorer",
    productId: null,
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      setState({
        subscribed: data.subscribed,
        planId: data.plan_id || "explorer",
        productId: data.product_id,
        subscriptionEnd: data.subscription_end,
        loading: false,
      });
    } catch {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  // Admins get unlimited everything (God Mode)
  const getPlanLimits = () => {
    if (isAdmin) return { maxBuildings: -1, maxAgents: -1, maxCities: -1 };
    return PLAN_LIMITS[state.planId] || PLAN_LIMITS.explorer;
  };

  const hasFeature = (feature: string) => {
    if (isAdmin) return true;
    const plan = PLAN_DETAILS[state.planId as keyof typeof PLAN_DETAILS];
    if (!plan) return false;
    if (state.planId === "mogul") return true;
    if (state.planId === "business") {
      return !["dedicated_api", "custom_ai", "vip_support"].includes(feature);
    }
    return ["basic_receptionist", "public_chat", "daily_missions"].includes(feature);
  };

  return { ...state, isAdmin, checkSubscription, getPlanLimits, hasFeature };
}
