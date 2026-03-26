import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    // ── MANDATORY signature verification ──
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not configured — rejecting all events");
      return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sig) {
      logStep("ERROR: Missing stripe-signature header");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      logStep("Signature verification FAILED", { error: err instanceof Error ? err.message : String(err) });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Event verified", { type: event.type });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const assetId = session.metadata?.asset_id;

        logStep("Checkout completed", { userId, mode: session.mode });

        // Update payment status
        await supabase.from("payments")
          .update({ status: "completed", stripe_payment_intent: session.payment_intent as string })
          .eq("stripe_checkout_session", session.id);

        if (session.mode === "subscription") {
          const plan = session.metadata?.plan || "business";
          if (userId) {
            await supabase.from("user_plans").upsert({
              user_id: userId,
              plan_id: plan,
              status: "active",
              activated_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
            logStep("Plan updated", { userId, plan });
          }
        } else if (assetId && assetId !== "") {
          const amount = (session.amount_total || 0) / 100;
          const { data: business } = await supabase
            .from("digital_businesses")
            .select("owner_id")
            .eq("id", assetId)
            .single();

          if (business && userId) {
            await supabase.from("escrows").insert({
              deal_id: assetId,
              buyer_id: userId,
              seller_id: business.owner_id,
              amount,
              status: "holding",
            });
            logStep("Escrow created", { assetId, amount });
          }
        }

        if (userId) {
          await supabase.from("financial_logs").insert({
            user_id: userId,
            event_type: "payment_completed",
            amount: (session.amount_total || 0) / 100,
            description: `Pagamento concluído: ${session.id}`,
            metadata: { session_id: session.id, mode: session.mode },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const productId = sub.items.data[0]?.price?.product as string;
        const planMap: Record<string, string> = {
          "prod_UAAoLCk0ESELPg": "business",
          "prod_UAAqS62X5nnqac": "mogul",
        };
        const detectedPlan = planMap[productId] || "explorer";
        const customerId = sub.customer as string;
        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as any).email;
        
        if (email) {
          const { data: userData } = await supabase.auth.admin.listUsers();
          const user = userData?.users?.find(u => u.email === email);
          if (user) {
            await supabase.from("user_plans").upsert({
              user_id: user.id,
              plan_id: sub.status === "active" ? detectedPlan : "explorer",
              status: sub.status === "active" ? "active" : "inactive",
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
            logStep("Subscription updated", { userId: user.id, plan: detectedPlan, status: sub.status });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const customer = await stripe.customers.retrieve(customerId);
        const email = (customer as any).email;
        
        if (email) {
          const { data: userData } = await supabase.auth.admin.listUsers();
          const user = userData?.users?.find(u => u.email === email);
          if (user) {
            await supabase.from("user_plans").update({
              plan_id: "explorer",
              status: "active",
              updated_at: new Date().toISOString(),
            }).eq("user_id", user.id);
            logStep("Subscription cancelled, reverted to explorer", { userId: user.id });
          }
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    logStep("ERROR", { message: err.message });
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
