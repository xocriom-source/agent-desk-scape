import { useState } from "react";
import { motion } from "framer-motion";
import { X, Calendar, Users, Mic, Monitor, Plus, ExternalLink, Star } from "lucide-react";

interface VirtualEvent {
  id: string;
  title: string;
  type: "conference" | "demo" | "workshop" | "social";
  date: string;
  time: string;
  attendees: number;
  maxAttendees: number;
  host: string;
  status: "upcoming" | "live" | "ended";
  description: string;
}

const EVENTS: VirtualEvent[] = [
  { id: "e1", title: "AI Agent Summit 2026", type: "conference", date: "18 Mar", time: "14:00", attendees: 45, maxAttendees: 100, host: "Admin", status: "upcoming", description: "Conferência sobre agentes autônomos e IA generativa" },
  { id: "e2", title: "Demo Day - Sprint 12", type: "demo", date: "Hoje", time: "16:00", attendees: 12, maxAttendees: 30, host: "Ana Silva", status: "live", description: "Apresentação das entregas do sprint 12" },
  { id: "e3", title: "Workshop: Prompt Engineering", type: "workshop", date: "20 Mar", time: "10:00", attendees: 8, maxAttendees: 20, host: "Bot Atlas", status: "upcoming", description: "Aprenda a criar prompts eficazes para seus agentes" },
  { id: "e4", title: "Happy Hour Virtual", type: "social", date: "21 Mar", time: "18:00", attendees: 20, maxAttendees: 50, host: "Time Alpha", status: "upcoming", description: "Socialização e jogos com o time" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function VirtualEvents({ isOpen, onClose }: Props) {
  const mainColor = "#6b8fc4";
  const typeColors: Record<string, string> = { conference: "#6b8fc4", demo: "#ef4444", workshop: "#fbbf24", social: "#34d399" };
  const typeIcons: Record<string, string> = { conference: "🎤", demo: "🖥️", workshop: "📝", social: "🎉" };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:h-[480px] z-50 rounded-2xl border overflow-hidden flex flex-col"
      style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.97)", backdropFilter: "blur(16px)" }}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: mainColor }} />
          <span className="text-xs font-mono font-bold tracking-wider text-white">EVENTOS VIRTUAIS</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg" style={{ backgroundColor: `${mainColor}15`, color: mainColor }}><Plus className="w-3.5 h-3.5" /></button>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {EVENTS.map(ev => (
          <div key={ev.id} className="p-4 rounded-xl border" style={{ borderColor: `${typeColors[ev.type]}20`, backgroundColor: ev.status === "live" ? `${typeColors[ev.type]}05` : "transparent" }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{typeIcons[ev.type]}</span>
                <div>
                  <p className="text-xs font-mono font-bold text-white">{ev.title}</p>
                  <p className="text-[9px] font-mono" style={{ color: `${mainColor}50` }}>{ev.date} às {ev.time} · Host: {ev.host}</p>
                </div>
              </div>
              {ev.status === "live" && <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 animate-pulse">● LIVE</span>}
            </div>
            <p className="text-[10px] font-mono text-gray-400 mb-3">{ev.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-gray-500" />
                <span className="text-[9px] font-mono text-gray-400">{ev.attendees}/{ev.maxAttendees}</span>
                <div className="w-16 h-1 rounded-full bg-white/5 ml-1">
                  <div className="h-full rounded-full" style={{ width: `${(ev.attendees / ev.maxAttendees) * 100}%`, backgroundColor: typeColors[ev.type] }} />
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold tracking-wider" style={{ backgroundColor: `${typeColors[ev.type]}20`, color: typeColors[ev.type] }}>
                {ev.status === "live" ? "ENTRAR" : "INSCREVER-SE"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
