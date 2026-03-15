import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Video, Calendar, FileText, Brain, Users, Plus, Clock, Mic, MicOff, Monitor, MessageSquare, ExternalLink } from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  room: string;
  time: string;
  duration: string;
  participants: { name: string; avatar: string }[];
  status: "scheduled" | "live" | "ended";
  hasTranscription: boolean;
  notes: string[];
}

const MOCK_MEETINGS: Meeting[] = [
  {
    id: "m1", title: "Sprint Planning", room: "Sala Alpha", time: "14:00", duration: "45min",
    participants: [{ name: "Ana", avatar: "👩‍💼" }, { name: "Carlos", avatar: "👨‍💻" }, { name: "Bot Atlas", avatar: "🤖" }],
    status: "live", hasTranscription: true, notes: ["Definir prioridades Q2", "Revisar backlog"],
  },
  {
    id: "m2", title: "Design Review", room: "Sala Beta", time: "16:00", duration: "30min",
    participants: [{ name: "Marina", avatar: "👩‍🎨" }, { name: "João", avatar: "👨‍🔬" }],
    status: "scheduled", hasTranscription: false, notes: [],
  },
  {
    id: "m3", title: "Retrospectiva", room: "Sala Gamma", time: "10:00", duration: "60min",
    participants: [{ name: "Time Alpha", avatar: "👥" }],
    status: "ended", hasTranscription: true, notes: ["Melhorar CI/CD", "Mais pair programming"],
  },
];

