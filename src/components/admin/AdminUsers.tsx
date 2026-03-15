import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Ban, RefreshCw, Check, Shield, Download, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: userRoles }] = await Promise.all([
      supabase.rpc("admin_list_profiles"),
      supabase.from("user_roles").select("*"),
    ]);
    if (profiles) setUsers(profiles as any[]);
    if (userRoles) setRoles(userRoles);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const getUserRoles = (userId: string) => roles.filter(r => r.user_id === userId).map(r => r.role);

  const suspendUser = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "available" : "suspended";
    if (newStatus === "suspended" && !confirm("Deseja realmente suspender este usuário?")) return;
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar status"); return; }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: newStatus } : u));
    toast.success(newStatus === "suspended" ? "Usuário suspenso" : "Usuário reativado");
  };

  const exportCSV = () => {
    const header = "Nome,Empresa,Cidade,Status,Criado em\n";
    const rows = filtered.map(u => `"${u.display_name}","${u.company_name || ""}","${u.city || ""}","${u.status}","${u.created_at}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "users.csv"; a.click();
    toast.success("CSV exportado");
  };

  const filtered = users.filter(u => {
    if (search && !u.display_name?.toLowerCase().includes(search.toLowerCase()) && !u.company_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    return true;
  });

  const ROLE_COLORS: Record<string, string> = {
    admin: "bg-red-400/10 text-red-400",
    manager: "bg-amber-400/10 text-amber-400",
    member: "bg-blue-400/10 text-blue-400",
    guest: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-primary tracking-wider">USUÁRIOS</h1>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{users.length} registrados · {users.filter(u => u.status === "available").length} ativos</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Download className="w-3 h-3" /> CSV
          </button>
          <button onClick={loadUsers} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou empresa..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 bg-primary/[0.03] text-sm font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/30" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-primary/10 bg-primary/[0.03] text-xs font-mono text-foreground focus:outline-none">
          <option value="all">Todos</option>
          <option value="available">Ativos</option>
          <option value="suspended">Suspensos</option>
          <option value="away">Ausentes</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="rounded-xl border border-primary/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/10 bg-primary/[0.03]">
                <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">USUÁRIO</TableHead>
                <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">EMPRESA</TableHead>
                <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">CIDADE</TableHead>
                <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">ROLES</TableHead>
                <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">STATUS</TableHead>
                <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground">DESDE</TableHead>
                <TableHead className="text-[10px] font-mono tracking-wider text-muted-foreground text-right">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => {
                const userRoles = getUserRoles(u.id);
                return (
                  <TableRow key={u.id} className="border-primary/5 hover:bg-primary/[0.03]">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {u.display_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-xs font-mono font-bold text-foreground">{u.display_name || "Sem nome"}</p>
                          <p className="text-[9px] font-mono text-muted-foreground/60">{u.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono text-muted-foreground">{u.company_name || "—"}</TableCell>
                    <TableCell className="text-[10px] font-mono text-muted-foreground">{u.city || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {userRoles.length > 0 ? userRoles.map(r => (
                          <span key={r} className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full font-bold ${ROLE_COLORS[r] || "bg-primary/10 text-primary"}`}>
                            {r}
                          </span>
                        )) : (
                          <span className="text-[8px] font-mono text-muted-foreground/40">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                        u.status === "suspended" ? "bg-destructive/10 text-destructive" :
                        u.status === "available" ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
                      }`}>
                        {u.status || "available"}
                      </span>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => suspendUser(u.id, u.status)}
                        className={`p-1.5 rounded-lg transition-colors ${u.status === "suspended" ? "hover:bg-emerald-400/10 text-muted-foreground hover:text-emerald-400" : "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"}`}
                        title={u.status === "suspended" ? "Reativar" : "Suspender"}>
                        {u.status === "suspended" ? <Check className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhum usuário encontrado</p>}
        </div>
      )}
    </div>
  );
}
