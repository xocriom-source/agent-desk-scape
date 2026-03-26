import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-ESCROW] ${step}${detailsStr}`);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, escrow_id } = body;

    // Validate input
    if (!action || !escrow_id) {
      return new Response(JSON.stringify({ error: "action and escrow_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Processing", { action, escrow_id, userId: user.id });

    if (action === "release") {
      const { data: escrow } = await supabase
        .from("escrows")
        .select("*")
        .eq("id", escrow_id)
        .eq("status", "holding")
        .single();

      if (!escrow) {
        return new Response(JSON.stringify({ error: "Escrow not found or already processed" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (escrow.buyer_id !== user.id) {
        return new Response(JSON.stringify({ error: "Only buyer can release escrow" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("escrows").update({
        status: "released",
        released_at: new Date().toISOString(),
      }).eq("id", escrow_id);

      await supabase.from("financial_logs").insert({
        user_id: user.id,
        event_type: "escrow_released",
        amount: escrow.amount,
        description: `Escrow liberado para deal ${escrow.deal_id}`,
      });

      logStep("Escrow released", { escrow_id, amount: escrow.amount });

      return new Response(JSON.stringify({ success: true, status: "released" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "dispute") {
      // Verify user is party to the escrow
      const { data: escrow } = await supabase
        .from("escrows")
        .select("*")
        .eq("id", escrow_id)
        .eq("status", "holding")
        .single();

      if (!escrow) {
        return new Response(JSON.stringify({ error: "Escrow not found or already processed" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (escrow.buyer_id !== user.id && escrow.seller_id !== user.id) {
        return new Response(JSON.stringify({ error: "Only buyer or seller can dispute" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("escrows").update({ status: "disputed" }).eq("id", escrow_id);
      
      await supabase.from("financial_logs").insert({
        user_id: user.id,
        event_type: "escrow_disputed",
        description: `Disputa aberta para escrow ${escrow_id}`,
      });

      logStep("Escrow disputed", { escrow_id });

      return new Response(JSON.stringify({ success: true, status: "disputed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'release' or 'dispute'" }), {
      status: 400,
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
