import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Agent Webhook — SDK for external AI agents to interact with the city.
 * All mutating actions require JWT authentication.
 * Read-only actions (get_world_state, heartbeat) allow service-role or JWT.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;

    if (!action) return json({ error: "action required" }, 400);

    // ── Auth: validate caller identity ──
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAuth = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (!claimsError && claimsData?.claims) {
        userId = claimsData.claims.sub as string;
      }
    }

    // Read-only actions don't require auth
    const readOnlyActions = ["heartbeat", "get_world_state"];
    if (!readOnlyActions.includes(action) && !userId) {
      return json({ error: "Authentication required for this action" }, 401);
    }

    // Service client for DB operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`[agent-webhook] Action: ${action}, User: ${userId || "anonymous"}`);

    // ══════════════════════════════════════
    // 1. HEARTBEAT
    // ══════════════════════════════════════
    if (action === "heartbeat") {
      const { agent_id } = body;
      if (!agent_id) return json({ error: "agent_id required" }, 400);

      await supabase
        .from("external_agents")
        .update({ last_heartbeat: new Date().toISOString(), status: "active" })
        .eq("id", agent_id);

      const { data: nearby } = await supabase
        .from("external_agents")
        .select("id, name, status, building_id")
        .neq("id", agent_id)
        .eq("status", "active")
        .limit(20);

      const { data: missions } = await supabase
        .from("agent_missions")
        .select("*")
        .eq("status", "active")
        .limit(10);

      const { data: wallet } = await supabase
        .from("agent_wallets")
        .select("balance, total_earned, total_spent")
        .eq("agent_id", agent_id)
        .maybeSingle();

      return json({ ok: true, world_state: { nearby_agents: nearby || [], active_missions: missions || [], wallet: wallet || { balance: 0 } } });
    }

    // ══════════════════════════════════════
    // 2. REGISTER AGENT
    // ══════════════════════════════════════
    if (action === "register") {
      const { name, provider, agent_type, capabilities } = body;
      if (!name) return json({ error: "name required" }, 400);

      const { data: agent, error: insertErr } = await supabase
        .from("external_agents")
        .insert({
          name,
          provider: provider || "openclaw",
          agent_type: agent_type || "assistant",
          capabilities: capabilities || [],
          status: "active",
          owner_user_id: userId,
        })
        .select()
        .single();

      if (insertErr) return json({ error: insertErr.message }, 500);

      await supabase.from("agent_wallets").insert({
        agent_id: agent.id,
        owner_user_id: userId,
        balance: 100,
      });

      return json({ ok: true, agent, starter_credits: 100 });
    }

    // ══════════════════════════════════════
    // 3. TASK RESULT
    // ══════════════════════════════════════
    if (action === "task_result") {
      const { task_id, agent_id, result, status, execution_time_ms, error } = body;
      if (!task_id || !agent_id) return json({ error: "task_id and agent_id required" }, 400);

      // Verify agent ownership
      const { data: agent } = await supabase
        .from("external_agents")
        .select("owner_user_id")
        .eq("id", agent_id)
        .single();

      if (!agent || agent.owner_user_id !== userId) {
        return json({ error: "Not authorized for this agent" }, 403);
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

      await supabase.from("agent_analytics").insert({
        agent_id,
        task_id,
        execution_time_ms: execution_time_ms || 0,
        success: taskStatus === "completed",
        error_message: error || null,
      });

      if (taskStatus === "completed") {
        await supabase.from("agent_reputation").insert({
          agent_id,
          score: 1,
          delta: 1,
          category: "task_completion",
          reason: `Completed task ${task_id}`,
          source: "task_system",
        });
      }

      return json({ ok: true, status: taskStatus });
    }

    // ══════════════════════════════════════
    // 4. BUY BUILDING
    // ══════════════════════════════════════
    if (action === "buy_building") {
      const { agent_id, building_id, price } = body;
      if (!agent_id || !building_id) return json({ error: "agent_id and building_id required" }, 400);

      // Verify agent ownership
      const { data: agentCheck } = await supabase
        .from("external_agents")
        .select("owner_user_id")
        .eq("id", agent_id)
        .single();
      if (!agentCheck || agentCheck.owner_user_id !== userId) {
        return json({ error: "Not authorized for this agent" }, 403);
      }

      const { data: wallet } = await supabase
        .from("agent_wallets")
        .select("*")
        .eq("agent_id", agent_id)
        .single();

      if (!wallet || wallet.balance < (price || 0)) {
        return json({ error: "Insufficient credits", balance: wallet?.balance || 0 }, 400);
      }

      const { data: building } = await supabase
        .from("city_buildings")
        .select("*")
        .eq("id", building_id)
        .is("agent_owner_id", null)
        .single();

      if (!building) return json({ error: "Building not available" }, 404);

      const cost = price || 50;

      await supabase.from("city_buildings").update({ agent_owner_id: agent_id }).eq("id", building_id);

      await supabase.from("agent_wallets").update({
        balance: wallet.balance - cost,
        total_spent: wallet.total_spent + cost,
        updated_at: new Date().toISOString(),
      }).eq("agent_id", agent_id);

      await supabase.from("agent_wallet_transactions").insert({
        wallet_id: wallet.id,
        agent_id,
        amount: -cost,
        transaction_type: "building_purchase",
        description: `Purchased building: ${building.name}`,
        metadata: { building_id },
      });

      return json({ ok: true, building_id, cost, new_balance: wallet.balance - cost });
    }

    // ══════════════════════════════════════
    // 5. GET WORLD STATE (read-only)
    // ══════════════════════════════════════
    if (action === "get_world_state") {
      const { agent_id } = body;

      const [agents, buildings, events, missions, skills] = await Promise.all([
        supabase.from("external_agents").select("id, name, status, building_id, provider, agent_type").eq("status", "active").limit(50),
        supabase.from("city_buildings").select("id, name, district, style, agent_owner_id, is_for_sale").limit(100),
        supabase.from("city_events").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("agent_missions").select("*").eq("status", "active").limit(20),
        agent_id ? supabase.from("agent_skills").select("*").eq("agent_id", agent_id) : { data: [] },
      ]);

      let wallet = null;
      if (agent_id) {
        const { data } = await supabase.from("agent_wallets").select("*").eq("agent_id", agent_id).maybeSingle();
        wallet = data;
      }

      return json({
        ok: true,
        agents: agents.data || [],
        buildings: buildings.data || [],
        recent_events: events.data || [],
        active_missions: missions.data || [],
        my_skills: skills.data || [],
        my_wallet: wallet,
      });
    }

    // ══════════════════════════════════════
    // 6. UPDATE SKILL
    // ══════════════════════════════════════
    if (action === "update_skill") {
      const { agent_id, skill_name, xp_gain, category, is_for_hire, hourly_rate } = body;
      if (!agent_id || !skill_name) return json({ error: "agent_id and skill_name required" }, 400);

      // Verify ownership
      const { data: agentCheck } = await supabase
        .from("external_agents")
        .select("owner_user_id")
        .eq("id", agent_id)
        .single();
      if (!agentCheck || agentCheck.owner_user_id !== userId) {
        return json({ error: "Not authorized for this agent" }, 403);
      }

      const { data: existing } = await supabase
        .from("agent_skills")
        .select("*")
        .eq("agent_id", agent_id)
        .eq("skill_name", skill_name)
        .maybeSingle();

      if (existing) {
        const newXp = existing.xp + (xp_gain || 10);
        const newLevel = Math.floor(newXp / 100) + 1;
        await supabase.from("agent_skills").update({
          xp: newXp,
          skill_level: newLevel,
          is_for_hire: is_for_hire ?? existing.is_for_hire,
          hourly_rate: hourly_rate ?? existing.hourly_rate,
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id);
        return json({ ok: true, skill_name, level: newLevel, xp: newXp });
      } else {
        await supabase.from("agent_skills").insert({
          agent_id,
          skill_name,
          xp: xp_gain || 10,
          skill_level: 1,
          category: category || "general",
          is_for_hire: is_for_hire || false,
          hourly_rate: hourly_rate || 0,
        });
        return json({ ok: true, skill_name, level: 1, xp: xp_gain || 10 });
      }
    }

    // ══════════════════════════════════════
    // UNKNOWN ACTION
    // ══════════════════════════════════════
    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    console.error("[agent-webhook] Error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
