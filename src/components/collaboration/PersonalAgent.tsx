import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, X, Send, Brain, FileText, Search, BookOpen, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
}

export function PersonalAgent({ isOpen, onClose, agentName = "Atlas" }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `Olá! Sou ${agentName}, seu assistente pessoal de IA. Tenho memória persistente e posso ajudar com tarefas, pesquisa e documentos. Como posso ajudar?` },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [tab, setTab] = useState<"chat" | "memory" | "docs">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  const mainColor = "#6b8fc4";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const MOCK_MEMORIES = [
    { id: "m1", text: "User prefers Kanban for task management", date: "2d ago" },
    { id: "m2", text: "Primary focus: SaaS product development", date: "3d ago" },
    { id: "m3", text: "Scheduled weekly review on Fridays", date: "5d ago" },
    { id: "m4", text: "Prefers concise communication style", date: "1w ago" },
  ];

  const MOCK_DOCS = [
    { id: "d1", name: "Product Roadmap Q1", type: "pdf", trained: true },
    { id: "d2", name: "Brand Guidelines", type: "doc", trained: true },
    { id: "d3", name: "API Documentation", type: "md", trained: false },
    { id: "d4", name: "Sales Playbook", type: "pdf", trained: true },
  ];

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Entendi! Baseado no que sei sobre seus projetos e preferências, aqui está minha sugestão:\n\n1. Priorize as tarefas de maior impacto\n2. Delegue pesquisas para os agentes especializados\n3. Revise os resultados no final do dia\n\nPosso detalhar algum desses pontos?"
      }]);
      setIsThinking(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-4 top-20 z-50 w-96 max-h-[75vh] rounded-xl border overflow-hidden flex flex-col"
      style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.95)", backdropFilter: "blur(12px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${mainColor}20` }}>
            <Bot className="w-4 h-4" style={{ color: mainColor }} />
          </div>
          <div>
            <span className="text-xs font-mono font-bold tracking-wider text-white">{agentName.toUpperCase()}</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[8px] font-mono text-emerald-400">ONLINE</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: `${mainColor}10` }}>
        {([
          { id: "chat", label: "Chat", icon: Sparkles },
          { id: "memory", label: "Memory", icon: Brain },
          { id: "docs", label: "Docs", icon: FileText },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-mono tracking-wider transition-colors"
            style={{
              color: tab === t.id ? mainColor : "#6b7280",
              borderBottom: tab === t.id ? `2px solid ${mainColor}` : "2px solid transparent",
            }}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[250px] max-h-[400px]">
        {tab === "chat" && (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="px-3 py-2 rounded-lg text-[11px] font-mono max-w-[85%] whitespace-pre-wrap leading-relaxed"
                  style={{
                    backgroundColor: msg.role === "user" ? `${mainColor}20` : "rgba(255,255,255,0.05)",
                    color: msg.role === "user" ? mainColor : "#d1d5db",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex gap-1 px-3">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: mainColor }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "memory" && (
          <div className="space-y-2">
            <p className="text-[9px] font-mono tracking-wider" style={{ color: `${mainColor}50` }}>PERSISTENT MEMORIES</p>
            {MOCK_MEMORIES.map(m => (
              <div key={m.id} className="p-3 rounded-lg border" style={{ borderColor: `${mainColor}12`, background: `${mainColor}05` }}>
                <p className="text-[11px] font-mono text-white">{m.text}</p>
                <p className="text-[8px] font-mono mt-1" style={{ color: `${mainColor}50` }}>{m.date}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "docs" && (
          <div className="space-y-2">
            <p className="text-[9px] font-mono tracking-wider" style={{ color: `${mainColor}50` }}>TRAINING DOCUMENTS</p>
            {MOCK_DOCS.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: `${mainColor}12`, background: `${mainColor}05` }}>
                <FileText className="w-4 h-4" style={{ color: mainColor }} />
                <div className="flex-1">
                  <p className="text-[11px] font-mono text-white">{d.name}</p>
                  <p className="text-[8px] font-mono" style={{ color: `${mainColor}50` }}>.{d.type}</p>
                </div>
                <span className="text-[8px] font-mono px-2 py-0.5 rounded" style={{
                  backgroundColor: d.trained ? "#34d39915" : `${mainColor}10`,
                  color: d.trained ? "#34d399" : `${mainColor}60`,
                }}>
                  {d.trained ? "TRAINED" : "PENDING"}
                </span>
              </div>
            ))}
            <button className="w-full py-2.5 rounded-lg border border-dashed text-[10px] font-mono tracking-wider" style={{ borderColor: `${mainColor}30`, color: mainColor }}>
              + UPLOAD DOCUMENT
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      {tab === "chat" && (
        <div className="flex gap-2 p-3 border-t" style={{ borderColor: `${mainColor}10` }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder={`Ask ${agentName}...`}
            className="flex-1 px-3 py-2 rounded-lg text-[11px] font-mono bg-white/5 border text-white placeholder-gray-600 focus:outline-none"
            style={{ borderColor: `${mainColor}20` }}
          />
          <button onClick={sendMessage} className="p-2 rounded-lg" style={{ backgroundColor: `${mainColor}20` }}>
            <Send className="w-3.5 h-3.5" style={{ color: mainColor }} />
          </button>
        </div>
      )}
    </motion.div>
  );
}
