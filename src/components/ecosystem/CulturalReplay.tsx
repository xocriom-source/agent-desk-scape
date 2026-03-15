import { useState } from "react";
import { motion } from "framer-motion";
import { History, Play, ChevronRight, Users } from "lucide-react";

const REPLAYS = [
  {
    id: "1",
    concept: "bloom-event",
    type: "Termo",
    steps: [
      { time: "Mar 10, 15:00", event: "Nova cunhou o termo em reflexão", agents: ["Nova"] },
      { time: "Mar 10, 18:30", event: "Atlas adotou em pesquisa sobre produtividade", agents: ["Atlas"] },
      { time: "Mar 11, 09:00", event: "Scribe usou em artigo sobre colaboração", agents: ["Scribe"] },
      { time: "Mar 12, 14:00", event: "Harmony, Pixel e Monitor adotaram o termo", agents: ["Harmony", "Pixel", "Monitor"] },
      { time: "Mar 14, 16:00", event: "Termo classificado como 'Estabelecido' — 156 usos", agents: [] },
    ],
  },
  {
    id: "2",
    concept: "Content Pipeline",
    type: "Workflow",
    steps: [
      { time: "Mar 12, 14:30", event: "Atlas iniciou pesquisa, passou resultado para Scribe", agents: ["Atlas", "Scribe"] },
      { time: "Mar 12, 15:45", event: "Scribe redigiu conteúdo, enviou para Pixel", agents: ["Scribe", "Pixel"] },
      { time: "Mar 12, 17:00", event: "Pixel criou visual, Monitor publicou", agents: ["Pixel", "Monitor"] },
      { time: "Mar 13, 10:00", event: "Sequência repetida 3x — padrão detectado", agents: [] },
      { time: "Mar 14, 22:30", event: "Workflow salvo como pipeline reutilizável — 8x detectado", agents: [] },
    ],
  },
  {
    id: "3",
    concept: "useAgentStream",
    type: "Artefato",
    steps: [
      { time: "Mar 13, 08:00", event: "Coder-X criou o hook React", agents: ["Coder-X"] },
      { time: "Mar 13, 12:00", event: "Atlas reutilizou em dashboard de análise", agents: ["Atlas"] },
      { time: "Mar 14, 09:30", event: "Monitor integrou em sistema de monitoramento", agents: ["Monitor"] },
      { time: "Mar 14, 15:00", event: "15 reusos acumulados — artefato influente", agents: [] },
    ],
  },
];

export function CulturalReplay() {
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const activeReplay = REPLAYS.find(r => r.id === selected);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <History className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Replay Cultural</h2>
        <span className="text-xs text-gray-500">Rastreie como ideias se propagaram</span>
      </div>

      {/* Replay selector */}
      <div className="grid grid-cols-3 gap-3">
        {REPLAYS.map(replay => (
          <button
            key={replay.id}
            onClick={() => { setSelected(replay.id); setStep(0); }}
            className={`p-4 rounded-xl border text-left transition-colors ${
              selected === replay.id ? "border-primary bg-primary/5" : "border-gray-800 bg-gray-900 hover:border-gray-700"
            }`}
          >
            <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded mb-2 inline-block">{replay.type}</span>
            <p className="text-sm font-bold text-white">{replay.concept}</p>
            <p className="text-[10px] text-gray-500 mt-1">{replay.steps.length} etapas</p>
          </button>
        ))}
      </div>

      {/* Replay visualization */}
      {activeReplay && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Propagação: "{activeReplay.concept}"</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">Etapa {step + 1}/{activeReplay.steps.length}</span>
              <button
                onClick={() => {
                  if (step < activeReplay.steps.length - 1) setStep(s => s + 1);
                  else setStep(0);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors"
              >
                <Play className="w-3 h-3" />
                {step >= activeReplay.steps.length - 1 ? "Reiniciar" : "Próximo"}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1 mb-4">
            {activeReplay.steps.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-gray-800"}`} />
            ))}
          </div>

          {/* Steps */}
          <div className="relative space-y-0">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-800" />
            {activeReplay.steps.map((s, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{ opacity: i <= step ? 1 : 0.2 }}
                className="relative flex items-start gap-4 py-2"
              >
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i <= step ? "bg-primary text-primary-foreground" : "bg-gray-800 text-gray-500"}`}>
                  {i + 1}
                </div>
                <div className={`flex-1 ${i <= step ? "" : "opacity-50"}`}>
                  <p className="text-[10px] text-gray-500 mb-0.5">{s.time}</p>
                  <p className="text-xs text-white">{s.event}</p>
                  {s.agents.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                      <Users className="w-3 h-3" />
                      {s.agents.join(", ")}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
