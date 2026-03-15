import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Video, Calendar, FileText, Brain, Users, Plus, Clock, Mic, MicOff, Monitor, MessageSquare, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Meeting {
  id: string;
  title: string;
  room: string;
  time: string;
  duration: string;
  participants: { name: string; avatar: string }[];
  status: "scheduled" | "live" | "ended";
  notes: string[];
  createdBy: string;
}

const ROOMS = ["Sala Alpha", "Sala Beta", "Sala Gamma", "Auditório", "Sala 1:1"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MeetingSystem({ isOpen, onClose }: Props) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"rooms" | "schedule" | "active">("rooms");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [micOn, setMicOn] = useState(false);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newRoom, setNewRoom] = useState(ROOMS[0]);
  const [newTime, setNewTime] = useState("14:00");
  const [loading, setLoading] = useState(false);

  const mainColor = "#6b8fc4";

  // Load meetings
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("meetings")
        .select("*")
        .order("scheduled_at", { ascending: true });
      if (data) {
        setMeetings(data.map(m => ({
          id: m.id,
          title: m.title,
          room: m.room,
          time: new Date(m.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          duration: `${m.duration_minutes}min`,
          participants: [],
          status: m.status as "scheduled" | "live" | "ended",
          notes: [],
          createdBy: m.created_by,
        })));
      }
      setLoading(false);
    };
    load();
  }, [isOpen]);

  const handleCreate = async () => {
    if (!newTitle.trim() || !user) return;
    const [h, m] = newTime.split(":").map(Number);
    const scheduledAt = new Date();
    scheduledAt.setHours(h, m, 0, 0);

    const { error } = await supabase.from("meetings").insert({
      title: newTitle.trim(),
      room: newRoom,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: 30,
      created_by: user.id,
      status: "scheduled",
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reunião agendada!" });
      setNewTitle("");
      setShowNewMeeting(false);
      // Reload
      const { data } = await supabase.from("meetings").select("*").order("scheduled_at");
      if (data) {
        setMeetings(data.map(m => ({
          id: m.id, title: m.title, room: m.room,
          time: new Date(m.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          duration: `${m.duration_minutes}min`, participants: [],
          status: m.status as "scheduled" | "live" | "ended", notes: [], createdBy: m.created_by,
        })));
      }
    }
  };

  const handleStartNow = async () => {
    if (!newTitle.trim() || !user) return;
    const { error } = await supabase.from("meetings").insert({
      title: newTitle.trim(),
      room: newRoom,
      scheduled_at: new Date().toISOString(),
      duration_minutes: 30,
      created_by: user.id,
      status: "live",
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reunião iniciada!" });
      setNewTitle("");
      setShowNewMeeting(false);
    }
  };

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
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-[10px] font-mono tracking-wider uppercase transition-colors"
            style={{ color: tab === t ? mainColor : "#6b7280", borderBottom: tab === t ? `2px solid ${mainColor}` : "2px solid transparent" }}
          >
            {t === "rooms" ? "🏢 Salas" : t === "schedule" ? "📅 Agenda" : "🔴 Ativas"}
          </button>
        ))}
      </div>

      {/* New meeting form */}
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
                <button onClick={handleCreate} className="flex-1 py-2 rounded-lg text-[10px] font-mono font-bold tracking-wider" style={{ backgroundColor: `${mainColor}20`, color: mainColor }}>AGENDAR</button>
                <button onClick={handleStartNow} className="py-2 px-4 rounded-lg text-[10px] font-mono tracking-wider bg-red-500/20 text-red-400">INICIAR AGORA</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <p className="text-[10px] font-mono text-gray-500 text-center">Carregando...</p>}

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

        {tab === "schedule" && (
          <>
            {[...scheduled, ...ended].length === 0 && !loading && (
              <p className="text-[10px] font-mono text-gray-500 text-center mt-8">Nenhuma reunião agendada</p>
            )}
            {[...scheduled, ...ended].map(m => (
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
                </div>
              </div>
            ))}
          </>
        )}

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
              <div className="flex gap-2">
                <button onClick={() => setMicOn(!micOn)} className="p-2 rounded-lg" style={{ backgroundColor: micOn ? `${mainColor}20` : "rgba(255,255,255,0.05)" }}>
                  {micOn ? <Mic className="w-4 h-4" style={{ color: mainColor }} /> : <MicOff className="w-4 h-4 text-gray-500" />}
                </button>
                <button className="p-2 rounded-lg bg-white/5"><Monitor className="w-4 h-4 text-gray-400" /></button>
                <button className="p-2 rounded-lg bg-white/5"><MessageSquare className="w-4 h-4 text-gray-400" /></button>
                <button className="p-2 rounded-lg bg-white/5"><FileText className="w-4 h-4 text-gray-400" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
