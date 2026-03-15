import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function AdminRoles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from("user_roles").select("*"),
      supabase.rpc("admin_list_profiles"),
    ]);
    if (r) setRoles(r);
    if (p) setProfiles(p as any[]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const assignRole = async () => {
    if (!selectedUser) { toast.error("Selecione um usuário"); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: selectedUser, role: selectedRole as any });
    if (error) {
      if (error.message.includes("duplicate")) toast.error("Usuário já possui essa role");
      else toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Role atribuída");
    loadData();
    setSelectedUser("");
  };

  const removeRole = async (id: string) => {
    if (!confirm("Remover esta permissão?")) return;
    await supabase.from("user_roles").delete().eq("id", id);
    setRoles(prev => prev.filter(r => r.id !== id));
    toast.success("Role removida");
  };

  const getProfileName = (userId: string) => profiles.find(p => p.id === userId)?.display_name || userId.slice(0, 8);

  const ROLE_COLORS: Record<string, string> = {
    admin: "bg-red-400/10 text-red-400",
    manager: "bg-amber-400/10 text-amber-400",
    member: "bg-blue-400/10 text-blue-400",
    guest: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-primary tracking-wider">PERMISSÕES</h1>
        <button onClick={loadData} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="rounded-xl border border-primary/10 bg-primary/[0.03] p-5 space-y-3">
        <h2 className="text-sm font-mono font-bold text-foreground">ATRIBUIR ROLE</h2>
        <div className="flex gap-2">
          <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-primary/10 bg-background text-xs font-mono text-foreground focus:outline-none">
            <option value="">Selecionar usuário...</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.display_name || p.id}</option>)}
          </select>
          <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
            className="px-3 py-2 rounded-xl border border-primary/10 bg-background text-xs font-mono text-foreground focus:outline-none">
            {["admin", "manager", "member", "guest"].map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
          </select>
          <button onClick={assignRole} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-mono font-bold tracking-wider hover:bg-primary/90 transition-colors">
            ATRIBUIR
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {roles.map(r => (
          <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/[0.03]">
            <div className="flex items-center gap-3">
              <Crown className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-sm font-mono font-bold text-foreground">{getProfileName(r.user_id)}</p>
                <p className="text-[9px] font-mono text-muted-foreground/50">{r.user_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono px-2.5 py-1 rounded-full font-bold ${ROLE_COLORS[r.role] || "bg-primary/10 text-primary"}`}>
                {r.role.toUpperCase()}
              </span>
              <button onClick={() => removeRole(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {roles.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhuma role atribuída</p>}
      </div>
    </div>
  );
}
