import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Users, Bot, Workflow, FileText, Activity, Settings, BarChart3, Shield,
  Search, ChevronLeft, Pause, Play, Trash2, Ban, Eye, RefreshCw,
  Globe, Video, MessageCircle, Building2, AlertTriangle, Check, X, Crown
} from "lucide-react";

type Tab = "overview" | "users" | "agents" | "workflows" | "logs" | "city" | "integrations" | "analytics" | "roles" | "moderation";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Usuários", icon: Users },
  { id: "agents", label: "Agentes", icon: Bot },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "logs", label: "Logs", icon: FileText },
  { id: "city", label: "Cidade", icon: Globe },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "roles", label: "Permissões", icon: Shield },
  { id: "moderation", label: "Moderação", icon: AlertTriangle },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [counts, setCounts] = useState<any>(null);

  // Check admin role
  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const check = async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (!data) { navigate("/"); return; }
      setIsAdmin(true);
    };
    check();
  }, [user, navigate]);

  // Load counts
  useEffect(() => {
    if (!isAdmin) return;
    supabase.rpc("admin_get_counts").then(({ data }) => {
      if (data) setCounts(data);
    });
  }, [isAdmin]);

  if (isAdmin === null) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground font-mono text-sm">Verificando permissões...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-primary/10 flex flex-col bg-background/50">
        <div className="px-4 py-5 border-b border-primary/10">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-3">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[10px] font-mono tracking-wider">VOLTAR</span>
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-sm tracking-wider text-primary">ADMIN</span>
          </div>
        </div>
        <nav className="flex-1 py-3">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-mono tracking-wider transition-colors ${
                tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label.toUpperCase()}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl">
          {tab === "overview" && <OverviewTab counts={counts} />}
          {tab === "users" && <UsersTab />}
          {tab === "agents" && <AgentsTab />}
          {tab === "workflows" && <WorkflowsTab />}
          {tab === "logs" && <LogsTab />}
          {tab === "city" && <CityTab counts={counts} />}
          {tab === "analytics" && <AnalyticsTab counts={counts} />}
          {tab === "roles" && <RolesTab />}
          {tab === "moderation" && <ModerationTab />}
        </div>
      </main>
    </div>
  );
}

