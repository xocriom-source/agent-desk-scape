import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, MessageCircle, Users, X, Send, Handshake } from "lucide-react";

interface NearbyUser {
  id: string;
  name: string;
  avatar: string;
  distance: number;
  status: "available" | "focused" | "in-meeting" | "away";
}

const MOCK_NEARBY: NearbyUser[] = [
  { id: "u1", name: "Ana Silva", avatar: "👩‍💼", distance: 2.3, status: "available" },
  { id: "u2", name: "Carlos Dev", avatar: "👨‍💻", distance: 4.1, status: "focused" },
  { id: "u3", name: "Marina AI", avatar: "🤖", distance: 1.8, status: "available" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  playerPos?: [number, number, number];
}

export function ProximityChat({ isOpen, onClose, playerPos }: Props) {
  const [micOn, setMicOn] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ from: string; text: string; time: string }[]>([
    { from: "Ana Silva", text: "Oi! Vi que você está perto, quer colaborar?", time: "agora" },
    { from: "Carlos Dev", text: "Estou finalizando o deploy, em 5 min tô livre", time: "1m" },
  ]);
  const [activeTab, setActiveTab] = useState<"chat" | "voice">("chat");

  const nearby = useMemo(() =>
    MOCK_NEARBY.filter(u => u.distance <= 5).sort((a, b) => a.distance - b.distance),
  []);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { from: "Você", text: chatInput, time: "agora" }]);
    setChatInput("");
  };

  if (!isOpen) return null;

  const mainColor = "#6b8fc4";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed left-4 top-20 z-50 w-80 rounded-xl border overflow-hidden"
      style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.95)", backdropFilter: "blur(12px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: mainColor }} />
          <span className="text-xs font-mono font-bold tracking-wider text-white">PROXIMITY</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${mainColor}15`, color: mainColor }}>
            {nearby.length} nearby
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Nearby users */}
      <div className="px-3 py-2 border-b" style={{ borderColor: `${mainColor}10` }}>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {nearby.map(u => (
            <div key={u.id} className="flex flex-col items-center gap-1 min-w-[50px]">
              <div className="relative">
                <span className="text-xl">{u.avatar}</span>
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-gray-900"
                  style={{
                    backgroundColor: u.status === "available" ? "#34d399" : u.status === "focused" ? "#fbbf24" : u.status === "in-meeting" ? "#ef4444" : "#6b7280",
                  }}
                />
              </div>
              <span className="text-[8px] font-mono text-gray-400 truncate w-full text-center">{u.name.split(" ")[0]}</span>
              <span className="text-[7px] font-mono" style={{ color: `${mainColor}60` }}>{u.distance.toFixed(1)}m</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: `${mainColor}10` }}>
        {(["chat", "voice"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 text-[10px] font-mono tracking-wider uppercase transition-colors"
            style={{
              color: activeTab === tab ? mainColor : "#6b7280",
              borderBottom: activeTab === tab ? `2px solid ${mainColor}` : "2px solid transparent",
            }}
          >
            {tab === "chat" ? "💬 Chat" : "🎙️ Voice"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="h-52 overflow-y-auto p-3 space-y-2">
        {activeTab === "chat" ? (
          messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.from === "Você" ? "items-end" : "items-start"}`}>
              <span className="text-[8px] font-mono text-gray-500 mb-0.5">{msg.from} · {msg.time}</span>
              <div
                className="px-3 py-1.5 rounded-lg text-[11px] font-mono max-w-[85%]"
                style={{
                  backgroundColor: msg.from === "Você" ? `${mainColor}20` : "rgba(255,255,255,0.05)",
                  color: msg.from === "Você" ? mainColor : "#d1d5db",
                }}
              >
                {msg.text}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <button
              onClick={() => setMicOn(!micOn)}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: micOn ? `${mainColor}30` : "rgba(255,255,255,0.05)",
                border: `2px solid ${micOn ? mainColor : "#333"}`,
              }}
            >
              {micOn ? <Mic className="w-6 h-6" style={{ color: mainColor }} /> : <MicOff className="w-6 h-6 text-gray-500" />}
            </button>
            <span className="text-[10px] font-mono" style={{ color: `${mainColor}70` }}>
              {micOn ? "VOICE ACTIVE" : "TAP TO TALK"}
            </span>
            {micOn && (
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full"
                    style={{ backgroundColor: mainColor }}
                    animate={{ height: [4, 12 + Math.random() * 8, 4] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat input */}
      {activeTab === "chat" && (
        <div className="flex gap-2 p-3 border-t" style={{ borderColor: `${mainColor}10` }}>
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Message nearby..."
            className="flex-1 px-3 py-2 rounded-lg text-[11px] font-mono bg-white/5 border text-white placeholder-gray-600 focus:outline-none"
            style={{ borderColor: `${mainColor}20` }}
          />
          <button onClick={sendMessage} className="p-2 rounded-lg" style={{ backgroundColor: `${mainColor}20` }}>
            <Send className="w-3.5 h-3.5" style={{ color: mainColor }} />
          </button>
        </div>
      )}

      {/* Collab actions */}
      <div className="flex gap-2 px-3 pb-3">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-mono tracking-wider" style={{ backgroundColor: `${mainColor}10`, color: mainColor }}>
          <Handshake className="w-3 h-3" /> COLLABORATE
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-mono tracking-wider bg-white/5 text-gray-400">
          <MessageCircle className="w-3 h-3" /> INVITE
        </button>
      </div>
    </motion.div>
  );
}
