import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Hash, MessageCircle } from "lucide-react";

interface ChatMessage {
  id: number;
  author: string;
  text: string;
  channel: string;
  time: string;
  isSystem?: boolean;
}

const CHANNELS = [
  { id: "global", label: "Global", icon: "🌍" },
  { id: "district", label: "Distrito", icon: "🏘️" },
  { id: "building", label: "Prédio", icon: "🏢" },
];

const MOCK_MESSAGES: ChatMessage[] = [
  { id: 1, author: "André", text: "Alguém no Tech District?", channel: "global", time: "14:30" },
  { id: 2, author: "Sistema", text: "Nova missão diária disponível!", channel: "global", time: "14:28", isSystem: true },
  { id: 3, author: "Maria", text: "Acabei de personalizar meu prédio, ficou incrível!", channel: "global", time: "14:25" },
  { id: 4, author: "Carlos", text: "Vendo agente músico nível 5", channel: "global", time: "14:22" },
  { id: 5, author: "Atlas", text: "🤖 Terminei a análise de dados do trimestre", channel: "building", time: "14:20" },
  { id: 6, author: "Nova", text: "🎨 Criei 3 designs hoje!", channel: "building", time: "14:15" },
  { id: 7, author: "SkyPilot", text: "Alguém quer fazer speedrun?", channel: "district", time: "14:10" },
  { id: 8, author: "Echo", text: "Meu drone tá glitchado 😂", channel: "district", time: "14:05" },
];

const BOT_MESSAGES = [
  "Legal! Vou dar uma olhada 👀",
  "Alguém sabe onde fica o Marketplace?",
  "Meu agente acabou de subir de nível! 🎉",
  "Tá tendo evento no Central Plaza?",
  "Boa noite galera ✌️",
  "Quem quer trocar agentes?",
  "A cidade tá linda hoje à noite",
  "Acabei de entrar, alguém ajuda?",
];

const BOT_AUTHORS = ["Pedro", "Julia", "Rafael", "Camila", "Lucas", "Ana", "NeonRunner", "CodeFlyer"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CityChat({ isOpen, onClose }: Props) {
  const [channel, setChannel] = useState("global");
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(100);

  const filtered = messages.filter(m => m.channel === channel);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filtered.length]);

  // Simulate incoming messages
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const text = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];
      const author = BOT_AUTHORS[Math.floor(Math.random() * BOT_AUTHORS.length)];
      const ch = CHANNELS[Math.floor(Math.random() * CHANNELS.length)].id;
      const now = new Date();
      setMessages(prev => [...prev, {
        id: counterRef.current++,
        author,
        text,
        channel: ch,
        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
      }]);
    }, 6000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    const now = new Date();
    setMessages(prev => [...prev, {
      id: counterRef.current++,
      author: "Você",
      text: input.trim(),
      channel,
      time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
    }]);
    setInput("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="absolute top-20 right-4 z-50 w-80"
        >
          <div className="bg-[#0D0E0A]/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ height: 420 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#C8D880]" />
                <span className="text-sm font-bold text-white" style={{ fontFamily: "monospace" }}>CHAT</span>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Channel tabs */}
            <div className="flex gap-1 px-3 py-2 border-b border-gray-800/50">
              {CHANNELS.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setChannel(ch.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider transition-all ${
                    channel === ch.id
                      ? "bg-[#C8D880]/10 text-[#C8D880] border border-[#C8D880]/30"
                      : "text-gray-500 hover:text-gray-300 border border-transparent"
                  }`}
                  style={{ fontFamily: "monospace" }}
                >
                  <span>{ch.icon}</span>
                  {ch.label.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {filtered.map(msg => (
                <div key={msg.id} className={`${msg.isSystem ? "text-center" : ""}`}>
                  {msg.isSystem ? (
                    <span className="text-[9px] text-amber-400/60 bg-amber-400/5 px-2 py-0.5 rounded" style={{ fontFamily: "monospace" }}>
                      ⚡ {msg.text}
                    </span>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold ${msg.author === "Você" ? "text-[#C8D880]" : "text-gray-300"}`}
                          style={{ fontFamily: "monospace" }}
                        >
                          {msg.author}
                        </span>
                        <span className="text-[8px] text-gray-600" style={{ fontFamily: "monospace" }}>{msg.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{msg.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="px-3 py-2 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Mensagem..."
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#C8D880]/50"
                  style={{ fontFamily: "monospace" }}
                />
                <button onClick={handleSend} className="p-2 rounded-lg bg-[#C8D880] text-black hover:bg-[#D8E890] transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
