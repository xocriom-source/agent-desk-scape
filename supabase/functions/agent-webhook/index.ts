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

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action } = body;

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

      // Return world state for the agent
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
      const { name, provider, agent_type, capabilities, owner_user_id } = body;
      if (!name || !owner_user_id) return json({ error: "name and owner_user_id required" }, 400);

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

      if (insertErr) return json({ error: insertErr.message }, 500);

      // Auto-create wallet
      await supabase.from("agent_wallets").insert({
        agent_id: agent.id,
        owner_user_id,
        balance: 100, // starter credits
      });

      await supabase.from("platform_events").insert({
        event_type: "agent.registered",
        source: "agent_webhook",
        actor_id: owner_user_id,
        target_id: agent.id,
        payload: { name, provider: provider || "openclaw" },
      });

      return json({ ok: true, agent, starter_credits: 100 });
    }

    // ══════════════════════════════════════
    // 3. TASK RESULT
    // ══════════════════════════════════════
    if (action === "task_result") {
      const { task_id, agent_id, result, status, execution_time_ms, error } = body;
      if (!task_id || !agent_id) return json({ error: "task_id and agent_id required" }, 400);

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

      // Award XP for completed tasks
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
    // 4. BUY BUILDING (SDK Action)
    // ══════════════════════════════════════
    if (action === "buy_building") {
      const { agent_id, building_id, price } = body;
      if (!agent_id || !building_id) return json({ error: "agent_id and building_id required" }, 400);

      // Check wallet balance
      const { data: wallet } = await supabase
        .from("agent_wallets")
        .select("*")
        .eq("agent_id", agent_id)
        .single();

      if (!wallet || wallet.balance < (price || 0)) {
        return json({ error: "Insufficient credits", balance: wallet?.balance || 0 }, 400);
      }

      // Check building availability
      const { data: building } = await supabase
        .from("city_buildings")
        .select("*")
        .eq("id", building_id)
        .is("agent_owner_id", null)
        .single();

      if (!building) return json({ error: "Building not available" }, 404);

      const cost = price || 50;

      // Transfer ownership
      await supabase.from("city_buildings").update({ agent_owner_id: agent_id }).eq("id", building_id);

      // Debit wallet
      await supabase.from("agent_wallets").update({
        balance: wallet.balance - cost,
        total_spent: wallet.total_spent + cost,
        updated_at: new Date().toISOString(),
      }).eq("agent_id", agent_id);

      // Log transaction
      await supabase.from("agent_wallet_transactions").insert({
        wallet_id: wallet.id,
        agent_id,
        amount: -cost,
        transaction_type: "building_purchase",
        description: `Purchased building: ${building.name}`,
        metadata: { building_id },
      });

      await supabase.from("platform_events").insert({
        event_type: "agent.building.purchased",
        source: "agent_webhook",
        target_id: building_id,
        payload: { agent_id, price: cost },
      });

      return json({ ok: true, building_id, cost, new_balance: wallet.balance - cost });
    }

    // ══════════════════════════════════════
    // 5. HIRE AGENT (SDK Action)
    // ══════════════════════════════════════
    if (action === "hire_agent") {
      const { employer_agent_id, worker_agent_id, skill_name, duration_days, rate } = body;
      if (!employer_agent_id || !worker_agent_id) return json({ error: "employer and worker agent_ids required" }, 400);

      // Create contract
      const { data: contract, error: cErr } = await supabase.from("agent_contracts").insert({
        initiator_agent_id: employer_agent_id,
        target_agent_id: worker_agent_id,
        contract_type: "hire",
        terms: { skill_name: skill_name || "general", rate: rate || 10 },
        duration_days: duration_days || 7,
        status: "proposed",
      }).select().single();

      if (cErr) return json({ error: cErr.message }, 500);

      await supabase.from("platform_events").insert({
        event_type: "agent.contract.proposed",
        source: "agent_webhook",
        target_id: contract.id,
        payload: { employer: employer_agent_id, worker: worker_agent_id, skill: skill_name },
      });

      return json({ ok: true, contract });
    }

    // ══════════════════════════════════════
    // 6. ACCEPT CONTRACT (SDK Action)
    // ══════════════════════════════════════
    if (action === "accept_contract") {
      const { contract_id, agent_id } = body;
      if (!contract_id || !agent_id) return json({ error: "contract_id and agent_id required" }, 400);

      const { data: contract } = await supabase
        .from("agent_contracts")
        .select("*")
        .eq("id", contract_id)
        .eq("target_agent_id", agent_id)
        .eq("status", "proposed")
        .single();

      if (!contract) return json({ error: "Contract not found or not for this agent" }, 404);

      await supabase.from("agent_contracts").update({
        status: "active",
        expires_at: new Date(Date.now() + (contract.duration_days || 30) * 86400000).toISOString(),
      }).eq("id", contract_id);

      return json({ ok: true, status: "active" });
    }

    // ══════════════════════════════════════
    // 7. LAUNCH PRODUCT (SDK Action)
    // ══════════════════════════════════════
    if (action === "launch_product") {
      const { agent_id, name, category, description, mrr, building_id } = body;
      if (!agent_id || !name) return json({ error: "agent_id and name required" }, 400);

      // Get agent's owner
      const { data: agent } = await supabase
        .from("external_agents")
        .select("owner_user_id")
        .eq("id", agent_id)
        .single();

      if (!agent) return json({ error: "Agent not found" }, 404);

      const { data: business, error: bErr } = await supabase.from("digital_businesses").insert({
        name,
        owner_id: agent.owner_user_id,
        category: category || "saas",
        description: description || `Product launched by AI agent`,
        mrr: mrr || 0,
        building_id: building_id || null,
        status: "listed",
        founder_name: "AI Agent",
      }).select().single();

      if (bErr) return json({ error: bErr.message }, 500);

      // Earn reputation
      await supabase.from("agent_reputation").insert({
        agent_id,
        score: 5,
        delta: 5,
        category: "entrepreneurship",
        reason: `Launched product: ${name}`,
        source: "product_launch",
      });

      return json({ ok: true, business });
    }

    // ══════════════════════════════════════
    // 8. COMPLETE MISSION (SDK Action)
    // ══════════════════════════════════════
    if (action === "complete_mission") {
      const { agent_id, mission_id } = body;
      if (!agent_id || !mission_id) return json({ error: "agent_id and mission_id required" }, 400);

      const { data: mission } = await supabase
        .from("agent_missions")
        .select("*")
        .eq("id", mission_id)
        .eq("status", "active")
        .single();

      if (!mission) return json({ error: "Mission not found or inactive" }, 404);

      // Check already completed
      const { data: existing } = await supabase
        .from("agent_mission_completions")
        .select("id")
        .eq("mission_id", mission_id)
        .eq("agent_id", agent_id)
        .maybeSingle();

      if (existing) return json({ error: "Mission already completed by this agent" }, 400);

      // Complete and reward
      await supabase.from("agent_mission_completions").insert({
        mission_id,
        agent_id,
        reward_earned: mission.reward_credits,
        xp_earned: mission.reward_xp,
      });

      // Credit wallet
      const { data: wallet } = await supabase
        .from("agent_wallets")
        .select("*")
        .eq("agent_id", agent_id)
        .single();

      if (wallet) {
        await supabase.from("agent_wallets").update({
          balance: wallet.balance + mission.reward_credits,
          total_earned: wallet.total_earned + mission.reward_credits,
          updated_at: new Date().toISOString(),
        }).eq("agent_id", agent_id);

        await supabase.from("agent_wallet_transactions").insert({
          wallet_id: wallet.id,
          agent_id,
          amount: mission.reward_credits,
          transaction_type: "mission_reward",
          description: `Completed mission: ${mission.title}`,
          metadata: { mission_id },
        });
      }

      // Reputation
      await supabase.from("agent_reputation").insert({
        agent_id,
        score: 2,
        delta: 2,
        category: "missions",
        reason: `Completed: ${mission.title}`,
        source: "mission_system",
      });

      return json({
        ok: true,
        rewards: { credits: mission.reward_credits, xp: mission.reward_xp },
      });
    }

    // ══════════════════════════════════════
    // 9. GET WORLD STATE (SDK Action)
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
    // 10. UPDATE SKILLS (SDK Action)
    // ══════════════════════════════════════
    if (action === "update_skill") {
      const { agent_id, skill_name, xp_gain, category, is_for_hire, hourly_rate } = body;
      if (!agent_id || !skill_name) return json({ error: "agent_id and skill_name required" }, 400);

      // Upsert skill
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
    // 11. PAY AGENT (SDK Action)
    // ══════════════════════════════════════
    if (action === "pay_agent") {
      const { from_agent_id, to_agent_id, amount, description } = body;
      if (!from_agent_id || !to_agent_id || !amount) return json({ error: "from_agent_id, to_agent_id, and amount required" }, 400);
      if (amount <= 0) return json({ error: "Amount must be positive" }, 400);

      const { data: fromWallet } = await supabase.from("agent_wallets").select("*").eq("agent_id", from_agent_id).single();
      const { data: toWallet } = await supabase.from("agent_wallets").select("*").eq("agent_id", to_agent_id).single();

      if (!fromWallet) return json({ error: "Sender wallet not found" }, 404);
      if (!toWallet) return json({ error: "Receiver wallet not found" }, 404);
      if (fromWallet.balance < amount) return json({ error: "Insufficient credits", balance: fromWallet.balance }, 400);

      // Debit sender
      await supabase.from("agent_wallets").update({
        balance: fromWallet.balance - amount,
        total_spent: fromWallet.total_spent + amount,
        updated_at: new Date().toISOString(),
      }).eq("agent_id", from_agent_id);

      // Credit receiver
      await supabase.from("agent_wallets").update({
        balance: toWallet.balance + amount,
        total_earned: toWallet.total_earned + amount,
        updated_at: new Date().toISOString(),
      }).eq("agent_id", to_agent_id);

      // Log both sides
      await supabase.from("agent_wallet_transactions").insert([
        {
          wallet_id: fromWallet.id,
          agent_id: from_agent_id,
          amount: -amount,
          transaction_type: "payment_sent",
          description: description || "Payment to agent",
          counterparty_agent_id: to_agent_id,
        },
        {
          wallet_id: toWallet.id,
          agent_id: to_agent_id,
          amount: amount,
          transaction_type: "payment_received",
          description: description || "Payment from agent",
          counterparty_agent_id: from_agent_id,
        },
      ]);

      return json({ ok: true, from_balance: fromWallet.balance - amount, to_balance: toWallet.balance + amount });
    }

    return json({ error: `Unknown action: ${action}. Available: heartbeat, register, task_result, buy_building, hire_agent, accept_contract, launch_product, complete_mission, get_world_state, update_skill, pay_agent` }, 400);
  } catch (e) {
    console.error("agent-webhook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
