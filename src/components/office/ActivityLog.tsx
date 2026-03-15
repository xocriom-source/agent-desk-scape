import { motion, AnimatePresence } from "framer-motion";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";

interface LogEntry {
  id: string;
  agentName: string;
  timestamp: Date;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

interface ActivityLogProps {
  logs: LogEntry[];
  isOpen: boolean;
  onToggle: () => void;
}

const typeColors: Record<string, string> = {
  info: "text-primary",
  success: "text-accent",
  warning: "text-agent-idle",
  error: "text-destructive",
};

export function ActivityLog({ logs, isOpen, onToggle }: ActivityLogProps) {
  return (
    <div className="absolute left-4 top-20 bottom-20 z-20 flex items-start">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="glass-panel rounded-xl w-72 max-h-full flex flex-col overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/20">
              <Activity className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-display font-semibold text-primary-foreground">
                Atividade
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="px-3 py-2 rounded-lg hover:bg-card/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${typeColors[log.type]}`}>
                      {log.agentName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {log.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 mt-0.5">
                    {log.message}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onToggle}
        className="glass-panel rounded-r-lg p-2 hover:bg-card/20 transition-colors ml-0"
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4 text-primary-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-primary-foreground" />
        )}
      </button>
    </div>
  );
}
