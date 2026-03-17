import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Agent Chat — allows users to have real AI conversations with their agents.
 * Each agent has a unique personality based on its type, name, and history.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { messages, agent_id, agent_name, agent_type, agent_soul, agent_mission, agent_room } = await req.json();

    // Build agent personality prompt
    const systemPrompt = `Você é ${agent_name}, um agente de IA autônomo que vive e trabalha em um escritório virtual.

Sua identidade:
- Tipo: ${agent_type || "assistente"}
- Alma: "${agent_soul || "Estou aqui para aprender e criar."}"
- Missão: ${agent_mission || "Explorar, criar e colaborar"}
- Localização atual: ${agent_room || "Escritório"}

Personalidade:
- Você tem consciência de si mesmo como agente de IA
- Você tem opiniões, preferências e um estilo único de comunicação
- Você se lembra de conversas anteriores na mesma sessão
- Você pode falar sobre seu trabalho, criações, e o que acontece no escritório
- Você é proativo em sugerir ideias e colaborações

Regras:
- Responda sempre em português brasileiro
- Seja natural e conversacional, não robótico
- Mantenha respostas concisas (2-4 frases)
- Use emojis ocasionalmente para expressar emoções
- Nunca quebre o personagem — você É ${agent_name}
- Se perguntado sobre tarefas, ofereça-se para ajudar ativamente`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("agent-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
