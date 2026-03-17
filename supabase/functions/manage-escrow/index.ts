import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { action, escrow_id } = await req.json();

    if (action === "release") {
      // Only seller can release (confirm delivery)
      const { data: escrow } = await supabase
        .from("escrows")
        .select("*")
        .eq("id", escrow_id)
        .eq("status", "holding")
        .single();

      if (!escrow) {
        return new Response(JSON.stringify({ error: "Escrow not found or already processed" }), { status: 404, headers: corsHeaders });
      }

      // Verify the buyer is confirming
      if (escrow.buyer_id !== user.id) {
        return new Response(JSON.stringify({ error: "Only buyer can release escrow" }), { status: 403, headers: corsHeaders });
      }

      // Release funds
      await supabase.from("escrows").update({
        status: "released",
        released_at: new Date().toISOString(),
      }).eq("id", escrow_id);

      // Log
      await supabase.from("financial_logs").insert({
        user_id: user.id,
        event_type: "escrow_released",
        amount: escrow.amount,
        description: `Escrow liberado para deal ${escrow.deal_id}`,
      });

      return new Response(JSON.stringify({ success: true, status: "released" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "dispute") {
      await supabase.from("escrows").update({ status: "disputed" }).eq("id", escrow_id);
      
      await supabase.from("financial_logs").insert({
        user_id: user.id,
        event_type: "escrow_disputed",
        description: `Disputa aberta para escrow ${escrow_id}`,
      });

      return new Response(JSON.stringify({ success: true, status: "disputed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: corsHeaders });
  } catch (err: any) {
    console.error("Escrow error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
