import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, Bot, Workflow, BookOpen, Zap, Activity, Clock, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";

interface DashboardProps {
  agentCount: number;
  activeAgents: number;
  workflowCount: number;
  activeWorkflows: number;
  promptCount: number;
  totalPromptUsage: number;
  taskCount: number;
  completedTasks: number;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    agent_name?: string;
    created_at: string;
  }>;
}

export function AgentDashboard({
  agentCount, activeAgents, workflowCount, activeWorkflows,
  promptCount, totalPromptUsage, taskCount, completedTasks, recentTasks
}: DashboardProps) {
  const stats = [
    { label: "Agentes", value: agentCount, active: activeAgents, icon: Bot, color: "text-violet-400", bg: "bg-violet-400/10" },
    { label: "Workflows", value: workflowCount, active: activeWorkflows, icon: Workflow, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Prompts", value: promptCount, active: totalPromptUsage, icon: BookOpen, color: "text-amber-400", bg: "bg-amber-400/10", activeLabel: "usos" },
    { label: "Tarefas", value: taskCount, active: completedTasks, icon: Zap, color: "text-emerald-400", bg: "bg-emerald-400/10", activeLabel: "concluídas" },
  ];

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        Dashboard do Workspace
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-gray-800/50 border border-gray-700 rounded-xl p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <span className="text-[10px] text-gray-400">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-500">
                {stat.active} {stat.activeLabel || "ativos"}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Activity Indicator */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-white">Atividade Recente</h4>
        </div>
        <div className="space-y-2">
          {recentTasks.length === 0 ? (
            <p className="text-center text-gray-500 text-xs py-4">Nenhuma atividade recente</p>
          ) : (
            recentTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-2 py-1.5">
                {task.status === "completed" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : task.status === "failed" ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{task.title}</p>
                  <p className="text-[10px] text-gray-500">
                    {task.agent_name && `${task.agent_name} • `}
                    {new Date(task.created_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  task.status === "completed" ? "bg-emerald-400/10 text-emerald-400" :
                  task.status === "failed" ? "bg-red-400/10 text-red-400" :
                  "bg-amber-400/10 text-amber-400"
                }`}>
                  {task.status === "completed" ? "Concluído" : task.status === "failed" ? "Falhou" : "Pendente"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
