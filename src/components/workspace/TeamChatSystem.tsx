import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Hash, Lock, MessageCircle, Users, Plus, Search, Paperclip, AtSign, Reply, ChevronDown } from "lucide-react";

type ChannelType = "public" | "private" | "dm" | "group";

interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  unread: number;
  icon: string;
  members?: number;
}

interface ChatMsg {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
  channelId: string;
  threadId?: number;
  reactions?: { emoji: string; count: number }[];
  file?: { name: string; size: string };
}

const CHANNELS: Channel[] = [
  { id: "general", name: "geral", type: "public", unread: 3, icon: "#", members: 24 },
  { id: "dev", name: "desenvolvimento", type: "public", unread: 0, icon: "#", members: 8 },
  { id: "design", name: "design", type: "public", unread: 1, icon: "#", members: 5 },
  { id: "private-ops", name: "operações", type: "private", unread: 0, icon: "🔒", members: 4 },
  { id: "dm-ana", name: "Ana Silva", type: "dm", unread: 2, icon: "👩‍💼" },
  { id: "dm-carlos", name: "Carlos Dev", type: "dm", unread: 0, icon: "👨‍💻" },
  { id: "grp-leads", name: "Tech Leads", type: "group", unread: 0, icon: "👥", members: 3 },
];

const MOCK_MSGS: ChatMsg[] = [
  { id: 1, author: "Ana Silva", avatar: "👩‍💼", text: "Bom dia! Alguém revisou o PR #234?", time: "09:15", channelId: "general", reactions: [{ emoji: "👋", count: 3 }] },
  { id: 2, author: "Carlos Dev", avatar: "👨‍💻", text: "Sim! Aprovei agora. Pode fazer merge.", time: "09:18", channelId: "general" },
  { id: 3, author: "Bot Atlas", avatar: "🤖", text: "Deploy concluído com sucesso no staging ✅", time: "09:20", channelId: "general", reactions: [{ emoji: "🎉", count: 5 }] },
  { id: 4, author: "Marina", avatar: "👩‍🎨", text: "Compartilhei os mockups na thread", time: "09:22", channelId: "design", file: { name: "mockups-v3.fig", size: "2.4MB" } },
  { id: 5, author: "Ana Silva", avatar: "👩‍💼", text: "Podemos conversar sobre o roadmap?", time: "10:00", channelId: "dm-ana" },
  { id: 6, author: "Ana Silva", avatar: "👩‍💼", text: "Preciso alinhar as prioridades do Q2", time: "10:01", channelId: "dm-ana" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function TeamChatSystem({ isOpen, onClose }: Props) {
  const [activeChannel, setActiveChannel] = useState("general");
  const [messages, setMessages] = useState<ChatMsg[]>(MOCK_MSGS);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(100);

  const channel = CHANNELS.find(c => c.id === activeChannel)!;
  const filtered = messages.filter(m => m.channelId === activeChannel);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [filtered.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    const now = new Date();
    setMessages(prev => [...prev, {
      id: counterRef.current++,
      author: "Você",
      avatar: "👤",
      text: input.trim(),
      time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
      channelId: activeChannel,
    }]);
    setInput("");
  };

  const mainColor = "#6b8fc4";

  if (!isOpen) return null;

  const publicChannels = CHANNELS.filter(c => c.type === "public");
  const privateChannels = CHANNELS.filter(c => c.type === "private");
  const dmChannels = CHANNELS.filter(c => c.type === "dm" || c.type === "group");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-3 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[800px] md:h-[550px] z-50 rounded-2xl border overflow-hidden flex"
      style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.97)", backdropFilter: "blur(16px)" }}
    >
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-56 border-r flex flex-col" style={{ borderColor: `${mainColor}10` }}>
          <div className="px-3 py-3 border-b" style={{ borderColor: `${mainColor}10` }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-[10px] font-mono bg-white/5 border text-white placeholder-gray-600 focus:outline-none"
                style={{ borderColor: `${mainColor}15` }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            <ChannelGroup label="CANAIS" channels={publicChannels} activeId={activeChannel} onSelect={setActiveChannel} color={mainColor} />
            <ChannelGroup label="PRIVADOS" channels={privateChannels} activeId={activeChannel} onSelect={setActiveChannel} color={mainColor} />
            <ChannelGroup label="MENSAGENS" channels={dmChannels} activeId={activeChannel} onSelect={setActiveChannel} color={mainColor} />
          </div>

          <div className="p-2 border-t" style={{ borderColor: `${mainColor}10` }}>
            <button className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-mono tracking-wider" style={{ backgroundColor: `${mainColor}10`, color: mainColor }}>
              <Plus className="w-3 h-3" /> NOVO CANAL
            </button>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden p-1 rounded hover:bg-white/5">
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-sm font-mono text-gray-400">{channel.icon}</span>
            <span className="text-xs font-mono font-bold text-white">{channel.name}</span>
            {channel.members && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${mainColor}10`, color: `${mainColor}70` }}>{channel.members} membros</span>}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {filtered.map(msg => (
            <div key={msg.id} className="group flex gap-3">
              <span className="text-xl mt-0.5">{msg.avatar}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono font-bold ${msg.author === "Você" ? "text-blue-400" : "text-white"}`}>{msg.author}</span>
                  <span className="text-[8px] font-mono text-gray-600">{msg.time}</span>
                  <button className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/5 transition-opacity">
                    <Reply className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">{msg.text}</p>
                {msg.file && (
                  <div className="mt-1.5 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 w-fit">
                    <Paperclip className="w-3 h-3 text-gray-500" />
                    <span className="text-[10px] font-mono" style={{ color: mainColor }}>{msg.file.name}</span>
                    <span className="text-[8px] font-mono text-gray-600">{msg.file.size}</span>
                  </div>
                )}
                {msg.reactions && (
                  <div className="flex gap-1 mt-1">
                    {msg.reactions.map((r, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 cursor-pointer hover:bg-white/10">{r.emoji} {r.count}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t" style={{ borderColor: `${mainColor}10` }}>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-white/5"><Paperclip className="w-4 h-4 text-gray-500" /></button>
            <button className="p-2 rounded-lg hover:bg-white/5"><AtSign className="w-4 h-4 text-gray-500" /></button>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder={`Mensagem em #${channel.name}...`}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-mono bg-white/5 border text-white placeholder-gray-600 focus:outline-none"
              style={{ borderColor: `${mainColor}20` }}
            />
            <button onClick={handleSend} className="p-2 rounded-lg" style={{ backgroundColor: `${mainColor}20` }}>
              <Send className="w-4 h-4" style={{ color: mainColor }} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ChannelGroup({ label, channels, activeId, onSelect, color }: {
  label: string; channels: Channel[]; activeId: string; onSelect: (id: string) => void; color: string;
}) {
  return (
    <div className="mb-3">
      <p className="px-3 text-[8px] font-mono font-bold tracking-wider mb-1" style={{ color: `${color}40` }}>{label}</p>
      {channels.map(ch => (
        <button key={ch.id} onClick={() => onSelect(ch.id)}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${activeId === ch.id ? "bg-white/5" : "hover:bg-white/5"}`}
        >
          <span className="text-[10px] text-gray-500">{ch.icon}</span>
          <span className="flex-1 text-[11px] font-mono text-gray-300 truncate">{ch.name}</span>
          {ch.unread > 0 && (
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: color, color: "#0a0e1a" }}>{ch.unread}</span>
          )}
        </button>
      ))}
    </div>
  );
}
