import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Workflow, Plus, Play, Pause, Trash2, ExternalLink, Clock, Zap, RefreshCw } from "lucide-react";

interface WorkspaceWorkflow {
  id: string;
  name: string;
  description: string | null;
  provider: string;
  webhook_url: string | null;
  status: string;
  agent_id: string | null;
  last_run_at: string | null;
  run_count: number;
}

interface Props {
  buildingId: string;
  workflows: WorkspaceWorkflow[];
  agentNames: Record<string, string>;
  onAdd: (wf: { name: string; description: string; provider: string; webhook_url: string }) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string, status: string) => void;
  onTrigger: (id: string) => void;
}

const PROVIDERS = [
  { id: "n8n", name: "n8n", emoji: "🔧" },
  { id: "zapier", name: "Zapier", emoji: "⚡" },
  { id: "make", name: "Make", emoji: "🔄" },
  { id: "custom", name: "Custom Webhook", emoji: "🌐" },
];

export function WorkflowManager({ workflows, agentNames, onAdd, onRemove, onToggle, onTrigger }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", provider: "n8n", webhook_url: "" });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    onAdd(form);
    setForm({ name: "", description: "", provider: "n8n", webhook_url: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Workflow className="w-4 h-4 text-primary" />
          Workflows ({workflows.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors">
          <Plus className="w-3 h-3" />
          Novo Workflow
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do workflow..." className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary" />
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição..." className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary" />
            <div className="flex gap-2">
              {PROVIDERS.map(p => (
                <button key={p.id} onClick={() => setForm(f => ({ ...f, provider: p.id }))} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${form.provider === p.id ? "border-primary bg-primary/10 text-primary" : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"}`}>
                  <span>{p.emoji}</span>{p.name}
                </button>
              ))}
            </div>
            <input value={form.webhook_url} onChange={e => setForm(f => ({ ...f, webhook_url: e.target.value }))} placeholder="Webhook URL..." className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary" />
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">Criar Workflow</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 text-xs hover:text-white transition-colors">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {workflows.length === 0 && !showForm && (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Workflow className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Nenhum workflow configurado
          </div>
        )}
        {workflows.map(wf => {
          const provider = PROVIDERS.find(p => p.id === wf.provider);
          const isActive = wf.status === "active";
          return (
            <motion.div key={wf.id} layout className={`p-3 rounded-xl border transition-colors ${isActive ? "border-blue-500/30 bg-blue-500/5" : "border-gray-700 bg-gray-800/50"}`}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{provider?.emoji || "🔧"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{wf.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {provider?.name} • {wf.run_count} execuções
                    {wf.agent_id && agentNames[wf.agent_id] && ` • ${agentNames[wf.agent_id]}`}
                  </p>
                </div>
                <button onClick={() => onTrigger(wf.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Executar">
                  <Play className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onToggle(wf.id, isActive ? "inactive" : "active")} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                  {isActive ? <Pause className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => onRemove(wf.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {wf.last_run_at && (
                <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1 ml-8">
                  <Clock className="w-3 h-3" />
                  Última execução: {new Date(wf.last_run_at).toLocaleString("pt-BR")}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
