import { motion } from "framer-motion";
import { Users, Bot, Workflow, FileText, Activity, Globe, Video, MessageCircle } from "lucide-react";

interface AdminOverviewProps {
  counts: Record<string, number> | null;
}

export function AdminOverview({ counts }: AdminOverviewProps) {
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
      {!counts ? (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono text-muted-foreground">Carregando métricas...</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
