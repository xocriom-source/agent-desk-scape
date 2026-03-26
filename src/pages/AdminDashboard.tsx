import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users, Bot, Workflow, FileText, Activity, Settings, BarChart3, Shield,
  ChevronLeft, Globe, AlertTriangle, Menu, X
} from "lucide-react";

import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminAgents } from "@/components/admin/AdminAgents";
import { AdminWorkflows } from "@/components/admin/AdminWorkflows";
import { AdminLogs } from "@/components/admin/AdminLogs";
import { AdminCity } from "@/components/admin/AdminCity";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminRoles } from "@/components/admin/AdminRoles";
import { AdminModeration } from "@/components/admin/AdminModeration";
import { AdminIntegrations } from "@/components/admin/AdminIntegrations";

type Tab = "overview" | "users" | "agents" | "workflows" | "logs" | "city" | "integrations" | "analytics" | "roles" | "moderation";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Usuários", icon: Users },
  { id: "agents", label: "Agentes", icon: Bot },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "logs", label: "Logs", icon: FileText },
  { id: "city", label: "Cidade", icon: Globe },
  { id: "integrations", label: "Integrações", icon: Settings },
  { id: "analytics", label: "Analytics", icon: Activity },
  { id: "roles", label: "Permissões", icon: Shield },
  { id: "moderation", label: "Moderação", icon: AlertTriangle },
];

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [counts, setCounts] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.rpc("admin_get_counts").then(({ data }) => {
      if (data) setCounts(data);
    });
    const interval = setInterval(() => {
      supabase.rpc("admin_get_counts").then(({ data }) => {
        if (data) setCounts(data);
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setSidebarOpen(false);
  };

  if (isAdmin === null) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[10px] font-mono tracking-wider text-muted-foreground">VERIFICANDO PERMISSÕES...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <SEOHead title="Admin Dashboard" description="Painel administrativo do The Good City." path="/admin" />
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-primary/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-display font-bold text-xs tracking-wider text-primary">ADMIN</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static z-50 top-0 left-0 h-full w-56 border-r border-primary/10 flex flex-col bg-background shrink-0 transition-transform duration-200 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
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
        <nav className="flex-1 py-3 overflow-y-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-mono tracking-wider transition-colors ${
                tab === t.id ? "bg-primary/10 text-primary border-r-2 border-primary" : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label.toUpperCase()}
            </button>
          ))}
        </nav>
        {/* Sidebar footer with counts */}
        {counts && (
          <div className="px-4 py-3 border-t border-primary/10">
            <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
              <span>{counts.presence || 0} online</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto lg:pt-0 pt-14">
        <div className="p-4 lg:p-6 max-w-6xl">
          {tab === "overview" && <AdminOverview counts={counts} onNavigate={(t: string) => setTab(t as Tab)} />}
          {tab === "users" && <AdminUsers />}
          {tab === "agents" && <AdminAgents />}
          {tab === "workflows" && <AdminWorkflows />}
          {tab === "logs" && <AdminLogs />}
          {tab === "city" && <AdminCity counts={counts} />}
          {tab === "integrations" && <AdminIntegrations />}
          {tab === "analytics" && <AdminAnalytics counts={counts} />}
          {tab === "roles" && <AdminRoles />}
          {tab === "moderation" && <AdminModeration />}
        </div>
      </main>
    </div>
  );
}
