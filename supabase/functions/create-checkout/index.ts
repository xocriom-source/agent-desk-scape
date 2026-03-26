import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Use service role for DB ops, but validate user token
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const { mode, price_id, asset_id, asset_type, amount, currency, plan, success_url, cancel_url } = body;
    logStep("Request body", { mode, price_id, asset_id, plan });

    // Input validation
    if (mode === "subscription" && !price_id) {
      return new Response(JSON.stringify({ error: "price_id is required for subscriptions" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    // Get or create Stripe customer
    let customerId: string;
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://agent-desk-scape.lovable.app";

    let sessionConfig: any = {
      customer: customerId,
      success_url: success_url || `${origin}/lobby?payment=success`,
      cancel_url: cancel_url || `${origin}/pricing?cancelled=true`,
      metadata: { user_id: user.id, asset_id: asset_id || "", asset_type: asset_type || "" },
    };

    if (mode === "subscription") {
      sessionConfig.mode = "subscription";
      sessionConfig.line_items = [{ price: price_id, quantity: 1 }];
      sessionConfig.metadata.plan = plan || "business";
    } else {
      // One-time payment
      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Validate asset if provided
      if (asset_id && asset_type === "business") {
        const { data: business } = await supabase
          .from("digital_businesses")
          .select("id, sale_price, name")
          .eq("id", asset_id)
          .single();
        
        if (!business) {
          return new Response(JSON.stringify({ error: "Asset not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      // Get platform fee
      const { data: feeConfig } = await supabase
        .from("fee_config")
        .select("percentage")
        .eq("category", asset_type || "saas")
        .single();
      
      const feePercent = feeConfig?.percentage || 5;
      const unitAmount = Math.round(amount * 100);

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
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

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
    logStep("ERROR", { message: err.message });
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
