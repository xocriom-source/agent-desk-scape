import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import type { CityBuilding } from "@/types/building";
import { DISTRICTS, BUILDING_STYLES } from "@/types/building";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-receptionist`;

// Map building style to business type for specialized AI
const STYLE_TO_TYPE: Record<string, string> = {
  corporate: "corporate",
  startup: "ai_startup",
  creative: "agency",
  industrial: "ecommerce",
  residential: "content",
  futuristic: "saas",
  classic: "newsletter",
  minimal: "marketplace",
  eco: "crypto",
};

interface AIReceptionistChatProps {
  building: CityBuilding;
  buildingType?: string;
}

export function AIReceptionistChat({ building, buildingType }: AIReceptionistChatProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const district = DISTRICTS.find(d => d.id === building.district);
  const styleInfo = BUILDING_STYLES.find(s => s.id === building.style);
  const resolvedType = buildingType || STYLE_TO_TYPE[building.style] || "corporate";

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Auto-greet on mount
  useEffect(() => {
    if (hasGreeted) return;
    setHasGreeted(true);
    sendMessage("Olá! Acabei de entrar no escritório.", true);
  }, [hasGreeted]);

  const sendMessage = async (text: string, isAutoGreet = false) => {
    const userMsg: Msg = { role: "user", content: text };
    const allMessages = isAutoGreet ? [userMsg] : [...messages, userMsg];
    
    if (!isAutoGreet) {
      setMessages(prev => [...prev, userMsg]);
    }
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return isAutoGreet
          ? [{ role: "assistant", content: assistantSoFar }]
          : [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          buildingName: building.name,
          ownerName: building.ownerName,
          bio: building.bio,
          links: building.links,
          style: styleInfo?.name,
          district: district?.name,
          buildingType: resolvedType,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        upsertAssistant(errData.error === "Rate limit exceeded" 
          ? "⚠️ Muitas requisições. Tente novamente em alguns segundos."
          : "Desculpe, estou temporariamente indisponível. Tente novamente em breve.");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      upsertAssistant("Desculpe, ocorreu um erro de conexão. Tente novamente.");
    }

    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col" style={{ height: "420px" }}>
      {/* Header */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/20">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
            AI Recepcionista
            <Sparkles className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-[10px] text-muted-foreground">{building.name} • {resolvedType}</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground text-xs py-8">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Conectando ao recepcionista...
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 bg-primary/20">
                <Bot className="w-3 h-3 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-primary/20 text-foreground"
                : "bg-muted text-foreground"
            }`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-1 [&_p]:mt-0 [&_p:last-child]:mb-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-primary/20 shrink-0 flex items-center justify-center mt-0.5">
                <User className="w-3 h-3 text-primary" />
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-primary/20">
              <Bot className="w-3 h-3 text-primary" />
            </div>
            <div className="bg-muted rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
          {["O que vocês fazem?", "Mostre o portfólio", "Quais serviços?"].map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={isLoading}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pergunte algo ao recepcionista..."
            disabled={isLoading}
            className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 hover:bg-primary/80 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
