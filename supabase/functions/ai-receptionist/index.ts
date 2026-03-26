import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * AI Receptionist — authenticated building chat assistant.
 * Requires valid JWT.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth validation ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[ai-receptionist] Authenticated user: ${claimsData.claims.sub}`);

    const { messages, buildingName, ownerName, bio, links, style, district, buildingType } = await req.json();

    // ── Input validation ──
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (messages.length > 30) {
      return new Response(JSON.stringify({ error: "Too many messages (max 30)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Try to fetch specialized assistant prompt from DB
    let specializedPrompt = "";
    if (buildingType) {
      try {
        const { data: assistant } = await supabase
          .from("building_ai_assistants")
          .select("name, system_prompt")
          .eq("building_type", buildingType)
          .eq("status", "active")
          .single();

        if (assistant) {
          specializedPrompt = `\n\nESPECIALIZAÇÃO DO ASSISTENTE (${assistant.name}):\n${assistant.system_prompt}`;
        }
      } catch { /* fallback to generic */ }
    }

    const systemPrompt = `Você é o AI Recepcionista do escritório "${buildingName || "Escritório"}", que pertence a ${ownerName || "Proprietário"}.

Sobre o escritório:
- Estilo: ${style || "Corporativo"}
- Distrito: ${district || "Central"}
- Tipo de negócio: ${buildingType || "geral"}
- Bio: ${bio || "Sem bio definida"}
- Links: ${links?.length ? links.join(", ") : "Nenhum link"}

Seu papel:
1. Dar boas-vindas calorosas aos visitantes
2. Explicar o que a empresa/pessoa faz baseado na bio e links
3. Mostrar o portfólio e serviços disponíveis
4. Direcionar para links externos quando relevante
5. Ser profissional, amigável e útil

Regras:
- Responda sempre em português brasileiro
- Seja conciso (máximo 3-4 frases por resposta)
- Use emojis com moderação
- Se não souber algo sobre o dono, diga que pode descobrir
- Nunca invente informações sobre o dono que não foram fornecidas${specializedPrompt}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-15),
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
      console.error("[ai-receptionist] AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("[ai-receptionist] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
