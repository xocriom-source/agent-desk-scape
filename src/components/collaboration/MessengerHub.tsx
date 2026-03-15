import { useState } from "react";
import { motion } from "framer-motion";
import { X, MessageCircle, ExternalLink, Check, AlertCircle } from "lucide-react";

interface MessengerChannel {
  id: string;
  platform: "telegram" | "whatsapp" | "messenger" | "line";
  name: string;
  icon: string;
  connected: boolean;
  messages: number;
  lastActive: string;
}

const CHANNELS: MessengerChannel[] = [
  { id: "ch1", platform: "telegram", name: "Telegram", icon: "✈️", connected: true, messages: 234, lastActive: "2m ago" },
  { id: "ch2", platform: "whatsapp", name: "WhatsApp", icon: "📱", connected: true, messages: 156, lastActive: "5m ago" },
  { id: "ch3", platform: "messenger", name: "Messenger", icon: "💬", connected: false, messages: 0, lastActive: "—" },
  { id: "ch4", platform: "line", name: "Line", icon: "🟢", connected: false, messages: 0, lastActive: "—" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MessengerHub({ isOpen, onClose }: Props) {
  const [channels, setChannels] = useState(CHANNELS);

  const mainColor = "#6b8fc4";

  const toggle = (id: string) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, connected: !c.connected } : c));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        className="w-[400px] rounded-xl border overflow-hidden"
        style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.98)" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" style={{ color: mainColor }} />
            <span className="text-xs font-mono font-bold tracking-wider text-white">MESSENGER HUB</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        <div className="p-3 border-b" style={{ borderColor: `${mainColor}10` }}>
          <p className="text-[10px] font-mono" style={{ color: `${mainColor}60` }}>
            Connect your AI agent to messaging platforms. Users can interact with your agent outside the platform.
          </p>
        </div>

        <div className="p-3 space-y-2">
          {channels.map(ch => (
            <div key={ch.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: `${mainColor}12`, background: `${mainColor}05` }}>
              <span className="text-2xl">{ch.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-mono font-bold text-white">{ch.name}</h4>
                  {ch.connected && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: "#34d39915", color: "#34d399" }}>
                      CONNECTED
                    </span>
                  )}
                </div>
                {ch.connected ? (
                  <p className="text-[9px] font-mono" style={{ color: `${mainColor}50` }}>
                    {ch.messages} messages · {ch.lastActive}
                  </p>
                ) : (
                  <p className="text-[9px] font-mono text-gray-600">Not connected</p>
                )}
              </div>
              <button
                onClick={() => toggle(ch.id)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-colors"
                style={{
                  backgroundColor: ch.connected ? "rgba(239,68,68,0.1)" : `${mainColor}15`,
                  color: ch.connected ? "#ef4444" : mainColor,
                }}
              >
                {ch.connected ? "DISCONNECT" : "CONNECT"}
              </button>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t" style={{ borderColor: `${mainColor}10` }}>
          <p className="text-[9px] font-mono" style={{ color: `${mainColor}40` }}>
            💡 Connected platforms allow your AI agent to respond to messages 24/7, even when you're offline.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