// ── Overview ──
function OverviewTab({ counts }: { counts: any }) {
  const stats = counts ? [
    { label: "Usuários", value: counts.users, icon: Users, color: "text-blue-400" },
    { label: "Agentes", value: counts.agents, icon: Bot, color: "text-violet-400" },
    { label: "Workflows", value: counts.workflows, icon: Workflow, color: "text-cyan-400" },
    { label: "Reuniões Live", value: counts.meetings, icon: Video, color: "text-red-400" },
    { label: "Online Agora", value: counts.presence, icon: Activity, color: "text-emerald-400" },
    { label: "Canais Chat", value: counts.channels, icon: MessageCircle, color: "text-amber-400" },
    { label: "Mensagens", value: counts.messages, icon: FileText, color: "text-pink-400" },
    { label: "Eventos", value: counts.events, icon: Globe, color: "text-indigo-400" },
  ] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold text-primary tracking-wider">DASHBOARD</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-primary/10 bg-primary/[0.03] p-5">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Users ──
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.rpc("admin_list_profiles").then(({ data }) => {
      if (data) setUsers(data as any[]);
    });
  }, []);

  const filtered = users.filter(u => !search || u.display_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-primary tracking-wider">USUÁRIOS</h1>
        <span className="text-xs font-mono text-muted-foreground">{users.length} total</span>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuário..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 bg-primary/[0.03] text-sm font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/30" />
      </div>
      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/[0.03]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">👤</div>
              <div>
                <p className="text-sm font-mono font-bold text-foreground">{u.display_name || "Sem nome"}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{u.company_name || "—"} · {u.city || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${u.status === "available" ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"}`}>
                {u.status || "available"}
              </span>
              <button className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Ban className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Agents ──
function AgentsTab() {
  const [agents, setAgents] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("workspace_agents").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setAgents(data);
    });
  }, []);

  const filtered = agents.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "paused" : "active";
    await supabase.from("workspace_agents").update({ status: newStatus }).eq("id", id);
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-primary tracking-wider">AGENTES</h1>
        <span className="text-xs font-mono text-muted-foreground">{agents.length} total</span>
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
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${a.status === "active" ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"}`}>
                {a.status}
              </span>
              <button onClick={() => toggleStatus(a.id, a.status)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                {a.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
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

// ── Workflows ──
function WorkflowsTab() {
  const [workflows, setWorkflows] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("workspace_workflows").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setWorkflows(data);
    });
  }, []);

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "active" ? "inactive" : "active";
    await supabase.from("workspace_workflows").update({ status: newStatus }).eq("id", id);
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w));
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-bold text-primary tracking-wider">WORKFLOWS</h1>
      <div className="space-y-2">
        {workflows.map(w => (
          <div key={w.id} className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/[0.03]">
            <div>
              <p className="text-sm font-mono font-bold text-foreground">{w.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground">{w.provider} · Runs: {w.run_count || 0} · {w.description || "—"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${w.status === "active" ? "bg-emerald-400/10 text-emerald-400" : "bg-gray-600/10 text-gray-400"}`}>
                {w.status}
              </span>
              <button onClick={() => toggleStatus(w.id, w.status)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                {w.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
        {workflows.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhum workflow encontrado</p>}
      </div>
    </div>
  );
}

// ── Logs ──
function LogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    const load = async () => {
      // Combine agent activity + system logs
      const [{ data: activity }, { data: sysLogs }] = await Promise.all([
        supabase.from("agent_activity_log").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("system_logs").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      const combined = [
        ...(activity || []).map(a => ({ id: a.id, type: "agent", category: a.action_type, message: `[${a.agent_name}] ${a.description}`, time: a.created_at })),
        ...(sysLogs || []).map(s => ({ id: s.id, type: s.log_type, category: s.category, message: s.message, time: s.created_at })),
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setLogs(combined);
    };
    load();
  }, []);

  const filtered = logs.filter(l => {
    if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== "all" && l.category !== category) return false;
    return true;
  });

  const categories = ["all", ...new Set(logs.map(l => l.category))];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-bold text-primary tracking-wider">SYSTEM LOGS</h1>
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
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
              l.type === "error" ? "bg-destructive/10 text-destructive" :
              l.type === "agent" ? "bg-violet-400/10 text-violet-400" :
              "bg-primary/10 text-primary"
            }`}>{l.type}</span>
            <p className="text-[11px] font-mono text-muted-foreground flex-1">{l.message}</p>
            <span className="text-[9px] font-mono text-muted-foreground/50 shrink-0">
              {new Date(l.time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhum log encontrado</p>}
      </div>
    </div>
  );
}

// ── City ──
function CityTab({ counts }: { counts: any }) {
  const [presence, setPresence] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("user_presence").select("*").gte("last_seen", new Date(Date.now() - 15 * 60000).toISOString()),
      supabase.from("meetings").select("*").eq("status", "live"),
    ]).then(([{ data: p }, { data: m }]) => {
      if (p) setPresence(p);
      if (m) setMeetings(m);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-bold text-primary tracking-wider">ATIVIDADE DA CIDADE</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Usuários Online", value: presence.length, icon: Users, color: "text-emerald-400" },
          { label: "Reuniões Ativas", value: meetings.length, icon: Video, color: "text-red-400" },
          { label: "Prédios Ativos", value: new Set(presence.map(p => p.building_id).filter(Boolean)).size, icon: Building2, color: "text-blue-400" },
          { label: "Eventos", value: counts?.events || 0, icon: Globe, color: "text-amber-400" },
        ].map((s, i) => (
          <div key={s.label} className="rounded-xl border border-primary/10 bg-primary/[0.03] p-4">
            <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] font-mono text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {meetings.length > 0 && (
        <div>
          <h2 className="text-sm font-mono font-bold text-foreground mb-3">REUNIÕES ATIVAS</h2>
          <div className="space-y-2">
            {meetings.map(m => (
              <div key={m.id} className="p-3 rounded-xl border border-red-400/20 bg-red-400/5">
                <p className="text-sm font-mono font-bold text-foreground">{m.title}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{m.room}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {presence.length > 0 && (
        <div>
          <h2 className="text-sm font-mono font-bold text-foreground mb-3">USUÁRIOS ONLINE</h2>
          <div className="grid grid-cols-2 gap-2">
            {presence.map(p => (
              <div key={p.id} className="p-3 rounded-xl border border-primary/10 bg-primary/[0.03]">
                <p className="text-xs font-mono text-foreground">{p.user_id.slice(0, 8)}...</p>
                <p className="text-[9px] font-mono text-muted-foreground">{p.status} · {p.building_id || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Analytics ──
function AnalyticsTab({ counts }: { counts: any }) {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-bold text-primary tracking-wider">ANALYTICS</h1>
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Usuários Registrados", value: counts?.users || 0 },
          { label: "Agentes Criados", value: counts?.agents || 0 },
          { label: "Mensagens Enviadas", value: counts?.messages || 0 },
          { label: "Workflows Ativos", value: counts?.workflows || 0 },
          { label: "Canais de Chat", value: counts?.channels || 0 },
          { label: "Eventos da Cidade", value: counts?.events || 0 },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-primary/10 bg-primary/[0.03] p-5 text-center">
            <p className="text-3xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs font-mono text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Roles ──
function RolesTab() {
  const [roles, setRoles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("member");

  useEffect(() => {
    Promise.all([
      supabase.from("user_roles").select("*"),
      supabase.rpc("admin_list_profiles"),
    ]).then(([{ data: r }, { data: p }]) => {
      if (r) setRoles(r);
      if (p) setProfiles(p as any[]);
    });
  }, []);

  const assignRole = async () => {
    if (!selectedUser) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: selectedUser, role: selectedRole as any });
    if (!error) {
      const { data } = await supabase.from("user_roles").select("*");
      if (data) setRoles(data);
      setSelectedUser("");
    }
  };

  const removeRole = async (id: string) => {
    await supabase.from("user_roles").delete().eq("id", id);
    setRoles(prev => prev.filter(r => r.id !== id));
  };

  const getProfileName = (userId: string) => profiles.find(p => p.id === userId)?.display_name || userId.slice(0, 8);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-bold text-primary tracking-wider">PERMISSÕES</h1>

      {/* Assign role */}
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
          <button onClick={assignRole} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-mono font-bold tracking-wider hover:bg-primary/90">
            ATRIBUIR
          </button>
        </div>
      </div>

      {/* Current roles */}
      <div className="space-y-2">
        {roles.map(r => (
          <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/[0.03]">
            <div className="flex items-center gap-3">
              <Crown className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-sm font-mono font-bold text-foreground">{getProfileName(r.user_id)}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{r.user_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">{r.role.toUpperCase()}</span>
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

// ── Moderation ──
function ModerationTab() {
  const [agents, setAgents] = useState<any[]>([]);
  const [creations, setCreations] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("workspace_agents").select("*").eq("status", "active"),
      supabase.from("agent_creations").select("*").order("created_at", { ascending: false }).limit(20),
    ]).then(([{ data: a }, { data: c }]) => {
      if (a) setAgents(a);
      if (c) setCreations(c);
    });
  }, []);

  const disableAgent = async (id: string) => {
    await supabase.from("workspace_agents").update({ status: "disabled" }).eq("id", id);
    setAgents(prev => prev.filter(a => a.id !== id));
  };

  const removeCreation = async (id: string) => {
    // Note: no DELETE policy exists, so this would need admin-level access
    setCreations(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-bold text-primary tracking-wider">MODERAÇÃO</h1>

      <div>
        <h2 className="text-sm font-mono font-bold text-foreground mb-3">AGENTES ATIVOS ({agents.length})</h2>
        <div className="space-y-2">
          {agents.slice(0, 10).map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-primary/10 bg-primary/[0.03]">
              <div>
                <p className="text-xs font-mono font-bold text-foreground">{a.name}</p>
                <p className="text-[9px] font-mono text-muted-foreground">{a.agent_type} · {a.building_id}</p>
              </div>
              <button onClick={() => disableAgent(a.id)} className="px-3 py-1.5 rounded-lg text-[9px] font-mono bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                DESATIVAR
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-mono font-bold text-foreground mb-3">CRIAÇÕES RECENTES ({creations.length})</h2>
        <div className="space-y-2">
          {creations.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-primary/10 bg-primary/[0.03]">
              <div>
                <p className="text-xs font-mono font-bold text-foreground">{c.title}</p>
                <p className="text-[9px] font-mono text-muted-foreground">{c.agent_name} · {c.creation_type}</p>
              </div>
              <button onClick={() => removeCreation(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Integrations (placeholder, config-based) ──
function IntegrationsTab() {
  const INTEGRATIONS = [
    { name: "Google Calendar", status: "available", icon: "📅" },
    { name: "Slack", status: "available", icon: "💬" },
    { name: "GitHub", status: "available", icon: "🐙" },
    { name: "Zapier", status: "available", icon: "⚡" },
    { name: "Outlook", status: "available", icon: "📧" },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-bold text-primary tracking-wider">INTEGRAÇÕES</h1>
      <div className="space-y-2">
        {INTEGRATIONS.map(i => (
          <div key={i.name} className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/[0.03]">
            <div className="flex items-center gap-3">
              <span className="text-xl">{i.icon}</span>
              <span className="text-sm font-mono font-bold text-foreground">{i.name}</span>
            </div>
            <button className="px-3 py-1.5 rounded-lg text-[9px] font-mono bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              CONFIGURAR
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
