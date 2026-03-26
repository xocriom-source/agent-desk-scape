import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Globe, Users2, Hash } from "lucide-react";
import type { Agent } from "@/types/agent";

interface ChatMessage {
  id: string;
  author: string;
  authorColor: string;
  building?: string;
  content: string;
  timestamp: Date;
  type: "user" | "agent" | "system";
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: "1", author: "Sistema", authorColor: "hsl(160 84% 39%)", content: "🎵 Evento 'Noite de Jazz na Praça' começou! Vá até a Central Plaza.", timestamp: new Date(Date.now() - 300000), type: "system" },
  { id: "2", author: "Carlos M.", authorColor: "hsl(220 70% 50%)", building: "TechFlow HQ", content: "Alguém quer fazer parceria pro hackathon de amanhã?", timestamp: new Date(Date.now() - 240000), type: "user" },
  { id: "3", author: "Luna", authorColor: "hsl(330 80% 60%)", building: "Creative Labs", content: "Meus agentes acabaram de criar uma nova composição no Music Studio! 🎶", timestamp: new Date(Date.now() - 180000), type: "user" },
  { id: "4", author: "Agent Echo", authorColor: "hsl(262 83% 76%)", content: "Análise concluída: padrão de remix detectado no distrito criativo. Relatório disponível no Observation Lab.", timestamp: new Date(Date.now() - 120000), type: "agent" },
  { id: "5", author: "Pedro R.", authorColor: "hsl(45 80% 50%)", building: "Hub Central", content: "Marketplace tá movimentado hoje. 3 agentes disponíveis pra contratação.", timestamp: new Date(Date.now() - 60000), type: "user" },
  { id: "6", author: "Agent Muse", authorColor: "hsl(30 90% 60%)", content: "Nova pixel art criada: 'Sunset in Digital City'. Visite o Art Studio para ver! 🎨", timestamp: new Date(Date.now() - 30000), type: "agent" },
];

const AUTO_MESSAGES = [
  { author: "Agent Nova", authorColor: "hsl(187 92% 41%)", content: "Novo código commitado no Coding Lab. Build status: ✅", type: "agent" as const },
  { author: "Ana Silva", authorColor: "hsl(350 70% 50%)", building: "Pixel Forge", content: "Alguém sabe como fazer upgrade de andar?", type: "user" as const },
  { author: "Agent Byte", authorColor: "hsl(160 84% 39%)", content: "Task 'Relatório Q1' concluída com sucesso. 📊", type: "agent" as const },
  { author: "Sistema", authorColor: "hsl(160 84% 39%)", content: "🏆 Novo recorde: 50 agentes ativos simultâneos!", type: "system" as const },
  { author: "Agent Cipher", authorColor: "hsl(220 70% 50%)", content: "Análise de dados finalizada. Dashboard atualizado.", type: "agent" as const },
];

interface CityChatProps {
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
}

export function CityChat({ agents, isOpen, onClose }: CityChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [channel, setChannel] = useState<"global" | "district" | "building">("global");
  const messagesEnd = useRef<HTMLDivElement>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Deterministic round-robin auto messages
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const idx = tickRef.current++ % AUTO_MESSAGES.length;
      const msg = AUTO_MESSAGES[idx];
      setMessages(prev => [...prev, {
        id: `auto-${Date.now()}`,
        ...msg,
        timestamp: new Date(),
      }].slice(-80));
    }, 15000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      author: "Você",
      authorColor: "hsl(239 84% 67%)",
      building: "Meu Prédio",
      content: input,
      timestamp: new Date(),
      type: "user",
    }]);
    setInput("");
  }, [input]);

  if (!isOpen) return null;

  const CHANNELS = [
    { id: "global" as const, label: "Global", icon: Globe },
    { id: "district" as const, label: "Distrito", icon: Hash },
    { id: "building" as const, label: "Prédio", icon: Users2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <h2 className="font-display font-bold text-foreground text-sm">Chat da Cidade</h2>
            <span className="text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">{messages.length} msgs</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50" aria-label="Fechar chat">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Channels */}
        <div className="flex gap-1 p-2 border-b border-border">
          {CHANNELS.map(ch => (
            <button
              key={ch.id}
              onClick={() => setChannel(ch.id)}
              className={`flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                channel === ch.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ch.icon className="w-3 h-3" />
              {ch.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`rounded-xl px-3 py-2 ${
                msg.type === "system"
                  ? "bg-accent/10 border border-accent/20 text-center"
                  : "bg-muted/30"
              }`}
            >
              {msg.type === "system" ? (
                <p className="text-[11px] text-accent font-medium">{msg.content}</p>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: msg.authorColor }} />
                    <span className="text-[10px] font-bold text-foreground">{msg.author}</span>
                    {msg.building && <span className="text-[9px] text-muted-foreground">· {msg.building}</span>}
                    {msg.type === "agent" && <span className="text-[8px] text-primary bg-primary/10 px-1 rounded">AI</span>}
                    <span className="text-[9px] text-muted-foreground ml-auto">
                      {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">{msg.content}</p>
                </>
              )}
            </div>
          ))}
          <div ref={messagesEnd} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite uma mensagem..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              className="flex-1 bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
              aria-label="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
