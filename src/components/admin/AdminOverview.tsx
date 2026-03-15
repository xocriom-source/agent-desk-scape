import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Users, Bot, Workflow, FileText, Activity, Globe, Video, MessageCircle, TrendingUp, Clock, Zap, ArrowUpRight } from "lucide-react";

interface AdminOverviewProps {
  counts: Record<string, number> | null;
}

export function AdminOverview({ counts }: AdminOverviewProps) {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [topAgents, setTopAgents] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("agent_activity_log").select("*").order("created_at", { ascending: false }).limit(8),
      supabase.rpc("admin_list_profiles").then(r => ({ data: (r.data as any[] || []).slice(0, 5) })),
      supabase.from("workspace_agents").select("*").eq("status", "active").limit(5),
    ]).then(([{ data: activity }, { data: users }, { data: agents }]) => {
      if (activity) setRecentActivity(activity);
      if (users) setRecentUsers(users as any[]);
      if (agents) setTopAgents(agents || []);
    });
  }, []);

  const stats = counts ? [
    { label: "Usuários", value: counts.users, icon: Users, color: "from-blue-500/20 to-blue-600/5", accent: "text-blue-400", trend: "+12%" },
    { label: "Agentes", value: counts.agents, icon: Bot, color: "from-violet-500/20 to-violet-600/5", accent: "text-violet-400", trend: "+8%" },
    { label: "Workflows", value: counts.workflows, icon: Workflow, color: "from-cyan-500/20 to-cyan-600/5", accent: "text-cyan-400", trend: "+5%" },
    { label: "Online Agora", value: counts.presence, icon: Activity, color: "from-emerald-500/20 to-emerald-600/5", accent: "text-emerald-400", trend: "live" },
    { label: "Reuniões Live", value: counts.meetings, icon: Video, color: "from-red-500/20 to-red-600/5", accent: "text-red-400", trend: "live" },
    { label: "Canais Chat", value: counts.channels, icon: MessageCircle, color: "from-amber-500/20 to-amber-600/5", accent: "text-amber-400", trend: "+3%" },
    { label: "Mensagens", value: counts.messages, icon: FileText, color: "from-pink-500/20 to-pink-600/5", accent: "text-pink-400", trend: "+24%" },
    { label: "Eventos Cidade", value: counts.events, icon: Globe, color: "from-indigo-500/20 to-indigo-600/5", accent: "text-indigo-400", trend: "+15%" },
  ] : [];

  if (!counts) return (
    <div className="text-center py-16">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
      <p className="text-xs font-mono text-muted-foreground">Carregando métricas...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-primary tracking-wider">DASHBOARD</h1>
        <p className="text-xs font-mono text-muted-foreground mt-1">Visão geral da plataforma em tempo real</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={`rounded-xl border border-primary/10 bg-gradient-to-br ${s.color} p-5 group hover:border-primary/20 transition-colors`}>
            <div className="flex items-center justify-between mb-3">
              <s.icon className={`w-5 h-5 ${s.accent}`} />
              <span className={`text-[9px] font-mono font-bold ${s.trend === "live" ? "text-emerald-400 animate-pulse" : "text-emerald-400"} flex items-center gap-0.5`}>
                {s.trend === "live" ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> : <TrendingUp className="w-2.5 h-2.5" />}
                {s.trend}
              </span>
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{s.value.toLocaleString("pt-BR")}</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border border-primary/10 bg-primary/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono font-bold text-foreground flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> ATIVIDADE RECENTE
            </h2>
            <span className="text-[9px] font-mono text-muted-foreground">{recentActivity.length} eventos</span>
          </div>
          <div className="space-y-1">
            {recentActivity.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/[0.04] transition-colors group">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0 group-hover:bg-primary transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono text-foreground truncate">
                    <span className="text-primary font-bold">{a.agent_name}</span> — {a.description}
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground/60">{a.action_type} · {timeAgo(a.created_at)}</p>
                </div>
              </motion.div>
            ))}
            {recentActivity.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-6">Nenhuma atividade recente</p>}
          </div>
        </div>

        {/* Sidebar: Users + Agents */}
        <div className="space-y-6">
          <div className="rounded-xl border border-primary/10 bg-primary/[0.02] p-5">
            <h2 className="text-sm font-mono font-bold text-foreground flex items-center gap-2 mb-4">
              <Users className="w-3.5 h-3.5 text-blue-400" /> ÚLTIMOS USUÁRIOS
            </h2>
            <div className="space-y-2">
              {recentUsers.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 py-1.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                    {u.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono font-bold text-foreground truncate">{u.display_name || "—"}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">{u.company_name || u.city || "—"}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${u.status === "available" ? "bg-emerald-400" : u.status === "suspended" ? "bg-destructive" : "bg-muted-foreground/30"}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-primary/10 bg-primary/[0.02] p-5">
            <h2 className="text-sm font-mono font-bold text-foreground flex items-center gap-2 mb-4">
              <Bot className="w-3.5 h-3.5 text-violet-400" /> AGENTES ATIVOS
            </h2>
            <div className="space-y-2">
              {topAgents.map(a => (
                <div key={a.id} className="flex items-center justify-between py-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono font-bold text-foreground truncate">{a.name}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">{a.model || a.agent_type}</p>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">active</span>
                </div>
              ))}
              {topAgents.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-4">Nenhum agente ativo</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-primary/10 bg-primary/[0.02] p-5">
        <h2 className="text-sm font-mono font-bold text-foreground mb-4">AÇÕES RÁPIDAS</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Gerenciar Usuários", desc: "Visualizar e suspender contas", icon: Users },
            { label: "Controlar Agentes", desc: "Pausar e remover agentes", icon: Bot },
            { label: "Ver Logs", desc: "Acompanhar atividade do sistema", icon: FileText },
            { label: "Moderação", desc: "Revisar conteúdo da plataforma", icon: Clock },
          ].map(q => (
            <button key={q.label} className="text-left p-4 rounded-xl border border-primary/10 hover:border-primary/30 bg-primary/[0.03] hover:bg-primary/[0.06] transition-all group">
              <q.icon className="w-4 h-4 text-primary mb-2" />
              <p className="text-xs font-mono font-bold text-foreground">{q.label}</p>
              <p className="text-[9px] font-mono text-muted-foreground mt-0.5">{q.desc}</p>
              <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-primary mt-2 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
