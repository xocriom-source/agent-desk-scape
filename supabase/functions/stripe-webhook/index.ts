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

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    console.log("Stripe event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const assetId = session.metadata?.asset_id;
        const feePercent = parseFloat(session.metadata?.fee_percent || "5");

        // Update payment status
        await supabase.from("payments")
          .update({ status: "completed", stripe_payment_intent: session.payment_intent as string })
          .eq("stripe_checkout_session", session.id);

        if (session.mode === "subscription") {
          const plan = session.metadata?.plan || "business";
          await supabase.from("subscriptions").upsert({
            user_id: userId,
            plan,
            status: "active",
            stripe_subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
            current_period_start: new Date().toISOString(),
          }, { onConflict: "user_id" });

          // Sync user_plans table
          if (userId) {
            await supabase.from("user_plans").upsert({
              user_id: userId,
              plan_id: plan,
              status: "active",
              activated_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });
          }
        } else if (assetId) {
          // Create escrow for asset purchase
          const amount = (session.amount_total || 0) / 100;
          
          // Find seller
          const { data: business } = await supabase
            .from("digital_businesses")
            .select("owner_id")
            .eq("id", assetId)
            .single();

          if (business) {
            // Create escrow
            await supabase.from("escrows").insert({
              deal_id: assetId,
              buyer_id: userId,
              seller_id: business.owner_id,
              amount,
              status: "holding",
            });

            // Record platform fee
            const feeAmount = amount * (feePercent / 100);
            await supabase.from("platform_fees").insert({
              deal_id: assetId,
              category: "business",
              percentage: feePercent,
              amount: feeAmount,
            });
          }
        }

        await supabase.from("financial_logs").insert({
          user_id: userId,
          event_type: "payment_completed",
          amount: (session.amount_total || 0) / 100,
          description: `Pagamento concluído: ${session.id}`,
          metadata: { session_id: session.id, mode: session.mode },
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        
        await supabase.from("subscriptions")
          .update({
            status: sub.status === "active" ? "active" : "inactive",
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase.from("subscriptions")
          .update({ status: "cancelled", plan: "free" })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
