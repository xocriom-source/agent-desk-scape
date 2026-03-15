import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Bot, Workflow, BookOpen, Zap, MessageCircle, BarChart3,
  Cpu, ChevronRight
} from "lucide-react";
import { AgentConnectionPanel } from "./AgentConnectionPanel";
import { WorkflowManager } from "./WorkflowManager";
import { PromptLibrary } from "./PromptLibrary";
import { SkillSystem } from "./SkillSystem";
import { MessengerControl } from "./MessengerControl";
import { AgentDashboard } from "./AgentDashboard";

// Mock data for demo (will be replaced with Supabase queries when auth is implemented)
const MOCK_AGENTS = [
  { id: "a1", name: "Assistente GPT", agent_type: "openai", model: "gpt-4o", status: "active", skills: ["s1", "s4"] },
  { id: "a2", name: "Pesquisador Claude", agent_type: "claude", model: "claude-3.5-sonnet", status: "active", skills: ["s3", "s6"] },
];

const MOCK_WORKFLOWS = [
  { id: "w1", name: "Lead Qualification", description: "Qualifica leads recebidos", provider: "n8n", webhook_url: "https://n8n.example.com/webhook/123", status: "active", agent_id: "a1", last_run_at: new Date().toISOString(), run_count: 47 },
  { id: "w2", name: "Content Pipeline", description: "Pipeline de geração de conteúdo", provider: "make", webhook_url: null, status: "inactive", agent_id: "a2", last_run_at: null, run_count: 0 },
];

const MOCK_PROMPTS = [
  { id: "p1", title: "Análise de Competidores", content: "Analise os 5 principais competidores de {empresa} no mercado {mercado}. Para cada um, liste:\n1. Pontos fortes\n2. Pontos fracos\n3. Diferencial\n4. Preço estimado", category: "research", tags: ["competidores", "análise"], version: 3, is_public: true, usage_count: 23 },
  { id: "p2", title: "Email de Follow-up", content: "Escreva um email de follow-up profissional para {nome} sobre {assunto}. Tom: {tom}. Inclua CTA claro.", category: "sales", tags: ["email", "vendas"], version: 1, is_public: false, usage_count: 12 },
  { id: "p3", title: "Post para LinkedIn", content: "Crie um post para LinkedIn sobre {tema}. Formato: gancho forte, 3 insights, CTA. Máximo 1300 caracteres.", category: "marketing", tags: ["linkedin", "social"], version: 2, is_public: true, usage_count: 45 },
];

const MOCK_SKILLS = [
  { id: "s1", name: "Lead Analysis", description: "Analyze and qualify leads", category: "sales", icon: "🎯", is_system: true },
  { id: "s2", name: "Content Generation", description: "Generate marketing content", category: "marketing", icon: "✍️", is_system: true },
  { id: "s3", name: "Research", description: "Deep research on topics", category: "research", icon: "🔍", is_system: true },
  { id: "s4", name: "Email Drafting", description: "Compose professional emails", category: "communication", icon: "📧", is_system: true },
  { id: "s5", name: "Code Review", description: "Review and improve code", category: "development", icon: "💻", is_system: true },
  { id: "s6", name: "Data Analysis", description: "Analyze datasets", category: "analytics", icon: "📊", is_system: true },
  { id: "s7", name: "Translation", description: "Translate between languages", category: "communication", icon: "🌐", is_system: true },
  { id: "s8", name: "Summarization", description: "Summarize documents", category: "productivity", icon: "📋", is_system: true },
];

const MOCK_MESSENGERS = [
  { id: "m1", platform: "telegram", bot_token_configured: true, status: "connected", agent_id: "a1" },
];

const MOCK_TASKS = [
  { id: "t1", title: "Qualificação de 15 leads", status: "completed", agent_name: "Assistente GPT", created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: "t2", title: "Pesquisa de mercado SaaS", status: "pending", agent_name: "Pesquisador Claude", created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: "t3", title: "Geração de 5 posts", status: "completed", agent_name: "Assistente GPT", created_at: new Date(Date.now() - 7200000).toISOString() },
];

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "agents", label: "Agentes", icon: Bot },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "prompts", label: "Prompts", icon: BookOpen },
  { id: "skills", label: "Skills", icon: Zap },
  { id: "messengers", label: "Mensageiros", icon: MessageCircle },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  buildingId: string;
  buildingName: string;
}

