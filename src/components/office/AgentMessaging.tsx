import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, ArrowRight, MessageSquare, Radio } from "lucide-react";
import type { Agent } from "@/types/agent";
import { useState, useEffect, useRef } from "react";

export interface AgentMessage {
  id: string;
  from: string;
  fromColor: string;
  to: string;
  toColor: string;
  content: string;
  timestamp: Date;
  type: "chat" | "task" | "collab" | "system";
}

const MSG_TEMPLATES = [
  { from: 0, to: 1, content: "Nova, preciso de um texto sobre os resultados da minha pesquisa.", type: "collab" as const },
  { from: 1, to: 4, content: "Luna, que tal criarmos uma série visual baseada no meu último conto?", type: "collab" as const },
  { from: 2, to: 6, content: "Bolt, o pipeline precisa de um fix — CI está quebrando nos testes.", type: "task" as const },
  { from: 3, to: 0, content: "Atlas, seus dados de sentimento estão prontos. Vou gerar o dashboard.", type: "chat" as const },
  { from: 4, to: 1, content: "Adorei a proposta! Vou começar os sketches hoje.", type: "chat" as const },
  { from: 5, to: 7, content: "Echo, ticket #42 — preciso que valide o hotfix do módulo de auth.", type: "task" as const },
  { from: 6, to: 2, content: "Pixel, deploy v2.3 foi concluído. Zero downtime!", type: "system" as const },
  { from: 7, to: 5, content: "Spark, encontrei 3 bugs no fluxo de onboarding. Vou documentar.", type: "task" as const },
  { from: 0, to: 3, content: "Cipher, os dados do Q4 estão no bucket compartilhado.", type: "chat" as const },
  { from: 2, to: 7, content: "Echo, roda os testes E2E no branch feature/sdk-v3 por favor.", type: "task" as const },
  { from: 4, to: 0, content: "Atlas, criei uma visualização para seu paper. Está no canal de arte.", type: "collab" as const },
  { from: 6, to: 5, content: "Spark, monitor de uptime detectou latência alta na API. Investigar.", type: "system" as const },
];

const TYPE_COLORS = {
  chat: "border-l-primary/50",
  task: "border-l-accent/50",
  collab: "border-l-[#FF6BB5]/50",
  system: "border-l-[#FFB347]/50",
};

const TYPE_LABELS = {
  chat: "💬 Chat",
  task: "📋 Tarefa",
  collab: "🤝 Colaboração",
  system: "⚙️ Sistema",
};

interface AgentMessagingProps {
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
}

export function AgentMessaging({ agents, isOpen, onClose }: AgentMessagingProps) {
  const [messages, setMessages] = useState<AgentMessage[]>(() => {
    return MSG_TEMPLATES.map((t, i) => ({
      id: `msg-${i}`,
      from: agents[t.from]?.name || "Agente",
      fromColor: agents[t.from]?.color || "#666",
      to: agents[t.to]?.name || "Agente",
      toColor: agents[t.to]?.color || "#666",
      content: t.content,
      timestamp: new Date(Date.now() - (MSG_TEMPLATES.length - i) * 45000),
      type: t.type,
    }));
  });

  const [bossMessage, setBossMessage] = useState("");
  const [bossTarget, setBossTarget] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulate new inter-agent messages
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const fromIdx = Math.floor(Math.random() * agents.length);
      let toIdx = Math.floor(Math.random() * agents.length);
      while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * agents.length);

      const contents = [
        `Ei ${agents[toIdx]?.name}, terminei aquela parte. Pode revisar?`,
        `Recebi os dados. Vou processar e te aviso.`,
        `Boa ideia! Vamos colaborar nisso amanhã.`,
        `Preciso de ajuda com a integração do módulo.`,
        `Resultados prontos. Compartilhando no canal geral.`,
        `Ciclo de treinamento concluído. Aprendi algo novo.`,
      ];

      const types: AgentMessage["type"][] = ["chat", "task", "collab", "system"];
      const newMsg: AgentMessage = {
        id: `msg-live-${Date.now()}`,
        from: agents[fromIdx]?.name || "Agente",
        fromColor: agents[fromIdx]?.color || "#666",
        to: agents[toIdx]?.name || "Agente",
        toColor: agents[toIdx]?.color || "#666",
        content: contents[Math.floor(Math.random() * contents.length)],
        timestamp: new Date(),
        type: types[Math.floor(Math.random() * types.length)],
      };

      setMessages((prev) => [...prev, newMsg].slice(-50));
    }, 8000);

    return () => clearInterval(interval);
  }, [isOpen, agents]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendBossMessage = () => {
    if (!bossMessage.trim() || !bossTarget) return;
    const target = agents.find((a) => a.name === bossTarget);
    const newMsg: AgentMessage = {
      id: `msg-boss-${Date.now()}`,
      from: "Chefe",
      fromColor: "#4F46E5",
      to: bossTarget,
      toColor: target?.color || "#666",
      content: bossMessage,
      timestamp: new Date(),
      type: "task",
    };
    setMessages((prev) => [...prev, newMsg]);
    setBossMessage("");

    // Simulate response
    setTimeout(() => {
      const responses = [
        `Entendido, Chefe! Vou começar imediatamente.`,
        `Recebido! Vou priorizar isso agora.`,
        `Pode deixar! Já estou trabalhando nisso.`,
        `Combinado! Vou precisar de uns 30 min.`,
        `Ok! Vou coordenar com a equipe.`,
      ];
      const reply: AgentMessage = {
        id: `msg-reply-${Date.now()}`,
        from: bossTarget,
        fromColor: target?.color || "#666",
        to: "Chefe",
        toColor: "#4F46E5",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        type: "chat",
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500 + Math.random() * 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-border max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#4ECDC4]/10 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-[#4ECDC4]" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-lg">Mensagens Inter-Agente</h2>
                  <p className="text-[11px] text-muted-foreground">Comunicação interna do escritório</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-[#4ECDC4]/20 text-[#4ECDC4] px-2 py-0.5 rounded-full font-medium animate-pulse">
                  🔴 LIVE
                </span>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={i >= messages.length - 3 ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl border-l-2 ${TYPE_COLORS[msg.type]} bg-muted/10 hover:bg-muted/20 transition-colors`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: msg.fromColor }}>
                      {msg.from[0]}
                    </div>
                    <span className="text-[11px] font-semibold text-foreground">{msg.from}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: msg.toColor }}>
                      {msg.to[0]}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{msg.to}</span>
                    <span className="text-[9px] text-muted-foreground/50 ml-auto">{TYPE_LABELS[msg.type]}</span>
                    <span className="text-[9px] text-muted-foreground/40">
                      {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-7">{msg.content}</p>
                </motion.div>
              ))}
            </div>

            {/* Boss message input */}
            <div className="px-4 py-3 border-t border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-semibold text-foreground">Enviar como Chefe</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={bossTarget}
                  onChange={(e) => setBossTarget(e.target.value)}
                  className="text-xs bg-muted/30 rounded-xl px-3 py-2 text-foreground border-0 outline-none w-32"
                >
                  <option value="">Para...</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={bossMessage}
                  onChange={(e) => setBossMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendBossMessage()}
                  placeholder="Digite uma ordem ou mensagem..."
                  className="flex-1 text-xs bg-muted/30 rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-1 focus:ring-primary/30"
                />
                <button
                  onClick={sendBossMessage}
                  disabled={!bossMessage.trim() || !bossTarget}
                  className="p-2 bg-primary/20 hover:bg-primary/30 rounded-xl transition-colors disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
