import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, ArrowRight, CheckCircle2, Clock, Loader2, AlertCircle, Send, Users } from "lucide-react";
import type { Agent } from "@/types/agent";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  status: "pending" | "in_progress" | "completed" | "delegated";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: Date;
  completedAt?: Date;
  delegatedTo?: string;
  dbId?: string; // Supabase row id
}

const STATUS_CONFIG = {
  pending: { icon: Clock, label: "Pendente", color: "text-muted-foreground", bg: "bg-muted/30" },
  in_progress: { icon: Loader2, label: "Em Progresso", color: "text-primary", bg: "bg-primary/10" },
  completed: { icon: CheckCircle2, label: "Concluído", color: "text-accent", bg: "bg-accent/10" },
  delegated: { icon: ArrowRight, label: "Delegado", color: "text-amber-400", bg: "bg-amber-400/10" },
};

const PRIORITY_COLORS = {
  low: "bg-muted/50 text-muted-foreground",
  medium: "bg-primary/15 text-primary",
  high: "bg-amber-400/15 text-amber-400",
  critical: "bg-destructive/15 text-destructive",
};

interface TaskBoardProps {
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
}

export function TaskBoard({ agents, isOpen, onClose }: TaskBoardProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | AgentTask["status"]>("all");
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newPriority, setNewPriority] = useState<AgentTask["priority"]>("medium");

  // Load tasks from DB
  useEffect(() => {
    if (!isOpen || !user) return;
    const spaceId = localStorage.getItem("currentSpaceId") || "";

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("workspace_tasks")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        const mapped: AgentTask[] = data.map(t => ({
          id: t.id,
          dbId: t.id,
          title: t.title,
          description: t.result || "",
          assignedTo: t.agent_id ? agents.find(a => a.id === t.agent_id)?.name || "Agente" : "Chefe",
          assignedBy: "Chefe",
          status: (t.status === "done" ? "completed" : t.status) as AgentTask["status"],
          priority: "medium" as const,
          createdAt: new Date(t.created_at),
          completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
        }));
        setTasks(mapped);
      } else {
        // Generate demo tasks from agents if DB is empty
        setTasks(generateDemoTasks(agents));
      }
      setLoading(false);
    }
    load();
  }, [isOpen, user]);

  const addTask = async () => {
    if (!newTitle.trim() || !user) return;
    const spaceId = localStorage.getItem("currentSpaceId") || "default";

    const { data, error } = await supabase
      .from("workspace_tasks")
      .insert({
        title: newTitle.trim(),
        result: newDesc.trim() || null,
        user_id: user.id,
        building_id: spaceId,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao criar tarefa", { description: error.message });
      return;
    }

    const task: AgentTask = {
      id: data.id,
      dbId: data.id,
      title: data.title,
      description: data.result || "",
      assignedTo: newAssignee || "Chefe",
      assignedBy: "Chefe",
      status: "pending",
      priority: newPriority,
      createdAt: new Date(data.created_at),
    };
    setTasks(prev => [task, ...prev]);
    setNewTitle("");
    setNewDesc("");
    setShowNewTask(false);
    toast.success("Tarefa criada");
  };

  const updateStatus = async (taskId: string, status: AgentTask["status"]) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Update in DB if it has a dbId
    if (task.dbId && user) {
      const dbStatus = status === "completed" ? "done" : status;
      await supabase
        .from("workspace_tasks")
        .update({
          status: dbStatus,
          completed_at: status === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", task.dbId)
        .eq("user_id", user.id);
    }

    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status, completedAt: status === "completed" ? new Date() : undefined }
          : t
      )
    );
  };

  const delegateTask = (taskId: string, toAgent: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId ? { ...t, status: "delegated" as const, delegatedTo: toAgent } : t
      )
    );
  };

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
    delegated: tasks.filter(t => t.status === "delegated").length,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden border border-border max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-lg">Task Engine</h2>
                  <p className="text-[11px] text-muted-foreground">Gerencie e delegue tarefas entre agentes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewTask(!showNewTask)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-xs font-medium hover:bg-primary/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nova Tarefa
                </button>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* New task form */}
            <AnimatePresence>
              {showNewTask && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-b border-border/30 overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="Título da tarefa..."
                      className="w-full text-sm bg-muted/30 rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <textarea
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      placeholder="Descrição..."
                      rows={2}
                      className="w-full text-xs bg-muted/30 rounded-xl px-4 py-2.5 text-foreground placeholder:text-muted-foreground border-0 outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                    />
                    <div className="flex gap-3 items-center">
                      <select
                        value={newAssignee}
                        onChange={e => setNewAssignee(e.target.value)}
                        className="text-xs bg-muted/30 rounded-xl px-3 py-2 text-foreground border-0 outline-none"
                      >
                        <option value="">Atribuir a...</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.name}>{a.name} - {a.role}</option>
                        ))}
                      </select>
                      <select
                        value={newPriority}
                        onChange={e => setNewPriority(e.target.value as AgentTask["priority"])}
                        className="text-xs bg-muted/30 rounded-xl px-3 py-2 text-foreground border-0 outline-none"
                      >
                        <option value="low">🟢 Baixa</option>
                        <option value="medium">🔵 Média</option>
                        <option value="high">🟠 Alta</option>
                        <option value="critical">🔴 Crítica</option>
                      </select>
                      <button
                        onClick={addTask}
                        disabled={!newTitle.trim()}
                        className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Criar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status filters */}
            <div className="px-6 py-3 border-b border-border/30 flex gap-1.5 overflow-x-auto">
              {(["all", "pending", "in_progress", "completed", "delegated"] as const).map(s => {
                const cfg = s === "all" ? null : STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                      filter === s
                        ? "bg-primary/20 text-primary"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {s === "all" ? "Todas" : cfg?.label}
                    <span className="text-[9px] opacity-60">({counts[s]})</span>
                  </button>
                );
              })}
            </div>

            {/* Tasks list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Nenhuma tarefa encontrada
                </div>
              ) : (
                filtered.map((task, i) => {
                  const cfg = STATUS_CONFIG[task.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <motion.div
                      key={task.id}
                      initial={i < 5 ? { opacity: 0, y: 5 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl border border-border/20 hover:border-border/40 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg ${cfg.bg}`}>
                          <StatusIcon className={`w-4 h-4 ${cfg.color} ${task.status === "in_progress" ? "animate-spin" : ""}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-foreground">{task.title}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-[10px] text-muted-foreground mb-1.5">{task.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="text-muted-foreground">👤 {task.assignedTo}</span>
                            <span className="text-muted-foreground/60">por {task.assignedBy}</span>
                            {task.delegatedTo && (
                              <span className="text-amber-400">→ {task.delegatedTo}</span>
                            )}
                            <span className="text-muted-foreground/40 ml-auto">
                              {task.createdAt.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {task.status === "pending" && (
                            <button
                              onClick={() => updateStatus(task.id, "in_progress")}
                              className="p-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
                              title="Iniciar"
                            >
                              <Loader2 className="w-3 h-3 text-primary" />
                            </button>
                          )}
                          {(task.status === "pending" || task.status === "in_progress") && (
                            <>
                              <button
                                onClick={() => updateStatus(task.id, "completed")}
                                className="p-1 rounded bg-accent/10 hover:bg-accent/20 transition-colors"
                                title="Concluir"
                              >
                                <CheckCircle2 className="w-3 h-3 text-accent" />
                              </button>
                              <button
                                onClick={() => {
                                  const otherAgent = agents.find(a => a.name !== task.assignedTo);
                                  if (otherAgent) delegateTask(task.id, otherAgent.name);
                                }}
                                className="p-1 rounded bg-amber-400/10 hover:bg-amber-400/20 transition-colors"
                                title="Delegar"
                              >
                                <Users className="w-3 h-3 text-amber-400" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Fallback demo tasks when DB is empty
function generateDemoTasks(agents: Agent[]): AgentTask[] {
  const templates = [
    { title: "Analisar dados de sentimento", desc: "Processar dados e extrair insights", priority: "high" as const },
    { title: "Escrever relatório semanal", desc: "Compilar atividades e progressos", priority: "medium" as const },
    { title: "Otimizar pipeline de deploy", desc: "Reduzir tempo de build em 30%", priority: "critical" as const },
    { title: "Criar dashboard de métricas", desc: "Visualização em tempo real dos KPIs", priority: "high" as const },
    { title: "Compor trilha para o escritório", desc: "Música ambiente lo-fi", priority: "low" as const },
  ];
  return templates.map((t, i) => {
    const agent = agents[i % agents.length];
    const statuses: AgentTask["status"][] = ["pending", "in_progress", "completed", "delegated"];
    return {
      id: `demo-task-${i}`,
      title: t.title,
      description: t.desc,
      assignedTo: agent?.name || "Agente",
      assignedBy: "Chefe",
      status: statuses[i % 4],
      priority: t.priority,
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 5),
      completedAt: i % 4 === 2 ? new Date() : undefined,
    };
  });
}
