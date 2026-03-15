import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Bot, Megaphone, DollarSign, Calculator, Settings, MoreVertical, Zap } from "lucide-react";

interface TeamAgent {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  status: "active" | "training" | "idle";
  tasks: number;
  accuracy: number;
}

const MOCK_TEAM_AGENTS: TeamAgent[] = [
  { id: "ta1", name: "MarketBot", role: "Marketing", icon: "📢", color: "#f472b6", status: "active", tasks: 47, accuracy: 92 },
  { id: "ta2", name: "SalesForce AI", role: "Sales", icon: "💰", color: "#34d399", status: "active", tasks: 63, accuracy: 88 },
  { id: "ta3", name: "FinanceGPT", role: "Finance", icon: "📊", color: "#60a5fa", status: "training", tasks: 12, accuracy: 95 },
  { id: "ta4", name: "OpsAgent", role: "Operations", icon: "⚙️", color: "#fbbf24", status: "idle", tasks: 31, accuracy: 90 },
];

const TEMPLATES = [
  { role: "Marketing", icon: "📢", desc: "Content, campaigns, social media" },
  { role: "Sales", icon: "💰", desc: "Lead qualification, outreach, CRM" },
  { role: "Finance", icon: "📊", desc: "Reports, forecasting, compliance" },
  { role: "Operations", icon: "⚙️", desc: "Process automation, logistics" },
  { role: "HR", icon: "👥", desc: "Recruiting, onboarding, policies" },
  { role: "Support", icon: "🎧", desc: "Customer service, ticketing" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function TeamAgents({ isOpen, onClose }: Props) {
  const [agents, setAgents] = useState(MOCK_TEAM_AGENTS);
  const [showTemplates, setShowTemplates] = useState(false);

  const mainColor = "#6b8fc4";

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        className="w-[520px] max-h-[80vh] rounded-xl border overflow-hidden flex flex-col"
        style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.98)" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4" style={{ color: mainColor }} />
            <span className="text-xs font-mono font-bold tracking-wider text-white">TEAM AGENTS</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${mainColor}15`, color: mainColor }}>
              {agents.length} agents
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono tracking-wider"
              style={{ backgroundColor: `${mainColor}15`, color: mainColor }}
            >
              <Plus className="w-3 h-3" /> NEW
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>

        {showTemplates && (
          <div className="px-4 py-3 border-b" style={{ borderColor: `${mainColor}10` }}>
            <p className="text-[9px] font-mono tracking-wider mb-2" style={{ color: `${mainColor}50` }}>CREATE FROM TEMPLATE</p>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.role}
                  onClick={() => {
                    setAgents(prev => [...prev, {
                      id: `ta-${Date.now()}`,
                      name: `${t.role} Agent`,
                      role: t.role,
                      icon: t.icon,
                      color: mainColor,
                      status: "training" as const,
                      tasks: 0,
                      accuracy: 0,
                    }]);
                    setShowTemplates(false);
                  }}
                  className="p-2.5 rounded-lg border text-center transition-all hover:bg-white/5"
                  style={{ borderColor: `${mainColor}15` }}
                >
                  <span className="text-xl">{t.icon}</span>
                  <p className="text-[10px] font-mono font-bold text-white mt-1">{t.role}</p>
                  <p className="text-[8px] font-mono" style={{ color: `${mainColor}50` }}>{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {agents.map(agent => (
            <div key={agent.id} className="rounded-lg border p-4" style={{ borderColor: `${mainColor}15`, background: `${mainColor}05` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{agent.icon}</span>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white">{agent.name}</h4>
                    <p className="text-[9px] font-mono" style={{ color: `${mainColor}60` }}>{agent.role} Department</p>
                  </div>
                </div>
                <span className="text-[8px] font-mono px-2 py-0.5 rounded" style={{
                  backgroundColor: agent.status === "active" ? "#34d39915" : agent.status === "training" ? "#fbbf2415" : "rgba(255,255,255,0.05)",
                  color: agent.status === "active" ? "#34d399" : agent.status === "training" ? "#fbbf24" : "#6b7280",
                }}>
                  {agent.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded text-center" style={{ backgroundColor: `${mainColor}08` }}>
                  <p className="text-sm font-mono font-bold text-white">{agent.tasks}</p>
                  <p className="text-[8px] font-mono" style={{ color: `${mainColor}50` }}>TASKS</p>
                </div>
                <div className="p-2 rounded text-center" style={{ backgroundColor: `${mainColor}08` }}>
                  <p className="text-sm font-mono font-bold text-white">{agent.accuracy}%</p>
                  <p className="text-[8px] font-mono" style={{ color: `${mainColor}50` }}>ACCURACY</p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button className="flex-1 py-1.5 rounded text-[9px] font-mono tracking-wider" style={{ backgroundColor: `${mainColor}10`, color: mainColor }}>
                  <Zap className="w-3 h-3 inline mr-1" />TRAIN
                </button>
                <button className="flex-1 py-1.5 rounded text-[9px] font-mono tracking-wider bg-white/5 text-gray-400">
                  <Settings className="w-3 h-3 inline mr-1" />CONFIG
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
