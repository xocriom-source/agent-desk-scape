import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Plus, Settings2, Trash2, Power, PowerOff,
  Cpu, Brain, Sparkles, Globe, ChevronDown
} from "lucide-react";

const AGENT_TYPES = [
  { id: "openai", name: "OpenAI", icon: "🤖", models: ["gpt-4o", "gpt-4", "gpt-3.5-turbo", "o1-preview"] },
  { id: "claude", name: "Claude", icon: "🧠", models: ["claude-3.5-sonnet", "claude-3-opus", "claude-3-haiku"] },
  { id: "manus", name: "Manus", icon: "🦾", models: ["manus-agent-v1", "manus-coder-v1"] },
  { id: "opensource", name: "Open Source", icon: "🌐", models: ["llama-3.1-70b", "mixtral-8x7b", "deepseek-v2"] },
];

interface WorkspaceAgent {
  id: string;
  name: string;
  agent_type: string;
  model: string;
  status: string;
  skills: string[];
}

interface Props {
  buildingId: string;
  agents: WorkspaceAgent[];
  onAddAgent: (agent: Omit<WorkspaceAgent, "id">) => void;
  onRemoveAgent: (id: string) => void;
  onToggleAgent: (id: string, status: string) => void;
}

export function AgentConnectionPanel({ buildingId, agents, onAddAgent, onRemoveAgent, onToggleAgent }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("openai");
  const [model, setModel] = useState("gpt-4o");

  const selectedType = AGENT_TYPES.find(t => t.id === type)!;

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddAgent({ name, agent_type: type, model, status: "active", skills: [] });
    setName("");
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          Agentes Conectados ({agents.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Novo Agente
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800/50 rounded-xl p-4 space-y-3 border border-gray-700"
          >
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do agente..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary"
            />
            <div className="grid grid-cols-2 gap-2">
              {AGENT_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setType(t.id); setModel(t.models[0]); }}
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium transition-colors border ${
                    type === t.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.name}
                </button>
              ))}
            </div>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
            >
              {selectedType.models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">
                Conectar Agente
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-400 text-xs hover:text-white transition-colors">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {agents.length === 0 && !showForm && (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Nenhum agente conectado ainda
          </div>
        )}
        {agents.map(agent => {
          const typeInfo = AGENT_TYPES.find(t => t.id === agent.agent_type);
          const isActive = agent.status === "active";
          return (
            <motion.div
              key={agent.id}
              layout
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                isActive ? "border-emerald-500/30 bg-emerald-500/5" : "border-gray-700 bg-gray-800/50"
              }`}
            >
              <span className="text-lg">{typeInfo?.icon || "🤖"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                <p className="text-[10px] text-gray-400">{agent.model} • {agent.skills.length} skills</p>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-emerald-400/10 text-emerald-400" : "bg-gray-700 text-gray-400"}`}>
                {isActive ? "Ativo" : "Inativo"}
              </span>
              <button
                onClick={() => onToggleAgent(agent.id, isActive ? "inactive" : "active")}
                className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                {isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onRemoveAgent(agent.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
