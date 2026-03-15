import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Hash, Lock, MessageCircle, Users, Plus, Search, Paperclip, AtSign, Reply, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
  channelId: string;
  file?: { name: string; size: string };
  reactions?: { emoji: string; count: number }[];
}

const DEFAULT_CHANNELS: Channel[] = [
  { id: "default-general", name: "geral", type: "public", unread: 0, icon: "#", members: 0 },
  { id: "default-dev", name: "desenvolvimento", type: "public", unread: 0, icon: "#", members: 0 },
  { id: "default-design", name: "design", type: "public", unread: 0, icon: "#", members: 0 },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function TeamChatSystem({ isOpen, onClose }: Props) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS);
  const [activeChannel, setActiveChannel] = useState("default-general");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const channel = channels.find(c => c.id === activeChannel) || channels[0];

  // Load channels from DB
  useEffect(() => {
    if (!isOpen) return;
    const loadChannels = async () => {
      const { data } = await supabase.from("chat_channels").select("*").order("created_at");
      if (data && data.length > 0) {
        setChannels(data.map(ch => ({
          id: ch.id,
          name: ch.name,
          type: (ch.type || "public") as ChannelType,
          unread: 0,
          icon: ch.type === "private" ? "🔒" : "#",
        })));
        setActiveChannel(data[0].id);
      }
    };
    loadChannels();
  }, [isOpen]);

  // Load messages for active channel
  useEffect(() => {
    if (!isOpen || !activeChannel) return;
    const loadMessages = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("channel_id", activeChannel)
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          author: m.author_name,
          avatar: m.user_id === user?.id ? "👤" : "👥",
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          channelId: m.channel_id,
          file: m.file_name ? { name: m.file_name, size: m.file_size || "" } : undefined,
        })));
      }
      setLoading(false);
    };
    loadMessages();
  }, [isOpen, activeChannel, user?.id]);

  // Realtime subscription
  useEffect(() => {
    if (!isOpen || !activeChannel) return;
    const sub = supabase
      .channel(`chat-${activeChannel}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${activeChannel}` }, (payload) => {
        const m = payload.new as any;
        setMessages(prev => {
          if (prev.find(msg => msg.id === m.id)) return prev;
          return [...prev, {
            id: m.id,
            author: m.author_name,
            avatar: m.user_id === user?.id ? "👤" : "👥",
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            channelId: m.channel_id,
            file: m.file_name ? { name: m.file_name, size: m.file_size || "" } : undefined,
          }];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [isOpen, activeChannel, user?.id]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    const text = input.trim();
    setInput("");
    const { error } = await supabase.from("chat_messages").insert({
      channel_id: activeChannel,
      user_id: user.id,
      author_name: profile?.display_name || user.email || "Anônimo",
      content: text,
    });
    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateChannel = async () => {
    if (!user) return;
    const name = prompt("Nome do canal:");
    if (!name?.trim()) return;
    const { data, error } = await supabase.from("chat_channels").insert({ name: name.trim(), type: "public", created_by: user.id }).select().single();
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else if (data) {
      setChannels(prev => [...prev, { id: data.id, name: data.name, type: "public", unread: 0, icon: "#" }]);
      setActiveChannel(data.id);
    }
  };

  const mainColor = "#6b8fc4";

  if (!isOpen) return null;

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
            <p className="px-3 text-[8px] font-mono font-bold tracking-wider mb-1" style={{ color: `${mainColor}40` }}>CANAIS</p>
            {channels.filter(c => !search || c.name.includes(search)).map(ch => (
              <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${activeChannel === ch.id ? "bg-white/5" : "hover:bg-white/5"}`}
              >
                <span className="text-[10px] text-gray-500">{ch.icon}</span>
                <span className="flex-1 text-[11px] font-mono text-gray-300 truncate">{ch.name}</span>
                {ch.unread > 0 && (
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ backgroundColor: mainColor, color: "#0a0e1a" }}>{ch.unread}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-2 border-t" style={{ borderColor: `${mainColor}10` }}>
            <button onClick={handleCreateChannel} className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[9px] font-mono tracking-wider" style={{ backgroundColor: `${mainColor}10`, color: mainColor }}>
              <Plus className="w-3 h-3" /> NOVO CANAL
            </button>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden p-1 rounded hover:bg-white/5">
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-sm font-mono text-gray-400">{channel.icon}</span>
            <span className="text-xs font-mono font-bold text-white">{channel.name}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5"><X className="w-4 h-4 text-gray-500" /></button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading && <p className="text-[10px] font-mono text-gray-500 text-center">Carregando...</p>}
          {!loading && messages.length === 0 && <p className="text-[10px] font-mono text-gray-500 text-center mt-8">Nenhuma mensagem ainda. Comece a conversa!</p>}
          {messages.map(msg => (
            <div key={msg.id} className="group flex gap-3">
              <span className="text-xl mt-0.5">{msg.avatar}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono font-bold ${msg.author === (profile?.display_name || "Você") ? "text-blue-400" : "text-white"}`}>{msg.author}</span>
                  <span className="text-[8px] font-mono text-gray-600">{msg.time}</span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">{msg.text}</p>
                {msg.file && (
                  <div className="mt-1.5 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 w-fit">
                    <Paperclip className="w-3 h-3 text-gray-500" />
                    <span className="text-[10px] font-mono" style={{ color: mainColor }}>{msg.file.name}</span>
                    <span className="text-[8px] font-mono text-gray-600">{msg.file.size}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t" style={{ borderColor: `${mainColor}10` }}>
          {!user ? (
            <p className="text-[10px] font-mono text-gray-500 text-center">Faça login para enviar mensagens</p>
          ) : (
            <div className="flex items-center gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder={`Mensagem em #${channel.name}...`}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-mono bg-white/5 border text-white placeholder-gray-600 focus:outline-none"
                style={{ borderColor: `${mainColor}20` }}
              />
              <button onClick={handleSend} className="p-2 rounded-lg" style={{ backgroundColor: `${mainColor}20` }}>
                <Send className="w-4 h-4" style={{ color: mainColor }} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
