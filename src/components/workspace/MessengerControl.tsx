import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Plus, Trash2, Power, PowerOff, Send } from "lucide-react";

interface Messenger {
  id: string;
  platform: string;
  bot_token_configured: boolean;
  status: string;
  agent_id: string | null;
}

const PLATFORMS = [
  { id: "telegram", name: "Telegram", emoji: "📱", color: "text-blue-400" },
  { id: "whatsapp", name: "WhatsApp", emoji: "💬", color: "text-emerald-400" },
  { id: "messenger", name: "Messenger", emoji: "💭", color: "text-indigo-400" },
  { id: "discord", name: "Discord", emoji: "🎮", color: "text-violet-400" },
];

interface Props {
  messengers: Messenger[];
  agentNames: Record<string, string>;
  onAdd: (platform: string) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string, status: string) => void;
}

export function MessengerControl({ messengers, agentNames, onAdd, onRemove, onToggle }: Props) {
  const connectedPlatforms = messengers.map(m => m.platform);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        Controle de Mensageiros
      </h3>

      <div className="grid grid-cols-2 gap-2">
        {PLATFORMS.map(platform => {
          const connection = messengers.find(m => m.platform === platform.id);
          const isConnected = !!connection;
          const isActive = connection?.status === "connected";

          return (
            <motion.div
              key={platform.id}
              layout
              className={`p-3 rounded-xl border transition-colors ${
                isActive ? "border-emerald-500/30 bg-emerald-500/5" : isConnected ? "border-gray-600 bg-gray-800/50" : "border-gray-700 bg-gray-800/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{platform.emoji}</span>
                <span className={`text-xs font-medium ${platform.color}`}>{platform.name}</span>
              </div>

              {isConnected ? (
                <div className="space-y-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-emerald-400/10 text-emerald-400" : "bg-gray-700 text-gray-400"}`}>
                    {isActive ? "Conectado" : "Desconectado"}
                  </span>
                  {connection.agent_id && agentNames[connection.agent_id] && (
                    <p className="text-[10px] text-gray-400">→ {agentNames[connection.agent_id]}</p>
                  )}
                  <div className="flex gap-1">
                    <button
                      onClick={() => onToggle(connection.id, isActive ? "disconnected" : "connected")}
                      className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                      {isActive ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => onRemove(connection.id)}
                      className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onAdd(platform.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-700/50 text-gray-300 text-[10px] hover:bg-gray-700 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Conectar
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
        <p className="text-[10px] text-gray-500">
          💡 Conecte plataformas de mensagem para enviar comandos aos seus agentes via chat. Configure o bot token nas configurações de cada plataforma.
        </p>
      </div>
    </div>
  );
}
