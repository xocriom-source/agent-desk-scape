import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

    // ── Heartbeat ──
    if (action === "heartbeat") {
      const { agent_id } = body;
      if (!agent_id) {
        return new Response(JSON.stringify({ error: "agent_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase
        .from("external_agents")
        .update({ last_heartbeat: new Date().toISOString(), status: "active" })
        .eq("id", agent_id);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Task result ──
    if (action === "task_result") {
      const { task_id, agent_id, result, status, execution_time_ms, error } = body;

      if (!task_id || !agent_id) {
        return new Response(
          JSON.stringify({ error: "task_id and agent_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const taskStatus = status === "error" ? "failed" : "completed";

      await supabase
        .from("external_agent_tasks")
        .update({
          result: result || null,
          status: taskStatus,
          execution_time_ms: execution_time_ms || null,
          error: error || null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", task_id)
        .eq("agent_id", agent_id);

      // Log analytics
      await supabase.from("agent_analytics").insert({
        agent_id,
        task_id,
        execution_time_ms: execution_time_ms || 0,
        success: taskStatus === "completed",
        error_message: error || null,
      });

      // Emit platform event
      await supabase.from("platform_events").insert({
        event_type: "agent.task.completed",
        source: "agent_webhook",
        target_id: task_id,
        payload: { agent_id, status: taskStatus, execution_time_ms },
      });

      return new Response(JSON.stringify({ ok: true, status: taskStatus }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Register agent ──
    if (action === "register") {
      const { name, provider, agent_type, capabilities, owner_user_id } = body;

      if (!name || !owner_user_id) {
        return new Response(
          JSON.stringify({ error: "name and owner_user_id required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: agent, error: insertErr } = await supabase
        .from("external_agents")
        .insert({
          name,
          provider: provider || "openclaw",
          agent_type: agent_type || "assistant",
          capabilities: capabilities || [],
          status: "active",
          owner_user_id,
        })
        .select()
        .single();

      if (insertErr) {
        return new Response(JSON.stringify({ error: insertErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Emit event
      await supabase.from("platform_events").insert({
        event_type: "agent.registered",
        source: "agent_webhook",
        actor_id: owner_user_id,
        target_id: agent.id,
        payload: { name, provider: provider || "openclaw" },
      });

      return new Response(JSON.stringify({ ok: true, agent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("agent-webhook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
