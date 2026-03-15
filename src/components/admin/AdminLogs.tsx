import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, RefreshCw } from "lucide-react";

export function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    const [{ data: activity }, { data: sysLogs }] = await Promise.all([
      supabase.from("agent_activity_log").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("system_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    const combined = [
      ...(activity || []).map(a => ({ id: a.id, type: "agent", category: a.action_type, message: `[${a.agent_name}] ${a.description}`, time: a.created_at })),
      ...(sysLogs || []).map(s => ({ id: s.id, type: s.log_type, category: s.category, message: s.message, time: s.created_at })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setLogs(combined);
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, []);

  const filtered = logs.filter(l => {
    if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== "all" && l.category !== category) return false;
    return true;
  });

  const categories = ["all", ...new Set(logs.map(l => l.category))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-primary tracking-wider">SYSTEM LOGS</h1>
        <button onClick={loadLogs} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nos logs..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 bg-primary/[0.03] text-sm font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/30" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-3 py-2 rounded-xl border border-primary/10 bg-primary/[0.03] text-xs font-mono text-foreground focus:outline-none">
          {categories.map(c => <option key={c} value={c}>{c === "all" ? "Todas" : c}</option>)}
        </select>
      </div>
      <div className="space-y-1 max-h-[600px] overflow-y-auto">
        {filtered.map(l => (
          <div key={l.id} className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-primary/[0.03] transition-colors">
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
              l.type === "error" ? "bg-destructive/10 text-destructive" :
              l.type === "agent" ? "bg-violet-400/10 text-violet-400" :
              l.type === "warning" ? "bg-amber-400/10 text-amber-400" :
              "bg-primary/10 text-primary"
            }`}>{l.type}</span>
            <p className="text-[11px] font-mono text-muted-foreground flex-1 break-all">{l.message}</p>
            <span className="text-[9px] font-mono text-muted-foreground/50 shrink-0">
              {new Date(l.time).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhum log encontrado</p>}
      </div>
    </div>
  );
}
