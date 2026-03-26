import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Clock, ListTodo, Terminal, Send, MessageCircle, Eye, Brain, Star, Target, AlertCircle } from "lucide-react";
import type { Agent } from "@/types/agent";
import { useState, useRef, useEffect, useCallback } from "react";
import { streamAgentChat, AgentChatError, type ChatMessage } from "@/services/agentChatService";

const statusLabels: Record<string, string> = {
  active: "Ativo", idle: "Ocioso", thinking: "Pensando...", busy: "Ocupado",
};

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-accent/15", text: "text-accent", dot: "#10B981" },
  idle: { bg: "bg-agent-idle/15", text: "text-agent-idle", dot: "#F59E0B" },
  thinking: { bg: "bg-primary/15", text: "text-primary", dot: "#6366F1" },
  busy: { bg: "bg-destructive/15", text: "text-destructive", dot: "#EF4444" },
};

interface AgentPanelProps {
  agent: Agent | null;
  onClose: () => void;
  onViewProfile?: (agent: Agent) => void;
}

export function AgentPanel({ agent, onClose, onViewProfile }: AgentPanelProps) {
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset chat when agent changes
  useEffect(() => {
    setChatHistory([]);
    setChatMessage("");
    setChatError(null);
    abortRef.current?.abort();
  }, [agent?.id]);

  // Cleanup on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [chatHistory, scrollToBottom]);

  const sendMessage = async () => {
    if (!chatMessage.trim() || !agent || isLoading) return;
    setChatError(null);

    const userMsg: ChatMessage = { role: "user", content: chatMessage };
    const allMessages = [...chatHistory, userMsg];
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setChatHistory(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    abortRef.current = new AbortController();

    try {
      await streamAgentChat(
        allMessages,
        {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_type: agent.identity,
          agent_soul: agent.soul,
          agent_mission: agent.mission,
          agent_room: agent.room,
        },
        upsertAssistant,
        abortRef.current.signal,
      );

      // If no content was streamed, show fallback
      if (!assistantSoFar) {
        upsertAssistant("Hmm, não consegui formular uma resposta. Pode tentar novamente? 🤔");
      }
    } catch (e) {
      if (e instanceof AgentChatError) {
        setChatError(e.userMessage);
        if (!assistantSoFar) {
          upsertAssistant(e.userMessage);
        }
      } else {
        console.error("[AgentPanel:sendMessage]", e);
        setChatError("Erro inesperado. Tente novamente.");
        if (!assistantSoFar) {
          upsertAssistant("Erro de conexão. Tente novamente em breve. 🔄");
        }
      }
    }

    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      {agent && (
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
          transition={{ duration: 0.2 }}
          className="absolute right-3 top-16 bottom-4 z-30 w-80"
        >
          <div className="glass-panel rounded-2xl h-full flex flex-col overflow-hidden shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: agent.color }}>
                  {["🔬", "✍️", "💻", "📊", "🎨", "🔧", "⚡", "🧪"][agent.avatar]}
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground text-sm">{agent.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{agent.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {onViewProfile && (
                  <button onClick={() => onViewProfile(agent)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors" title="Ver perfil completo">
                    <Eye className="w-4 h-4 text-primary" />
                  </button>
                )}
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Status + Room + Training */}
            <div className="px-4 py-2.5 border-b border-border/10 space-y-1.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusConfig[agent.status].dot }} />
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusConfig[agent.status].bg} ${statusConfig[agent.status].text}`}>
                    {statusLabels[agent.status]}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">📍 {agent.room}</span>
              </div>
              {agent.isTraining && (
                <div className="flex items-center gap-1.5 text-[10px] text-primary">
                  <Zap className="w-3 h-3" />
                  <span className="font-medium">Treinando · Ciclo #{agent.trainingCycle}</span>
                </div>
              )}
            </div>

            {/* Soul excerpt */}
            <div className="px-4 py-2.5 border-b border-border/10">
              <p className="text-[11px] text-muted-foreground italic">"{agent.soul}"</p>
            </div>

            {/* Quick stats */}
            <div className="px-4 py-2 border-b border-border/10 flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-[#FFB347]" />
                <span className="text-[10px] text-foreground font-medium">{agent.reputation}</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-muted-foreground">{agent.skills.length} skills</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-accent" />
                <span className="text-[10px] text-muted-foreground">{agent.totalCreations} criações</span>
              </div>
            </div>

            {/* Current thought */}
            {agent.currentThought && (
              <div className="px-4 py-2 border-b border-border/10">
                <p className="text-[10px] text-muted-foreground">💭 {agent.currentThought}</p>
              </div>
            )}

            {/* Mission preview */}
            <div className="px-4 py-2.5 border-b border-border/10">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-3.5 h-3.5 text-accent" />
                <span className="text-[11px] font-display font-semibold text-foreground">Missão</span>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2">{agent.mission}</p>
            </div>

            {/* Chat - REAL AI with improved error handling */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border/10">
                <MessageCircle className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-display font-semibold text-foreground">Chat</span>
                <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full ml-auto">IA Real</span>
              </div>

              {/* Error banner */}
              {chatError && (
                <div className="px-3 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                  <p className="text-[10px] text-destructive">{chatError}</p>
                  <button onClick={() => setChatError(null)} className="ml-auto text-destructive/60 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                {chatHistory.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-4">
                    Converse com {agent.name} — respostas geradas por IA em tempo real ✨
                  </p>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`text-[11px] px-3 py-2 rounded-xl max-w-[90%] ${msg.role === "user" ? "bg-primary/20 text-foreground ml-auto" : "bg-muted/50 text-foreground"}`}>
                    <span className="font-semibold text-[10px] block mb-0.5">{msg.role === "user" ? "Você" : agent.name}</span>
                    {msg.content}
                  </div>
                ))}
                {isLoading && chatHistory[chatHistory.length - 1]?.role !== "assistant" && (
                  <div className="text-[11px] px-3 py-2 rounded-xl bg-muted/50 max-w-[90%]">
                    <span className="font-semibold text-[10px] block mb-0.5">{agent.name}</span>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="px-3 py-2 border-t border-border/10 flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={`Mensagem para ${agent.name}...`}
                  disabled={isLoading}
                  className="flex-1 text-xs bg-muted/30 rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                />
                <button onClick={sendMessage} disabled={isLoading || !chatMessage.trim()} className="p-2 bg-primary/20 hover:bg-primary/30 rounded-xl transition-colors disabled:opacity-30">
                  <Send className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>

            {/* Logs */}
            <div className="px-4 py-2 border-t border-border/10 max-h-28 overflow-y-auto">
              <div className="flex items-center gap-2 mb-1">
                <Terminal className="w-3 h-3 text-muted-foreground" />
                <span className="text-[9px] font-display text-muted-foreground uppercase tracking-wider">Logs</span>
              </div>
              <div className="space-y-0.5 font-mono">
                {agent.logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="text-[9px] text-muted-foreground/60">
                    <span className="text-muted-foreground/30">
                      [{log.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}]
                    </span>{" "}
                    {log.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
