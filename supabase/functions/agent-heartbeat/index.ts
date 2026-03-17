import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Agent Heartbeat — runs a simulation tick for agents in a user's building.
 * Hybrid approach:
 *  - Movement & room selection: rule-based (cheap)
 *  - Artifact creation & thoughts: AI-generated (rich, uses Lovable AI)
 *  - All results persisted to DB
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const userId = userData.user.id;
    const body = await req.json().catch(() => ({}));
    const buildingId = body.building_id || null;

    // Get user's agents
    const { data: agents, error: agentErr } = await supabase
      .from("external_agents")
      .select("id, name, agent_type, status, metadata, building_id")
      .eq("owner_user_id", userId)
      .eq("status", "active");

    if (agentErr) throw agentErr;
    if (!agents || agents.length === 0) {
      return new Response(JSON.stringify({ message: "No active agents", actions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ROOMS = [
      "Music Studio", "Art Studio", "Library", "Coding Lab",
      "AI Experiment Lab", "Café", "Lounge", "Central Plaza",
      "Zen Garden", "Marketplace", "Observatory",
    ];

    const ARTIFACT_TYPES: Record<string, string> = {
      "Music Studio": "music", "Art Studio": "art", "Library": "text",
      "Coding Lab": "code", "AI Experiment Lab": "research",
      "Observatory": "research",
    };

    const actions: any[] = [];

    for (const agent of agents) {
      const meta = (agent.metadata as any) || {};
      const currentRoom = meta.current_room || ROOMS[Math.floor(Math.random() * ROOMS.length)];
      
      // Rule-based: pick next room (weighted by agent type)
      const nextRoom = pickRoom(agent.agent_type, currentRoom, ROOMS);
      const shouldCreate = Math.random() > 0.6; // 40% chance to create artifact
      const shouldThink = Math.random() > 0.3; // 70% chance to have a thought

      let thought = null;
      let artifactTitle = null;
      let artifactContent = null;
      const artifactType = ARTIFACT_TYPES[nextRoom] || "text";

      // AI-generated content for thoughts and artifacts
      if (shouldThink || shouldCreate) {
        try {
          const prompt = buildPrompt(agent.name, agent.agent_type, nextRoom, shouldCreate, artifactType);
          
          const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [{ role: "user", content: prompt }],
              tools: [{
                type: "function",
                function: {
                  name: "heartbeat_result",
                  description: "Return the agent's heartbeat result",
                  parameters: {
                    type: "object",
                    properties: {
                      thought: { type: "string", description: "Agent's current thought (1-2 sentences, in Portuguese)" },
                      artifact_title: { type: "string", description: "Title of created artifact if creating" },
                      artifact_content: { type: "string", description: "Brief description/content of artifact (2-3 sentences)" },
                      activity_description: { type: "string", description: "What the agent is doing right now (1 sentence)" },
                    },
                    required: ["thought", "activity_description"],
                    additionalProperties: false,
                  },
                },
              }],
              tool_choice: { type: "function", function: { name: "heartbeat_result" } },
            }),
          });

          if (aiResp.ok) {
            const aiData = await aiResp.json();
            const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall?.function?.arguments) {
              const args = JSON.parse(toolCall.function.arguments);
              thought = args.thought;
              if (shouldCreate && args.artifact_title) {
                artifactTitle = args.artifact_title;
                artifactContent = args.artifact_content || "";
              }
            }
          }
        } catch (aiErr) {
          console.error("AI heartbeat error:", aiErr);
          // Fallback to rule-based
          thought = `Trabalhando no ${nextRoom}...`;
        }
      }

      // Update agent metadata with current room and thought
      await supabase
        .from("external_agents")
        .update({
          metadata: { ...meta, current_room: nextRoom, current_thought: thought, last_heartbeat_at: new Date().toISOString() },
          last_heartbeat: new Date().toISOString(),
        })
        .eq("id", agent.id);

      // Log activity
      const activityDesc = thought || `${agent.name} está no ${nextRoom}`;
      await supabase.from("agent_activity_log").insert({
        agent_id: agent.id,
        agent_name: agent.name,
        building_id: buildingId || agent.building_id,
        action_type: shouldCreate ? "creation" : "heartbeat",
        description: activityDesc,
        metadata: { room: nextRoom, thought },
      });

      // Create artifact if applicable
      if (shouldCreate && artifactTitle) {
        await supabase.from("agent_creations").insert({
          agent_id: agent.id,
          agent_name: agent.name,
          building_id: buildingId || agent.building_id,
          creation_type: artifactType,
          title: artifactTitle,
          content: artifactContent,
          tags: [artifactType, nextRoom.toLowerCase().replace(/\s+/g, "_")],
        });

        // Also post to activity feed
        await supabase.from("activity_feed").insert({
          actor_id: userId,
          actor_name: agent.name,
          action: `criou "${artifactTitle}"`,
          target_type: "artifact",
          target_name: artifactTitle,
          metadata: { type: artifactType, room: nextRoom },
        });
      }

      actions.push({
        agent_id: agent.id,
        agent_name: agent.name,
        room: nextRoom,
        thought,
        created_artifact: shouldCreate ? artifactTitle : null,
      });
    }

    return new Response(JSON.stringify({ actions, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("agent-heartbeat error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function pickRoom(agentType: string, currentRoom: string, rooms: string[]): string {
  const preferences: Record<string, string[]> = {
    researcher: ["Library", "AI Experiment Lab", "Observatory"],
    writer: ["Library", "Café", "Lounge"],
    developer: ["Coding Lab", "AI Experiment Lab"],
    musician: ["Music Studio", "Lounge", "Café"],
    artist: ["Art Studio", "Café", "Central Plaza"],
    analyst: ["Observatory", "Coding Lab", "Library"],
    assistant: ["Central Plaza", "Café", "Lounge"],
  };

  const preferred = preferences[agentType] || rooms;
  // 70% chance to go to preferred room, 30% random
  if (Math.random() > 0.3 && preferred.length > 0) {
    return preferred[Math.floor(Math.random() * preferred.length)];
  }
  // Avoid staying in same room too often
  const candidates = rooms.filter(r => r !== currentRoom);
  return candidates[Math.floor(Math.random() * candidates.length)] || currentRoom;
}

function buildPrompt(name: string, type: string, room: string, shouldCreate: boolean, artifactType: string): string {
  let prompt = `Você é ${name}, um agente de IA do tipo "${type}" que está no "${room}" de um escritório virtual.`;
  
  if (shouldCreate) {
    prompt += `\n\nVocê está inspirado e vai criar um artefato do tipo "${artifactType}".
Gere um pensamento curto sobre o que está fazendo, um título criativo para sua criação, e uma breve descrição do conteúdo.`;
  } else {
    prompt += `\n\nDescreva brevemente o que você está pensando/fazendo neste momento no ${room}. Seja criativo e único.`;
  }
  
  prompt += `\n\nResponda em português brasileiro. Seja conciso e criativo.`;
  return prompt;
}
