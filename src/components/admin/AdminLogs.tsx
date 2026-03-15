import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, RefreshCw, Download, AlertCircle, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  error: { icon: AlertCircle, color: "bg-destructive/10 text-destructive" },
  warning: { icon: AlertTriangle, color: "bg-amber-400/10 text-amber-400" },
  success: { icon: CheckCircle, color: "bg-emerald-400/10 text-emerald-400" },
  agent: { icon: Info, color: "bg-violet-400/10 text-violet-400" },
  info: { icon: Info, color: "bg-primary/10 text-primary" },
};

export function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    const [{ data: activity }, { data: sysLogs }] = await Promise.all([
      supabase.from("agent_activity_log").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("system_logs").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    const combined = [
      ...(activity || []).map(a => ({ id: a.id, type: "agent", category: a.action_type, message: `[${a.agent_name}] ${a.description}`, time: a.created_at, metadata: a.metadata })),
      ...(sysLogs || []).map(s => ({ id: s.id, type: s.log_type, category: s.category, message: s.message, time: s.created_at, metadata: s.metadata })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setLogs(combined);
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, []);

  const filtered = logs.filter(l => {
    if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== "all" && l.category !== category) return false;
    if (typeFilter !== "all" && l.type !== typeFilter) return false;
    return true;
  });

  const categories = ["all", ...new Set(logs.map(l => l.category))];
  const types = ["all", ...new Set(logs.map(l => l.type))];

  const exportLogs = () => {
    const data = filtered.map(l => `${l.time}\t${l.type}\t${l.category}\t${l.message}`).join("\n");
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "logs.txt"; a.click();
    toast.success("Logs exportados");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-primary tracking-wider">SYSTEM LOGS</h1>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{logs.length} registros · {filtered.length} exibidos</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportLogs} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Download className="w-3 h-3" /> EXPORT
          </button>
          <button onClick={loadLogs} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nos logs..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 bg-primary/[0.03] text-sm font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/30" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-primary/10 bg-primary/[0.03] text-xs font-mono text-foreground focus:outline-none">
          {types.map(t => <option key={t} value={t}>{t === "all" ? "Tipo: Todos" : t}</option>)}
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-3 py-2 rounded-xl border border-primary/10 bg-primary/[0.03] text-xs font-mono text-foreground focus:outline-none">
          {categories.map(c => <option key={c} value={c}>{c === "all" ? "Cat: Todas" : c}</option>)}
        </select>
      </div>

      {/* Stats bar */}
      <div className="flex gap-3">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const count = logs.filter(l => l.type === type).length;
          if (!count) return null;
          return (
            <button key={type} onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono transition-colors ${
                typeFilter === type ? cfg.color + " ring-1 ring-current" : "bg-primary/[0.03] text-muted-foreground hover:text-foreground"
              }`}>
              <cfg.icon className="w-3 h-3" /> {type} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-0.5 max-h-[600px] overflow-y-auto rounded-xl border border-primary/10 p-2 bg-primary/[0.01]">
        {filtered.map(l => {
          const cfg = TYPE_CONFIG[l.type] || TYPE_CONFIG.info;
          const Icon = cfg.icon;
          return (
            <div key={l.id} className="flex items-start gap-3 px-3 py-2 rounded-lg hover:bg-primary/[0.04] transition-colors group">
              <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${cfg.color.split(" ")[1]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono text-foreground break-all leading-relaxed">{l.message}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-primary/5 text-muted-foreground/60">{l.category}</span>
                  <span className="text-[8px] font-mono text-muted-foreground/40">
                    {new Date(l.time).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-12">Nenhum log encontrado</p>}
      </div>
    </div>
  );
}
