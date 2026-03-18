import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DbLogEntry {
  id: string;
  agent_name: string;
  action_type: string;
  description: string;
  created_at: string;
  metadata: any;
}

const typeDots: Record<string, string> = {
  heartbeat: "#6366F1",
  creation: "#10B981",
  movement: "#F59E0B",
  error: "#EF4444",
};

interface ActivityLogProps {
  logs?: any[];
  isOpen: boolean;
  onToggle: () => void;
}

export function ActivityLog({ isOpen, onToggle }: ActivityLogProps) {
  const [dbLogs, setDbLogs] = useState<DbLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    supabase
      .from("agent_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setDbLogs(data || []);
        setLoading(false);
      });

    // Subscribe to realtime updates
    const channel = supabase
      .channel("activity-log-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_activity_log" }, (payload) => {
        setDbLogs(prev => [payload.new as DbLogEntry, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen]);

  return (
    <div className="absolute left-3 top-16 bottom-16 z-20 flex items-start">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="glass-panel rounded-2xl w-72 max-h-full flex flex-col overflow-hidden shadow-lg"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/10">
              <Activity className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-display font-semibold text-foreground">
                Atividade em Tempo Real
              </h3>
              <span className="ml-auto text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">
                LIVE
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : dbLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-[11px]">
                  Nenhuma atividade registrada ainda.
                </div>
              ) : (
                dbLogs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={i === 0 ? { opacity: 0, y: -8 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: typeDots[log.action_type] || "#6366F1" }}
                      />
                      <span className="text-xs font-semibold text-foreground">
                        {log.agent_name}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(log.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 pl-4">
                      {log.description}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onToggle}
        className="glass-panel rounded-r-xl p-2 hover:bg-muted/30 transition-colors"
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4 text-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-foreground" />
        )}
      </button>
    </div>
  );
}
