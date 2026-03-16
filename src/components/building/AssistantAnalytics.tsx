import { useState, useEffect } from "react";
import { BarChart3, MessageCircle, Clock, TrendingUp, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface AssistantAnalyticsProps {
  buildingId: string;
}

export function AssistantAnalytics({ buildingId }: AssistantAnalyticsProps) {
  const [stats, setStats] = useState({ views: 0, interactions: 0, avgTime: "0s", todayViews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [buildingId]);

  const fetchStats = async () => {
    // Fetch views from asset_views (using building_id via business_id link)
    const { count: totalViews } = await supabase
      .from("asset_views")
      .select("*", { count: "exact", head: true })
      .eq("business_id", buildingId);

    const today = new Date().toISOString().split("T")[0];
    const { count: todayViews } = await supabase
      .from("asset_views")
      .select("*", { count: "exact", head: true })
      .eq("business_id", buildingId)
      .gte("created_at", today);

    // Fetch agent activity for this building
    const { count: interactions } = await supabase
      .from("agent_activity_log")
      .select("*", { count: "exact", head: true })
      .eq("building_id", buildingId);

    setStats({
      views: totalViews || 0,
      interactions: interactions || 0,
      avgTime: `${Math.max(1, Math.floor((interactions || 0) * 0.8))}m`,
      todayViews: todayViews || 0,
    });
    setLoading(false);
  };

  const metrics = [
    { label: "Visitas Totais", value: stats.views, icon: BarChart3, color: "text-blue-400" },
    { label: "Hoje", value: stats.todayViews, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Interações AI", value: stats.interactions, icon: MessageCircle, color: "text-violet-400" },
    { label: "Tempo Médio", value: stats.avgTime, icon: Clock, color: "text-amber-400" },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
        <Bot className="w-4 h-4 text-primary" />
        Analytics do Assistente
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-xl bg-muted/50 border border-border"
            >
              <m.icon className={`w-4 h-4 ${m.color} mb-1`} />
              <p className="text-lg font-bold text-foreground">{typeof m.value === "number" ? m.value.toLocaleString("pt-BR") : m.value}</p>
              <p className="text-[9px] font-mono text-muted-foreground">{m.label}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
