import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Pause, Play, Trash2, RefreshCw, Bot, Cpu, Layers } from "lucide-react";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export function AdminAgents() {
  const [agents, setAgents] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadAgents = async () => {
    setLoading(true);
    const [{ data: a }, { data: p }] = await Promise.all([
      supabase.from("workspace_agents").select("*").order("created_at", { ascending: false }),
      supabase.rpc("admin_list_profiles"),
    ]);
    if (a) setAgents(a);
    if (p) setProfiles(p as any[]);
    setLoading(false);
  };

  useEffect(() => { loadAgents(); }, []);

  const getOwner = (userId: string) => profiles.find(p => p.id === userId)?.display_name || userId.slice(0, 8);

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "paused" : "active";
    const { error } = await supabase.from("workspace_agents").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    toast.success(`Agente ${newStatus === "active" ? "ativado" : "pausado"}`);
  };

  const deleteAgent = async (id: string, name: string) => {
    if (!confirm(`Remover agente "${name}"? Esta ação é irreversível.`)) return;
    const { error } = await supabase.from("workspace_agents").delete().eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    setAgents(prev => prev.filter(a => a.id !== id));
    toast.success("Agente removido");
  };

  const filtered = agents.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !getOwner(a.user_id).toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  const statusCounts = {
    active: agents.filter(a => a.status === "active").length,
    paused: agents.filter(a => a.status === "paused").length,
    inactive: agents.filter(a => a.status === "inactive").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-primary tracking-wider">AGENTES</h1>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
            {agents.length} total · <span className="text-emerald-400">{statusCounts.active} ativos</span> · <span className="text-amber-400">{statusCounts.paused} pausados</span>
          </p>
        </div>
        <button onClick={loadAgents} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Ativos", value: statusCounts.active, color: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" },
          { label: "Pausados", value: statusCounts.paused, color: "bg-amber-400/10 text-amber-400 border-amber-400/20" },
          { label: "Inativos", value: statusCounts.inactive, color: "bg-muted text-muted-foreground border-primary/10" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border ${s.color} p-4 text-center`}>
            <p className="text-2xl font-display font-bold">{s.value}</p>
            <p className="text-[9px] font-mono mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar agente ou proprietário..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 bg-primary/[0.03] text-sm font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/30" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-primary/10 bg-primary/[0.03] text-xs font-mono text-foreground focus:outline-none">
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="paused">Pausados</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>

      <div className="rounded-xl border border-primary/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-primary/10 bg-primary/[0.03]">
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">AGENTE</TableHead>
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">PROPRIETÁRIO</TableHead>
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">MODELO</TableHead>
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">SKILLS</TableHead>
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">STATUS</TableHead>
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground text-right">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(a => (
              <TableRow key={a.id} className="border-primary/5 hover:bg-primary/[0.03]">
                <TableCell className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-400/10 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs font-mono font-bold text-foreground">{a.name}</p>
                      <p className="text-[9px] font-mono text-muted-foreground/60">{a.agent_type} · {a.building_id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-[10px] font-mono text-muted-foreground">{getOwner(a.user_id)}</TableCell>
                <TableCell>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1 w-fit">
                    <Cpu className="w-2.5 h-2.5" /> {a.model || "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {(a.skills || []).slice(0, 3).map((s: string) => (
                      <span key={s} className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-primary/5 text-muted-foreground">{s}</span>
                    ))}
                    {(a.skills || []).length > 3 && <span className="text-[8px] font-mono text-muted-foreground/50">+{a.skills.length - 3}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                    a.status === "active" ? "bg-emerald-400/10 text-emerald-400" :
                    a.status === "paused" ? "bg-amber-400/10 text-amber-400" : "bg-muted text-muted-foreground"
                  }`}>{a.status}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => toggleStatus(a.id, a.status)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                      title={a.status === "active" ? "Pausar" : "Ativar"}>
                      {a.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => deleteAgent(a.id, a.name)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Remover">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhum agente encontrado</p>}
      </div>
    </div>
  );
}
