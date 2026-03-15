import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, Video, Building2, Globe, RefreshCw, MapPin, Clock } from "lucide-react";

interface AdminCityProps {
  counts: Record<string, number> | null;
}

export function AdminCity({ counts }: AdminCityProps) {
  const [presence, setPresence] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: m }, { data: e }, { data: prof }] = await Promise.all([
      supabase.from("user_presence").select("*").gte("last_seen", new Date(Date.now() - 15 * 60000).toISOString()),
      supabase.from("meetings").select("*").eq("status", "live"),
      supabase.from("city_events").select("*").order("created_at", { ascending: false }).limit(15),
      supabase.rpc("admin_list_profiles"),
    ]);
    if (p) setPresence(p);
    if (m) setMeetings(m);
    if (e) setEvents(e);
    if (prof) setProfiles(prof as any[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getUserName = (userId: string) => profiles.find(p => p.id === userId)?.display_name || userId.slice(0, 8);
  const activeBuildings = [...new Set(presence.map(p => p.building_id).filter(Boolean))];

  const statCards = [
    { label: "Usuários Online", value: presence.length, icon: Users, color: "from-emerald-500/20 to-emerald-600/5", accent: "text-emerald-400" },
    { label: "Reuniões Ativas", value: meetings.length, icon: Video, color: "from-red-500/20 to-red-600/5", accent: "text-red-400" },
    { label: "Prédios Ativos", value: activeBuildings.length, icon: Building2, color: "from-blue-500/20 to-blue-600/5", accent: "text-blue-400" },
    { label: "Total Eventos", value: counts?.events || 0, icon: Globe, color: "from-amber-500/20 to-amber-600/5", accent: "text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-primary tracking-wider">ATIVIDADE DA CIDADE</h1>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Monitoramento em tempo real do ambiente virtual</p>
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className={`rounded-xl border border-primary/10 bg-gradient-to-br ${s.color} p-5`}>
            <s.icon className={`w-5 h-5 ${s.accent} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Meetings */}
        <div className="rounded-xl border border-primary/10 bg-primary/[0.02] p-5">
          <h2 className="text-sm font-mono font-bold text-foreground flex items-center gap-2 mb-4">
            <Video className="w-3.5 h-3.5 text-red-400" />
            REUNIÕES ATIVAS
            {meetings.length > 0 && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
          </h2>
          {meetings.length > 0 ? meetings.map(m => (
            <div key={m.id} className="p-3 rounded-lg border border-red-400/10 bg-red-400/5 mb-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono font-bold text-foreground">{m.title}</p>
                <span className="text-[9px] font-mono text-red-400 animate-pulse">● LIVE</span>
              </div>
              <p className="text-[9px] font-mono text-muted-foreground mt-1 flex items-center gap-1.5">
                <MapPin className="w-2.5 h-2.5" /> {m.room} · <Clock className="w-2.5 h-2.5" /> {m.duration_minutes}min
              </p>
            </div>
          )) : <p className="text-[10px] text-muted-foreground text-center py-6">Nenhuma reunião ativa</p>}
        </div>

        {/* Online Users */}
        <div className="rounded-xl border border-primary/10 bg-primary/[0.02] p-5">
          <h2 className="text-sm font-mono font-bold text-foreground flex items-center gap-2 mb-4">
            <Users className="w-3.5 h-3.5 text-emerald-400" /> USUÁRIOS ONLINE ({presence.length})
          </h2>
          <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
            {presence.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/[0.04] transition-colors">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono font-bold text-foreground truncate">{getUserName(p.user_id)}</p>
                  <p className="text-[9px] font-mono text-muted-foreground">{p.building_id || "lobby"} · {p.status}</p>
                </div>
              </div>
            ))}
            {presence.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-6">Nenhum usuário online</p>}
          </div>
        </div>
      </div>

      {/* Active Buildings */}
      {activeBuildings.length > 0 && (
        <div className="rounded-xl border border-primary/10 bg-primary/[0.02] p-5">
          <h2 className="text-sm font-mono font-bold text-foreground flex items-center gap-2 mb-4">
            <Building2 className="w-3.5 h-3.5 text-blue-400" /> PRÉDIOS COM ATIVIDADE
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {activeBuildings.map(b => {
              const usersInBuilding = presence.filter(p => p.building_id === b).length;
              return (
                <div key={b} className="rounded-lg border border-primary/10 bg-primary/[0.03] p-3 text-center">
                  <Building2 className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <p className="text-[10px] font-mono font-bold text-foreground">{b}</p>
                  <p className="text-[9px] font-mono text-muted-foreground">{usersInBuilding} usuário{usersInBuilding !== 1 ? "s" : ""}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="rounded-xl border border-primary/10 bg-primary/[0.02] p-5">
        <h2 className="text-sm font-mono font-bold text-foreground flex items-center gap-2 mb-4">
          <Globe className="w-3.5 h-3.5 text-amber-400" /> EVENTOS RECENTES
        </h2>
        <div className="space-y-2">
          {events.map(e => (
            <div key={e.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/[0.04] transition-colors">
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                e.importance >= 3 ? "bg-red-400/10 text-red-400" : e.importance === 2 ? "bg-amber-400/10 text-amber-400" : "bg-primary/10 text-primary"
              }`}>{e.event_type}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono font-bold text-foreground">{e.title}</p>
                {e.description && <p className="text-[9px] font-mono text-muted-foreground mt-0.5 truncate">{e.description}</p>}
              </div>
              <span className="text-[9px] font-mono text-muted-foreground/50 shrink-0">
                {new Date(e.created_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          ))}
          {events.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-6">Nenhum evento</p>}
        </div>
      </div>
    </div>
  );
}
