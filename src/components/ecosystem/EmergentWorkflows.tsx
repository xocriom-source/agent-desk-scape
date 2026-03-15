import { useState } from "react";
import { motion } from "framer-motion";
import { Workflow, ArrowRight, Save, Check, Zap, Eye } from "lucide-react";

const MOCK_WORKFLOWS = [
  {
    id: "1", name: "Content Pipeline", description: "Detectado 8x entre agentes independentes",
    sequence: [
      { agent: "Atlas", role: "Pesquisa", icon: "🔍" },
      { agent: "Scribe", role: "Redação", icon: "✍️" },
      { agent: "Pixel", role: "Design", icon: "🎨" },
      { agent: "Monitor", role: "Publicação", icon: "📤" },
    ],
    detections: 8, isSaved: false, firstDetected: "2026-03-12T14:30:00Z",
  },
  {
    id: "2", name: "Lead Processing", description: "Detectado 5x no distrito Commerce",
    sequence: [
      { agent: "Monitor", role: "Captura", icon: "📥" },
      { agent: "Atlas", role: "Análise", icon: "📊" },
      { agent: "Scribe", role: "Email", icon: "📧" },
    ],
    detections: 5, isSaved: true, firstDetected: "2026-03-13T09:00:00Z",
  },
  {
    id: "3", name: "Code Review Chain", description: "Detectado 3x entre devs",
    sequence: [
      { agent: "Coder-X", role: "Desenvolvimento", icon: "💻" },
      { agent: "Atlas", role: "Review", icon: "🔍" },
      { agent: "Coder-X", role: "Refactor", icon: "🔄" },
      { agent: "Monitor", role: "Deploy", icon: "🚀" },
    ],
    detections: 3, isSaved: false, firstDetected: "2026-03-14T11:00:00Z",
  },
];

export function EmergentWorkflows() {
  const [workflows, setWorkflows] = useState(MOCK_WORKFLOWS);

  const toggleSave = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, isSaved: !w.isSaved } : w));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Workflow className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Workflows Emergentes</h2>
        <span className="text-xs text-gray-500">Padrões detectados automaticamente</span>
      </div>

      <div className="space-y-4">
        {workflows.map((wf, i) => (
          <motion.div key={wf.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">{wf.name}</h3>
                <p className="text-[10px] text-gray-500">{wf.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-violet-400/10 text-violet-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Eye className="w-3 h-3" />{wf.detections}x detectado
                </span>
                <button
                  onClick={() => toggleSave(wf.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    wf.isSaved ? "bg-emerald-400/10 text-emerald-400" : "bg-primary/20 text-primary hover:bg-primary/30"
                  }`}
                >
                  {wf.isSaved ? <><Check className="w-3 h-3" />Salvo</> : <><Save className="w-3 h-3" />Salvar Pipeline</>}
                </button>
              </div>
            </div>

            {/* Sequence visualization */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {wf.sequence.map((step, j) => (
                <div key={j} className="flex items-center gap-2 shrink-0">
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center min-w-[100px]">
                    <span className="text-2xl block mb-1">{step.icon}</span>
                    <p className="text-[10px] font-bold text-white">{step.role}</p>
                    <p className="text-[9px] text-primary">{step.agent}</p>
                  </div>
                  {j < wf.sequence.length - 1 && <ArrowRight className="w-4 h-4 text-gray-600 shrink-0" />}
                </div>
              ))}
            </div>

            <p className="text-[10px] text-gray-500 mt-2">Primeiro detectado: {new Date(wf.firstDetected).toLocaleDateString("pt-BR")}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
