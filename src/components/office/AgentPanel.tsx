import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Clock, ListTodo } from "lucide-react";
import type { Agent } from "@/types/agent";

const statusLabels: Record<string, string> = {
  active: "Ativo",
  idle: "Ocioso",
  thinking: "Pensando...",
};

const statusBadgeClasses: Record<string, string> = {
  active: "bg-accent/20 text-accent",
  idle: "bg-agent-idle/20 text-agent-idle",
  thinking: "bg-agent-thinking/20 text-agent-thinking",
};

interface AgentPanelProps {
  agent: Agent | null;
  onClose: () => void;
}

export function AgentPanel({ agent, onClose }: AgentPanelProps) {
  return (
    <AnimatePresence>
      {agent && (
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
          transition={{ duration: 0.2 }}
          className="absolute right-4 top-20 bottom-20 z-30 w-80"
        >
          <div className="glass-panel rounded-xl h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-lg">
                  {["🎧", "🔬", "💻", "📊", "🎨", "📞"][agent.avatar]}
                </div>
                <div>
                  <h3 className="font-display font-bold text-primary-foreground text-sm">
                    {agent.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{agent.role}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-card/20 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Status */}
            <div className="px-4 py-3 border-b border-border/20">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Status</span>
                <span
                  className={`ml-auto text-[11px] px-2 py-0.5 rounded-full font-medium ${statusBadgeClasses[agent.status]}`}
                >
                  {statusLabels[agent.status]}
                </span>
              </div>
            </div>

            {/* Current Task */}
            {agent.currentTask && (
              <div className="px-4 py-3 border-b border-border/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-display font-semibold text-primary-foreground">
                    Tarefa Atual
                  </span>
                </div>
                <p className="text-xs text-muted-foreground bg-card/10 px-3 py-2 rounded-lg">
                  {agent.currentTask}
                </p>
              </div>
            )}

            {/* Tasks */}
            <div className="px-4 py-3 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <ListTodo className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-display font-semibold text-primary-foreground">
                  Tarefas
                </span>
              </div>
              <div className="space-y-1.5">
                {agent.tasks.map((task, i) => (
                  <div
                    key={i}
                    className="text-xs text-muted-foreground bg-card/10 px-3 py-2 rounded-lg flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                    {task}
                  </div>
                ))}
              </div>
            </div>

            {/* Logs */}
            <div className="px-4 py-3 border-t border-border/20 max-h-40 overflow-y-auto">
              <span className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">
                Logs recentes
              </span>
              <div className="mt-2 space-y-1">
                {agent.logs.map((log) => (
                  <div key={log.id} className="text-[11px] text-muted-foreground/70">
                    <span className="text-muted-foreground/50">
                      {log.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>{" "}
                    {log.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