const ROOMS = ["Sala Alpha", "Sala Beta", "Sala Gamma", "Auditório", "Sala 1:1"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MeetingSystem({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<"rooms" | "schedule" | "active">("rooms");
  const [meetings] = useState<Meeting[]>(MOCK_MEETINGS);
  const [micOn, setMicOn] = useState(false);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newRoom, setNewRoom] = useState(ROOMS[0]);
  const [newTime, setNewTime] = useState("14:00");

  const mainColor = "#6b8fc4";

  const liveMeetings = meetings.filter(m => m.status === "live");
  const scheduled = meetings.filter(m => m.status === "scheduled");
  const ended = meetings.filter(m => m.status === "ended");

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[700px] md:h-[520px] z-50 rounded-2xl border overflow-hidden flex flex-col"
      style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.97)", backdropFilter: "blur(16px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4" style={{ color: mainColor }} />
          <span className="text-xs font-mono font-bold tracking-wider text-white">MEETING SYSTEM</span>
          {liveMeetings.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-red-500/20 text-red-400 animate-pulse">
              {liveMeetings.length} LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNewMeeting(!showNewMeeting)} className="p-1.5 rounded-lg" style={{ backgroundColor: `${mainColor}15`, color: mainColor }}>
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: `${mainColor}10` }}>
        {(["rooms", "schedule", "active"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-[10px] font-mono tracking-wider uppercase transition-colors"
            style={{ color: tab === t ? mainColor : "#6b7280", borderBottom: tab === t ? `2px solid ${mainColor}` : "2px solid transparent" }}
          >
            {t === "rooms" ? "🏢 Salas" : t === "schedule" ? "📅 Agenda" : "🔴 Ativas"}
          </button>
        ))}
      </div>

      {/* New Meeting Form */}
      <AnimatePresence>
        {showNewMeeting && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-b" style={{ borderColor: `${mainColor}10` }}>
            <div className="p-4 space-y-3">
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Título da reunião" className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-white/5 border text-white placeholder-gray-600 focus:outline-none" style={{ borderColor: `${mainColor}20` }} />
              <div className="flex gap-2">
                <select value={newRoom} onChange={e => setNewRoom(e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-xs font-mono bg-white/5 border text-white focus:outline-none" style={{ borderColor: `${mainColor}20` }}>
                  {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="px-3 py-2 rounded-lg text-xs font-mono bg-white/5 border text-white focus:outline-none" style={{ borderColor: `${mainColor}20` }} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowNewMeeting(false)} className="flex-1 py-2 rounded-lg text-[10px] font-mono font-bold tracking-wider" style={{ backgroundColor: `${mainColor}20`, color: mainColor }}>
                  AGENDAR
                </button>
                <button className="py-2 px-4 rounded-lg text-[10px] font-mono tracking-wider bg-red-500/20 text-red-400">
                  INICIAR AGORA
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tab === "rooms" && ROOMS.map(room => {
          const active = liveMeetings.find(m => m.room === room);
          return (
            <div key={room} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: `${mainColor}10`, backgroundColor: active ? `${mainColor}08` : "transparent" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${mainColor}10` }}>
                  {active ? "🔴" : "🏢"}
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-white">{room}</p>
                  <p className="text-[9px] font-mono" style={{ color: active ? "#ef4444" : `${mainColor}50` }}>
                    {active ? `Em uso: ${active.title}` : "Disponível"}
                  </p>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold tracking-wider" style={{ backgroundColor: `${mainColor}15`, color: mainColor }}>
                {active ? "ENTRAR" : "RESERVAR"}
              </button>
            </div>
          );
        })}

        {tab === "schedule" && [...scheduled, ...ended].map(m => (
          <div key={m.id} className="p-3 rounded-xl border" style={{ borderColor: `${mainColor}10` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" style={{ color: mainColor }} />
                <span className="text-xs font-mono font-bold text-white">{m.title}</span>
              </div>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${m.status === "ended" ? "bg-gray-700 text-gray-400" : "bg-blue-500/20 text-blue-400"}`}>
                {m.status === "ended" ? "ENCERRADA" : m.time}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono" style={{ color: `${mainColor}50` }}>
              <span>{m.room}</span>
              <span>·</span>
              <span>{m.duration}</span>
              <span>·</span>
              <span>{m.participants.length} participantes</span>
            </div>
            {m.hasTranscription && (
              <div className="flex gap-2 mt-2">
                <button className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono" style={{ backgroundColor: `${mainColor}10`, color: mainColor }}>
                  <Brain className="w-2.5 h-2.5" /> RESUMO AI
                </button>
                <button className="flex items-center gap-1 px-2 py-1 rounded text-[8px] font-mono" style={{ backgroundColor: `${mainColor}10`, color: mainColor }}>
                  <FileText className="w-2.5 h-2.5" /> TRANSCRIÇÃO
                </button>
              </div>
            )}
          </div>
        ))}

        {tab === "active" && (
          liveMeetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Video className="w-8 h-8 text-gray-600" />
              <p className="text-[10px] font-mono text-gray-500">Nenhuma reunião ativa</p>
            </div>
          ) : liveMeetings.map(m => (
            <div key={m.id} className="p-4 rounded-xl border" style={{ borderColor: "#ef444430", backgroundColor: "rgba(239,68,68,0.05)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-mono font-bold text-white">{m.title}</span>
                <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 animate-pulse">● LIVE</span>
              </div>
              <div className="flex gap-1.5 mb-3">
                {m.participants.map((p, i) => (
                  <span key={i} className="text-lg" title={p.name}>{p.avatar}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setMicOn(!micOn)} className="p-2 rounded-lg" style={{ backgroundColor: micOn ? `${mainColor}20` : "rgba(255,255,255,0.05)" }}>
                  {micOn ? <Mic className="w-4 h-4" style={{ color: mainColor }} /> : <MicOff className="w-4 h-4 text-gray-500" />}
                </button>
                <button className="p-2 rounded-lg bg-white/5"><Monitor className="w-4 h-4 text-gray-400" /></button>
                <button className="p-2 rounded-lg bg-white/5"><MessageSquare className="w-4 h-4 text-gray-400" /></button>
                <button className="p-2 rounded-lg bg-white/5"><FileText className="w-4 h-4 text-gray-400" /></button>
                <button className="ml-auto flex items-center gap-1 px-3 py-2 rounded-lg text-[9px] font-mono" style={{ backgroundColor: `${mainColor}15`, color: mainColor }}>
                  <ExternalLink className="w-3 h-3" /> LINK EXTERNO
                </button>
              </div>
              {m.notes.length > 0 && (
                <div className="mt-3 p-2 rounded-lg bg-white/5">
                  <p className="text-[8px] font-mono text-gray-500 mb-1">NOTAS COMPARTILHADAS</p>
                  {m.notes.map((n, i) => <p key={i} className="text-[10px] font-mono text-gray-300">• {n}</p>)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
