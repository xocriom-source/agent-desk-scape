import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";

interface LogEntry {
  id: string;
  agentName: string;
  agentColor: string;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

interface ActivityLogProps {
  logs: LogEntry[];
  isOpen: boolean;
  onToggle: () => void;
}

const typeDots: Record<string, string> = {
  info: "bg-primary",
  success: "bg-accent",
  warning: "bg-agent-idle",
  error: "bg-destructive",
};

export function ActivityLog({ logs, isOpen, onToggle }: ActivityLogProps) {
  return (
    <div className="absolute left-3 top-16 bottom-16 z-20 flex items-start">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="glass-panel rounded-2xl w-72 max-h-full flex flex-col overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/10">
              <Activity className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-display font-semibold text-card-foreground">
                Atividade em Tempo Real
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {logs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={i === 0 ? { opacity: 0, y: -10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: log.agentColor }}
                    />
                    <span className="text-xs font-semibold text-foreground">
                      {log.agentName}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {log.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 pl-4">
                    {log.message}
                  </p>
                </motion.div>
              ))}
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
