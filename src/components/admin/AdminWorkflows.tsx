import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Pause, Play, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function AdminWorkflows() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkflows = async () => {
    setLoading(true);
    const { data } = await supabase.from("workspace_workflows").select("*").order("created_at", { ascending: false });
    if (data) setWorkflows(data);
    setLoading(false);
  };

  useEffect(() => { loadWorkflows(); }, []);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-primary tracking-wider">WORKFLOWS</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{workflows.length} total</span>
          <button onClick={loadWorkflows} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {workflows.map(w => (
          <div key={w.id} className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/[0.03]">
            <div>
              <p className="text-sm font-mono font-bold text-foreground">{w.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground">
                {w.provider} · Runs: {w.run_count || 0} · {w.last_run_at ? `Último: ${new Date(w.last_run_at).toLocaleDateString("pt-BR")}` : "Nunca executado"}
              </p>
              {w.description && <p className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">{w.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${w.status === "active" ? "bg-emerald-400/10 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                {w.status}
              </span>
              <button onClick={() => toggleStatus(w.id, w.status)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                {w.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => deleteWorkflow(w.id, w.name)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {workflows.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhum workflow encontrado</p>}
      </div>
    </div>
  );
}
