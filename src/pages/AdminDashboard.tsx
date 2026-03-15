import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users, Bot, Workflow, FileText, Activity, Settings, BarChart3, Shield,
  ChevronLeft, Globe, AlertTriangle
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [counts, setCounts] = useState<any>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      if (!data) { navigate("/"); return; }
      setIsAdmin(true);
    });
  }, [user, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    supabase.rpc("admin_get_counts").then(({ data }) => {
      if (data) setCounts(data);
    });
  }, [isAdmin]);

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
      <aside className="w-56 border-r border-primary/10 flex flex-col bg-background/50 shrink-0">
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
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-mono tracking-wider transition-colors ${
                tab === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
              }`}>
              <t.icon className="w-4 h-4" />
              {t.label.toUpperCase()}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl">
          {tab === "overview" && <AdminOverview counts={counts} />}
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
