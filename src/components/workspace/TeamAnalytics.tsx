import { useState } from "react";
import { motion } from "framer-motion";
import { X, BarChart3, Users, Video, MessageCircle, TrendingUp, Activity } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const METRICS = [
  { label: "Reuniões esta semana", value: "12", change: "+3", icon: <Video className="w-3.5 h-3.5" />, color: "#ef4444" },
  { label: "Mensagens trocadas", value: "847", change: "+12%", icon: <MessageCircle className="w-3.5 h-3.5" />, color: "#6b8fc4" },
  { label: "Colaborações ativas", value: "8", change: "+2", icon: <Users className="w-3.5 h-3.5" />, color: "#34d399" },
  { label: "Horas de foco", value: "34h", change: "+5h", icon: <Activity className="w-3.5 h-3.5" />, color: "#fbbf24" },
];

const TEAM_ACTIVITY = [
  { name: "Ana Silva", meetings: 5, messages: 120, collabs: 3, score: 92 },
  { name: "Carlos Dev", meetings: 3, messages: 89, collabs: 5, score: 88 },
  { name: "Marina", meetings: 4, messages: 67, collabs: 2, score: 76 },
  { name: "João", meetings: 2, messages: 145, collabs: 4, score: 85 },
  { name: "Bot Atlas", meetings: 0, messages: 234, collabs: 8, score: 95 },
];

const COLLAB_PATTERNS = [
  { pair: "Ana ↔ Carlos", frequency: "Alta", type: "Code Review" },
  { pair: "Marina ↔ João", frequency: "Média", type: "Design Sprint" },
  { pair: "Atlas ↔ Ana", frequency: "Alta", type: "Data Analysis" },
];

export function TeamAnalytics({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<"overview" | "members" | "patterns">("overview");
  const mainColor = "#6b8fc4";

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[650px] md:h-[480px] z-50 rounded-2xl border overflow-hidden flex flex-col"
      style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.97)", backdropFilter: "blur(16px)" }}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" style={{ color: mainColor }} />
          <span className="text-xs font-mono font-bold tracking-wider text-white">TEAM ANALYTICS</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5"><X className="w-4 h-4 text-gray-500" /></button>
      </div>

      <div className="flex border-b" style={{ borderColor: `${mainColor}10` }}>
        {(["overview", "members", "patterns"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-[10px] font-mono tracking-wider uppercase transition-colors"
            style={{ color: tab === t ? mainColor : "#6b7280", borderBottom: tab === t ? `2px solid ${mainColor}` : "2px solid transparent" }}
          >
            {t === "overview" ? "📊 Visão Geral" : t === "members" ? "👥 Membros" : "🔗 Padrões"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {METRICS.map((m, i) => (
                <div key={i} className="p-3 rounded-xl border" style={{ borderColor: `${mainColor}10` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${m.color}15`, color: m.color }}>{m.icon}</div>
                    <span className="text-[8px] font-mono text-emerald-400">↑ {m.change}</span>
                  </div>
                  <p className="text-lg font-mono font-bold text-white">{m.value}</p>
                  <p className="text-[9px] font-mono" style={{ color: `${mainColor}50` }}>{m.label}</p>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-xl border" style={{ borderColor: `${mainColor}10` }}>
              <p className="text-[9px] font-mono font-bold mb-3" style={{ color: `${mainColor}50` }}>ATIVIDADE SEMANAL</p>
              <div className="flex items-end gap-1 h-20">
                {[30, 55, 40, 70, 85, 65, 45].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: i === 4 ? mainColor : `${mainColor}30` }} />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(d => (
                  <span key={d} className="text-[7px] font-mono text-gray-600 flex-1 text-center">{d}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "members" && (
          <div className="space-y-2">
            {TEAM_ACTIVITY.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: `${mainColor}10` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: `${mainColor}15` }}>
                  {m.name.includes("Bot") ? "🤖" : "👤"}
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-mono font-bold text-white">{m.name}</p>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-[8px] font-mono text-gray-500">{m.meetings} reuniões</span>
                    <span className="text-[8px] font-mono text-gray-500">{m.messages} msgs</span>
                    <span className="text-[8px] font-mono text-gray-500">{m.collabs} collabs</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold" style={{ color: mainColor }}>{m.score}</p>
                  <p className="text-[7px] font-mono text-gray-600">SCORE</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "patterns" && (
          <div className="space-y-3">
            <p className="text-[9px] font-mono" style={{ color: `${mainColor}50` }}>Padrões de colaboração detectados automaticamente</p>
            {COLLAB_PATTERNS.map((p, i) => (
              <div key={i} className="p-3 rounded-xl border" style={{ borderColor: `${mainColor}10` }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">{p.pair}</span>
                  <span className={`text-[8px] font-mono px-2 py-0.5 rounded ${p.frequency === "Alta" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>{p.frequency}</span>
                </div>
                <p className="text-[9px] font-mono mt-1" style={{ color: `${mainColor}50` }}>Tipo: {p.type}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