export function AgentWorkspaceHub({ isOpen, onClose, buildingId, buildingName }: Props) {
  const [tab, setTab] = useState("dashboard");
  const [agents, setAgents] = useState(MOCK_AGENTS);
  const [workflows, setWorkflows] = useState(MOCK_WORKFLOWS);
  const [prompts, setPrompts] = useState(MOCK_PROMPTS);
  const [messengers, setMessengers] = useState(MOCK_MESSENGERS);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(agents[0]?.id || null);

  const agentNames = useMemo(() => {
    const map: Record<string, string> = {};
    agents.forEach(a => { map[a.id] = a.name; });
    return map;
  }, [agents]);

  const selectedAgentSkills = useMemo(() => {
    return agents.find(a => a.id === selectedAgent)?.skills || [];
  }, [agents, selectedAgent]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-5xl max-h-[85vh] flex overflow-hidden shadow-2xl"
        >
          {/* Sidebar */}
          <div className="w-56 bg-gray-900/50 border-r border-gray-800 p-3 flex flex-col shrink-0">
            <div className="flex items-center gap-2 px-2 py-3 mb-2">
              <Cpu className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs font-bold text-white">Agent Workspace</p>
                <p className="text-[10px] text-gray-500 truncate">{buildingName}</p>
              </div>
            </div>

            <nav className="space-y-0.5 flex-1">
              {TABS.map(t => {
                const Icon = t.icon;
                const isActive = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                    {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                  </button>
                );
              })}
            </nav>

            {/* Agent Selector for Skills tab */}
            {tab === "skills" && agents.length > 0 && (
              <div className="border-t border-gray-800 pt-3 mt-3">
                <p className="text-[10px] text-gray-500 px-2 mb-1.5">Agente selecionado:</p>
                <select
                  value={selectedAgent || ""}
                  onChange={e => setSelectedAgent(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
                >
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
              <h2 className="text-sm font-bold text-white">
                {TABS.find(t => t.id === tab)?.label}
              </h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {tab === "dashboard" && (
                <AgentDashboard
                  agentCount={agents.length}
                  activeAgents={agents.filter(a => a.status === "active").length}
                  workflowCount={workflows.length}
                  activeWorkflows={workflows.filter(w => w.status === "active").length}
                  promptCount={prompts.length}
                  totalPromptUsage={prompts.reduce((s, p) => s + p.usage_count, 0)}
                  taskCount={MOCK_TASKS.length}
                  completedTasks={MOCK_TASKS.filter(t => t.status === "completed").length}
                  recentTasks={MOCK_TASKS}
                />
              )}

              {tab === "agents" && (
                <AgentConnectionPanel
                  buildingId={buildingId}
                  agents={agents}
                  onAddAgent={agent => setAgents(prev => [...prev, { ...agent, id: `a-${Date.now()}` }])}
                  onRemoveAgent={id => setAgents(prev => prev.filter(a => a.id !== id))}
                  onToggleAgent={(id, status) => setAgents(prev => prev.map(a => a.id === id ? { ...a, status } : a))}
                />
              )}

              {tab === "workflows" && (
                <WorkflowManager
                  buildingId={buildingId}
                  workflows={workflows}
                  agentNames={agentNames}
                  onAdd={wf => setWorkflows(prev => [...prev, { ...wf, id: `w-${Date.now()}`, status: "inactive", agent_id: null, last_run_at: null, run_count: 0 }])}
                  onRemove={id => setWorkflows(prev => prev.filter(w => w.id !== id))}
                  onToggle={(id, status) => setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status } : w))}
                  onTrigger={id => setWorkflows(prev => prev.map(w => w.id === id ? { ...w, run_count: w.run_count + 1, last_run_at: new Date().toISOString() } : w))}
                />
              )}

              {tab === "prompts" && (
                <PromptLibrary
                  prompts={prompts}
                  onAdd={p => setPrompts(prev => [...prev, { ...p, id: `p-${Date.now()}`, version: 1, usage_count: 0 }])}
                  onRemove={id => setPrompts(prev => prev.filter(p => p.id !== id))}
                  onUse={id => setPrompts(prev => prev.map(p => p.id === id ? { ...p, usage_count: p.usage_count + 1 } : p))}
                />
              )}

              {tab === "skills" && (
                <SkillSystem
                  skills={MOCK_SKILLS}
                  agentSkills={selectedAgentSkills}
                  onAttach={skillId => {
                    if (selectedAgent) {
                      setAgents(prev => prev.map(a =>
                        a.id === selectedAgent ? { ...a, skills: [...a.skills, skillId] } : a
                      ));
                    }
                  }}
                  onDetach={skillId => {
                    if (selectedAgent) {
                      setAgents(prev => prev.map(a =>
                        a.id === selectedAgent ? { ...a, skills: a.skills.filter(s => s !== skillId) } : a
                      ));
                    }
                  }}
                />
              )}

              {tab === "messengers" && (
                <MessengerControl
                  messengers={messengers}
                  agentNames={agentNames}
                  onAdd={platform => setMessengers(prev => [...prev, { id: `m-${Date.now()}`, platform, bot_token_configured: false, status: "disconnected", agent_id: null }])}
                  onRemove={id => setMessengers(prev => prev.filter(m => m.id !== id))}
                  onToggle={(id, status) => setMessengers(prev => prev.map(m => m.id === id ? { ...m, status } : m))}
                />
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
