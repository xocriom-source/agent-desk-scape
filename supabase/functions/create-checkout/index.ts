import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { mode, price_id, asset_id, asset_type, amount, currency, plan, success_url, cancel_url } = await req.json();

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

    // Get or create Stripe customer
    let customerId: string;
    const { data: sub } = await supabase.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).single();
    
    if (sub?.stripe_customer_id) {
      customerId = sub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan: "free",
        status: "active",
      }, { onConflict: "user_id" });
    }

    let sessionConfig: any = {
      customer: customerId,
      success_url: success_url || `${req.headers.get("origin")}/lobby?payment=success`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/lobby?payment=cancelled`,
      metadata: { user_id: user.id, asset_id: asset_id || "", asset_type: asset_type || "" },
    };

    if (mode === "subscription") {
      // Subscription checkout
      sessionConfig.mode = "subscription";
      sessionConfig.line_items = [{ price: price_id, quantity: 1 }];
      sessionConfig.metadata.plan = plan || "pro";
    } else {
      // One-time payment - validate price server-side
      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400, headers: corsHeaders });
      }

      // If asset_id provided, validate from DB
      if (asset_id && asset_type === "business") {
        const { data: business } = await supabase
          .from("digital_businesses")
          .select("id, sale_price, name")
          .eq("id", asset_id)
          .single();
        
        if (!business) {
          return new Response(JSON.stringify({ error: "Asset not found" }), { status: 404, headers: corsHeaders });
        }
      }

      // Get platform fee
      const { data: feeConfig } = await supabase
        .from("fee_config")
        .select("percentage")
        .eq("category", asset_type || "saas")
        .single();
      
      const feePercent = feeConfig?.percentage || 5;
      const unitAmount = Math.round(amount * 100); // cents

      sessionConfig.mode = "payment";
      sessionConfig.line_items = [{
        price_data: {
          currency: currency || "brl",
          product_data: { name: `Pagamento - ${asset_type || "platform"}` },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }];
      sessionConfig.metadata.expected_amount = unitAmount.toString();
      sessionConfig.metadata.fee_percent = feePercent.toString();
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Log payment
    await supabase.from("payments").insert({
      user_id: user.id,
      asset_id: asset_id || null,
      asset_type: asset_type || "platform",
      amount: amount || 0,
      currency: currency || "brl",
      status: "pending",
      stripe_checkout_session: session.id,
      metadata: { mode, plan },
    });

    await supabase.from("financial_logs").insert({
      user_id: user.id,
      event_type: "checkout_created",
      amount: amount || 0,
      description: `Checkout ${mode} criado`,
      metadata: { session_id: session.id },
    });

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
