import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Clock, ListTodo, Terminal, Play, Pause } from "lucide-react";
import type { Agent } from "@/types/agent";

const statusLabels: Record<string, string> = {
  active: "Ativo",
  idle: "Ocioso",
  thinking: "Pensando...",
};

const statusConfig: Record<string, { bg: string; text: string; icon: typeof Play }> = {
  active: { bg: "bg-accent/15", text: "text-accent", icon: Play },
  idle: { bg: "bg-agent-idle/15", text: "text-agent-idle", icon: Pause },
  thinking: { bg: "bg-primary/15", text: "text-primary", icon: Zap },
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
          className="absolute right-3 top-16 bottom-16 z-30 w-80"
        >
          <div className="glass-panel rounded-2xl h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: agent.color }}
                >
                  <span className="text-lg">
                    {["🔬", "✍️", "💻", "📊", "🎨", "📞"][agent.avatar]}
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground text-sm">
                    {agent.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{agent.role}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Status */}
            <div className="px-4 py-3 border-b border-border/10">
              <div className="flex items-center gap-2">
                {(() => {
                  const cfg = statusConfig[agent.status];
                  const Icon = cfg.icon;
                  return (
                    <>
                      <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                      <span className="text-xs text-muted-foreground">Status</span>
                      <span
                        className={`ml-auto text-[11px] px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.text}`}
                      >
                        {statusLabels[agent.status]}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Current Task */}
            {agent.currentTask && (
              <div className="px-4 py-3 border-b border-border/10">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-display font-semibold text-foreground">
                    Tarefa Atual
                  </span>
                </div>
                <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2.5 rounded-xl">
                  {agent.currentTask}
                </p>
              </div>
            )}

            {/* Tasks */}
            <div className="px-4 py-3 flex-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <ListTodo className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-display font-semibold text-foreground">
                  Fila de Tarefas
                </span>
              </div>
              <div className="space-y-1.5">
                {agent.tasks.map((task, i) => (
                  <div
                    key={i}
                    className="text-xs text-muted-foreground bg-muted/30 px-3 py-2.5 rounded-xl flex items-center gap-2"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: agent.color }}
                    />
                    {task}
                  </div>
                ))}
              </div>
            </div>

            {/* Logs */}
            <div className="px-4 py-3 border-t border-border/10 max-h-44 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">
                  Logs
                </span>
              </div>
              <div className="space-y-1 font-mono">
                {agent.logs.map((log) => (
                  <div key={log.id} className="text-[10px] text-muted-foreground/70">
                    <span className="text-muted-foreground/40">
                      [{log.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}]
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
