import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Video, Building2, Globe, RefreshCw } from "lucide-react";

interface AdminCityProps {
  counts: Record<string, number> | null;
}

export function AdminCity({ counts }: AdminCityProps) {
  const [presence, setPresence] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: m }, { data: e }] = await Promise.all([
      supabase.from("user_presence").select("*").gte("last_seen", new Date(Date.now() - 15 * 60000).toISOString()),
      supabase.from("meetings").select("*").eq("status", "live"),
      supabase.from("city_events").select("*").order("created_at", { ascending: false }).limit(10),
    ]);
    if (p) setPresence(p);
    if (m) setMeetings(m);
    if (e) setEvents(e);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-primary tracking-wider">ATIVIDADE DA CIDADE</h1>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Usuários Online", value: presence.length, icon: Users, color: "text-emerald-400" },
          { label: "Reuniões Ativas", value: meetings.length, icon: Video, color: "text-red-400" },
          { label: "Prédios Ativos", value: new Set(presence.map(p => p.building_id).filter(Boolean)).size, icon: Building2, color: "text-blue-400" },
          { label: "Eventos", value: counts?.events || 0, icon: Globe, color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-primary/10 bg-primary/[0.03] p-4">
            <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] font-mono text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {meetings.length > 0 && (
        <div>
          <h2 className="text-sm font-mono font-bold text-foreground mb-3">REUNIÕES ATIVAS</h2>
          <div className="space-y-2">
            {meetings.map(m => (
              <div key={m.id} className="p-3 rounded-xl border border-red-400/20 bg-red-400/5">
                <p className="text-sm font-mono font-bold text-foreground">{m.title}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{m.room} · {m.duration_minutes}min</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div>
          <h2 className="text-sm font-mono font-bold text-foreground mb-3">EVENTOS RECENTES</h2>
          <div className="space-y-2">
            {events.map(e => (
              <div key={e.id} className="p-3 rounded-xl border border-primary/10 bg-primary/[0.03]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono font-bold text-foreground">{e.title}</p>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">{e.event_type}</span>
                </div>
                {e.description && <p className="text-[9px] font-mono text-muted-foreground mt-1">{e.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {presence.length > 0 && (
        <div>
          <h2 className="text-sm font-mono font-bold text-foreground mb-3">USUÁRIOS ONLINE</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {presence.map(p => (
              <div key={p.id} className="p-3 rounded-xl border border-primary/10 bg-primary/[0.03]">
                <p className="text-xs font-mono text-foreground">{p.user_id.slice(0, 8)}...</p>
                <p className="text-[9px] font-mono text-muted-foreground">{p.status} · {p.building_id || "lobby"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
