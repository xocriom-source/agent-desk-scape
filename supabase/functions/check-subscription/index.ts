import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated");

    const user = userData.user;
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check user_plans table first
    const { data: userPlan } = await supabase
      .from("user_plans")
      .select("plan_id, status")
      .eq("user_id", user.id)
      .single();

    // If no user_plan, create explorer
    if (!userPlan) {
      await supabase.from("user_plans").insert({ user_id: user.id, plan_id: "explorer", status: "active" });
      return new Response(JSON.stringify({
        subscribed: false,
        plan_id: "explorer",
        product_id: null,
        subscription_end: null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check Stripe for active subscription
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      return new Response(JSON.stringify({
        subscribed: false,
        plan_id: userPlan.plan_id || "explorer",
        product_id: null,
        subscription_end: null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });

    if (subscriptions.data.length === 0) {
      // No active Stripe sub, ensure plan is explorer
      if (userPlan.plan_id !== "explorer") {
        await supabase.from("user_plans").update({ plan_id: "explorer", status: "active", updated_at: new Date().toISOString() }).eq("user_id", user.id);
      }
      return new Response(JSON.stringify({
        subscribed: false,
        plan_id: "explorer",
        product_id: null,
        subscription_end: null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sub = subscriptions.data[0];
    const productId = sub.items.data[0].price.product as string;
    const subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();

    // Map product to plan
    const planMap: Record<string, string> = {
      "prod_UAAoLCk0ESELPg": "business",
      "prod_UAAqS62X5nnqac": "mogul",
    };
    const detectedPlan = planMap[productId] || "explorer";

    // Sync plan
    if (userPlan.plan_id !== detectedPlan) {
      await supabase.from("user_plans").update({
        plan_id: detectedPlan,
        status: "active",
        updated_at: new Date().toISOString(),
      }).eq("user_id", user.id);
    }

    return new Response(JSON.stringify({
      subscribed: true,
      plan_id: detectedPlan,
      product_id: productId,
      subscription_end: subscriptionEnd,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
