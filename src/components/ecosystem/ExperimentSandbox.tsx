import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Plus, Play, Pause, Trash2, Eye, Activity } from "lucide-react";

interface SandboxAgent {
  id: string;
  name: string;
  type: string;
  status: "running" | "paused" | "stopped";
  actions: number;
  interactions: number;
  startedAt: string;
}

const INITIAL_AGENTS: SandboxAgent[] = [
  { id: "sb1", name: "Experiment-Alpha", type: "explorer", status: "running", actions: 145, interactions: 23, startedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "sb2", name: "Experiment-Beta", type: "creator", status: "paused", actions: 67, interactions: 12, startedAt: new Date(Date.now() - 7200000).toISOString() },
];

export function ExperimentSandbox() {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "explorer" });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    setAgents(prev => [...prev, {
      id: `sb-${Date.now()}`, name: form.name, type: form.type,
      status: "running", actions: 0, interactions: 0, startedAt: new Date().toISOString()
    }]);
    setForm({ name: "", type: "explorer" });
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-white">Sandbox de Experimentos</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          Novo Experimento
        </button>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-3">
        <p className="text-[10px] text-gray-500">🧪 O sandbox permite testar agentes experimentais em um ambiente isolado, sem afetar workflows de produção. Monitore comportamento e interações em tempo real.</p>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do experimento..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary">
              <option value="explorer">🗺️ Explorer</option>
              <option value="creator">🎨 Creator</option>
              <option value="analyst">📊 Analyst</option>
              <option value="collaborator">🤝 Collaborator</option>
            </select>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">Deploy no Sandbox</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 text-xs hover:text-white transition-colors">Cancelar</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {agents.map((agent, i) => (
          <motion.div key={agent.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`bg-gray-900 border rounded-xl p-4 ${agent.status === "running" ? "border-emerald-500/30" : "border-gray-800"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${agent.status === "running" ? "bg-emerald-400 animate-pulse" : agent.status === "paused" ? "bg-amber-400" : "bg-gray-500"}`} />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{agent.name}</p>
                <p className="text-[10px] text-gray-500">{agent.type} • {agent.actions} ações • {agent.interactions} interações</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: a.status === "running" ? "paused" : "running" } : a))} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                  {agent.status === "running" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => setAgents(prev => prev.filter(a => a.id !== agent.id))} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
