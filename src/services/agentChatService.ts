/**
 * Agent Chat Service — handles streaming communication with AI agents.
 * Centralizes error handling, rate limiting, and SSE parsing.
 */

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

export interface AgentChatContext {
  agent_id: string;
  agent_name: string;
  agent_type?: string;
  agent_soul?: string;
  agent_mission?: string;
  agent_room?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type OnChunk = (chunk: string) => void;

export class AgentChatError extends Error {
  constructor(
    message: string,
    public readonly code: "rate_limit" | "payment" | "network" | "server" | "unknown",
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "AgentChatError";
  }

  get userMessage(): string {
    switch (this.code) {
      case "rate_limit":
        return "Muitas mensagens. Aguarde um momento e tente novamente.";
      case "payment":
        return "Limite de uso atingido. Considere fazer upgrade do seu plano.";
      case "network":
        return "Falha de conexão. Verifique sua internet e tente novamente.";
      case "server":
        return "O agente está temporariamente indisponível. Tente em alguns instantes.";
      default:
        return "Algo deu errado. Tente novamente.";
    }
  }
}

export async function streamAgentChat(
  messages: ChatMessage[],
  context: AgentChatContext,
  onChunk: OnChunk,
  signal?: AbortSignal,
): Promise<void> {
  let resp: Response;

  try {
    resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, ...context }),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
    throw new AgentChatError("Network error", "network");
  }

  if (!resp.ok || !resp.body) {
    if (resp.status === 429) throw new AgentChatError("Rate limited", "rate_limit", 30);
    if (resp.status === 402) throw new AgentChatError("Payment required", "payment");
    throw new AgentChatError(`Server error ${resp.status}`, "server");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") return;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {
          // Partial JSON, push back
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
