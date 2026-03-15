import { motion } from "framer-motion";

interface AdminAnalyticsProps {
  counts: Record<string, number> | null;
}

export function AdminAnalytics({ counts }: AdminAnalyticsProps) {
  const stats = [
    { label: "Usuários Registrados", value: counts?.users || 0, color: "from-blue-500/20 to-blue-600/5" },
    { label: "Agentes Criados", value: counts?.agents || 0, color: "from-violet-500/20 to-violet-600/5" },
    { label: "Mensagens Enviadas", value: counts?.messages || 0, color: "from-pink-500/20 to-pink-600/5" },
    { label: "Workflows Ativos", value: counts?.workflows || 0, color: "from-cyan-500/20 to-cyan-600/5" },
    { label: "Canais de Chat", value: counts?.channels || 0, color: "from-amber-500/20 to-amber-600/5" },
    { label: "Eventos da Cidade", value: counts?.events || 0, color: "from-emerald-500/20 to-emerald-600/5" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-display font-bold text-primary tracking-wider">ANALYTICS</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className={`rounded-xl border border-primary/10 bg-gradient-to-br ${s.color} p-6 text-center`}>
            <p className="text-4xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs font-mono text-muted-foreground mt-2">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
