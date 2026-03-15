import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Ban, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.rpc("admin_list_profiles");
    if (data) setUsers(data as any[]);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const suspendUser = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "available" : "suspended";
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar status"); return; }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
    toast.success(newStatus === "suspended" ? "Usuário suspenso" : "Usuário reativado");
  };

  const filtered = users.filter(u => !search || u.display_name?.toLowerCase().includes(search.toLowerCase()) || u.company_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-primary tracking-wider">USUÁRIOS</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{users.length} total</span>
          <button onClick={loadUsers} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuário..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 bg-primary/[0.03] text-sm font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/30" />
      </div>
      {loading ? (
        <div className="text-center py-8">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(u => (
            <div key={u.id} className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">👤</div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">{u.display_name || "Sem nome"}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{u.company_name || "—"} · {u.city || "—"}</p>
                  <p className="text-[9px] font-mono text-muted-foreground/50">Desde {new Date(u.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                  u.status === "suspended" ? "bg-destructive/10 text-destructive" :
                  u.status === "available" ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
                }`}>
                  {u.status || "available"}
                </span>
                <button onClick={() => suspendUser(u.id, u.status)} 
                  className={`p-1.5 rounded-lg transition-colors ${u.status === "suspended" ? "hover:bg-emerald-400/10 text-muted-foreground hover:text-emerald-400" : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"}`}
                  title={u.status === "suspended" ? "Reativar" : "Suspender"}
                >
                  {u.status === "suspended" ? <Check className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhum usuário encontrado</p>}
        </div>
      )}
    </div>
  );
}
