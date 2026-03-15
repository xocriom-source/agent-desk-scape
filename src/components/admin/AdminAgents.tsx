import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Pause, Play, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function AdminAgents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAgents = async () => {
    setLoading(true);
    const { data } = await supabase.from("workspace_agents").select("*").order("created_at", { ascending: false });
    if (data) setAgents(data);
    setLoading(false);
  };

  useEffect(() => { loadAgents(); }, []);

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "paused" : "active";
    const { error } = await supabase.from("workspace_agents").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    toast.success(`Agente ${newStatus === "active" ? "ativado" : "pausado"}`);
  };

  const deleteAgent = async (id: string, name: string) => {
    if (!confirm(`Remover agente "${name}"?`)) return;
    const { error } = await supabase.from("workspace_agents").delete().eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    setAgents(prev => prev.filter(a => a.id !== id));
    toast.success("Agente removido");
  };

  const filtered = agents.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-primary tracking-wider">AGENTES</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{agents.length} total</span>
          <button onClick={loadAgents} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar agente..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 bg-primary/[0.03] text-sm font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/30" />
      </div>
      <div className="space-y-2">
        {filtered.map(a => (
          <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/[0.03]">
            <div>
              <p className="text-sm font-mono font-bold text-foreground">{a.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground">{a.agent_type} · {a.model || "—"} · Building: {a.building_id}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                a.status === "active" ? "bg-emerald-400/10 text-emerald-400" : 
                a.status === "paused" ? "bg-amber-400/10 text-amber-400" :
                "bg-destructive/10 text-destructive"
              }`}>{a.status}</span>
              <button onClick={() => toggleStatus(a.id, a.status)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                {a.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => deleteAgent(a.id, a.name)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhum agente encontrado</p>}
      </div>
    </div>
  );
}
