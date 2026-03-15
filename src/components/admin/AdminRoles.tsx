import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Trash2, RefreshCw, Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export function AdminRoles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
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
    toast.success("Role atribuída com sucesso");
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

  const ROLE_CONFIG: Record<string, { color: string; icon: string; desc: string }> = {
    admin: { color: "bg-red-400/10 text-red-400 border-red-400/20", icon: "👑", desc: "Acesso total à plataforma" },
    manager: { color: "bg-amber-400/10 text-amber-400 border-amber-400/20", icon: "⚡", desc: "Gerenciar equipes e agentes" },
    member: { color: "bg-blue-400/10 text-blue-400 border-blue-400/20", icon: "👤", desc: "Acesso padrão ao workspace" },
    guest: { color: "bg-muted text-muted-foreground border-primary/10", icon: "👁", desc: "Acesso limitado de visualização" },
  };

  // Role distribution
  const roleCounts = Object.keys(ROLE_CONFIG).map(r => ({ role: r, count: roles.filter(x => x.role === r).length }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-primary tracking-wider">PERMISSÕES</h1>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{roles.length} roles atribuídas</p>
        </div>
        <button onClick={loadData} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Role Distribution Cards */}
      <div className="grid grid-cols-4 gap-3">
        {roleCounts.map(({ role, count }) => {
          const cfg = ROLE_CONFIG[role];
          return (
            <div key={role} className={`rounded-xl border ${cfg.color} p-4 text-center`}>
              <span className="text-xl">{cfg.icon}</span>
              <p className="text-xl font-display font-bold mt-1">{count}</p>
              <p className="text-[9px] font-mono mt-0.5">{role.toUpperCase()}</p>
              <p className="text-[8px] font-mono text-muted-foreground/50 mt-0.5">{cfg.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Assign Role Form */}
      <div className="rounded-xl border border-primary/10 bg-primary/[0.02] p-5">
        <h2 className="text-sm font-mono font-bold text-foreground flex items-center gap-2 mb-4">
          <UserPlus className="w-3.5 h-3.5 text-primary" /> ATRIBUIR ROLE
        </h2>
        <div className="flex gap-2">
          <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-primary/10 bg-background text-xs font-mono text-foreground focus:outline-none focus:border-primary/30">
            <option value="">Selecionar usuário...</option>
            {profiles.map((p: any) => <option key={p.id} value={p.id}>{p.display_name || p.id}</option>)}
          </select>
          <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-primary/10 bg-background text-xs font-mono text-foreground focus:outline-none focus:border-primary/30">
            {Object.keys(ROLE_CONFIG).map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
          </select>
          <button onClick={assignRole} className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-mono font-bold tracking-wider hover:bg-primary/90 transition-colors">
            ATRIBUIR
          </button>
        </div>
      </div>

      {/* Roles Table */}
      <div className="rounded-xl border border-primary/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-primary/10 bg-primary/[0.03]">
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">USUÁRIO</TableHead>
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">ROLE</TableHead>
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">DESDE</TableHead>
              <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground text-right">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map(r => {
              const cfg = ROLE_CONFIG[r.role] || ROLE_CONFIG.member;
              return (
                <TableRow key={r.id} className="border-primary/5 hover:bg-primary/[0.03]">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {getProfileName(r.user_id)?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-xs font-mono font-bold text-foreground">{getProfileName(r.user_id)}</p>
                        <p className="text-[9px] font-mono text-muted-foreground/50">{r.user_id.slice(0, 12)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-[9px] font-mono px-2.5 py-1 rounded-full font-bold ${cfg.color}`}>
                      {cfg.icon} {r.role.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-[10px] font-mono text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => removeRole(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Remover role">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {roles.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhuma role atribuída</p>}
      </div>
    </div>
  );
}
