import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Pause, Play, Trash2, RefreshCw, Search, Workflow, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export function AdminWorkflows() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadWorkflows = async () => {
    setLoading(true);
    const [{ data: w }, { data: p }] = await Promise.all([
      supabase.from("workspace_workflows").select("*").order("created_at", { ascending: false }),
      supabase.rpc("admin_list_profiles"),
    ]);
    if (w) setWorkflows(w);
    if (p) setProfiles(p as any[]);
    setLoading(false);
  };

  useEffect(() => { loadWorkflows(); }, []);

  const getOwner = (userId: string) => profiles.find((p: any) => p.id === userId)?.display_name || userId.slice(0, 8);

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "inactive" : "active";
    const { error } = await supabase.from("workspace_workflows").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w));
    toast.success(`Workflow ${newStatus}`);
  };

  const deleteWorkflow = async (id: string, name: string) => {
    if (!confirm(`Remover workflow "${name}"?`)) return;
    const { error } = await supabase.from("workspace_workflows").delete().eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    setWorkflows(prev => prev.filter(w => w.id !== id));
    toast.success("Workflow removido");
  };

  const filtered = workflows.filter(w => !search || w.name.toLowerCase().includes(search.toLowerCase()));
  const activeCount = workflows.filter(w => w.status === "active").length;
  const totalRuns = workflows.reduce((sum, w) => sum + (w.run_count || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-primary tracking-wider">WORKFLOWS</h1>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
            {workflows.length} total · <span className="text-emerald-400">{activeCount} ativos</span> · {totalRuns} execuções
          </p>
        </div>
        <button onClick={loadWorkflows} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar workflow..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 bg-primary/[0.03] text-sm font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/30" />
      </div>

      <div className="rounded-xl border border-primary/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-primary/10 bg-primary/[0.03]">
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">WORKFLOW</TableHead>
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">PROPRIETÁRIO</TableHead>
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">PROVIDER</TableHead>
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">EXECUÇÕES</TableHead>
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">ÚLTIMA EXEC.</TableHead>
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">STATUS</TableHead>
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground text-right">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(w => (
              <TableRow key={w.id} className="border-primary/5 hover:bg-primary/[0.03]">
                <TableCell className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-400/10 flex items-center justify-center">
                      <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs font-mono font-bold text-foreground">{w.name}</p>
                      {w.description && <p className="text-[9px] font-mono text-muted-foreground/50 truncate max-w-[200px]">{w.description}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-[10px] font-mono text-muted-foreground">{getOwner(w.user_id)}</TableCell>
                <TableCell><span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">{w.provider}</span></TableCell>
                <TableCell className="text-[10px] font-mono text-foreground font-bold">{w.run_count || 0}</TableCell>
                <TableCell className="text-[10px] font-mono text-muted-foreground">
                  {w.last_run_at ? new Date(w.last_run_at).toLocaleDateString("pt-BR") : "Nunca"}
                </TableCell>
                <TableCell>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                    w.status === "active" ? "bg-emerald-400/10 text-emerald-400" : "bg-muted text-muted-foreground"
                  }`}>{w.status}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => toggleStatus(w.id, w.status)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                      {w.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => deleteWorkflow(w.id, w.name)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhum workflow encontrado</p>}
      </div>
    </div>
  );
}
