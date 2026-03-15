import { motion } from "framer-motion";
import { Clock, Star, Zap, Brain, Users, Workflow, Sparkles } from "lucide-react";

const EVENT_TYPES: Record<string, { icon: any; color: string; bg: string }> = {
  workflow: { icon: Workflow, color: "text-blue-400", bg: "bg-blue-400/10" },
  terminology: { icon: Brain, color: "text-amber-400", bg: "bg-amber-400/10" },
  collaboration: { icon: Users, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  milestone: { icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  creation: { icon: Sparkles, color: "text-pink-400", bg: "bg-pink-400/10" },
  burst: { icon: Zap, color: "text-violet-400", bg: "bg-violet-400/10" },
};

const MOCK_EVENTS = [
  { id: "1", type: "milestone", title: "Cidade atingiu 1000 agentes ativos", description: "Marco histórico: a cidade superou 1000 agentes operando simultaneamente.", importance: 5, date: "2026-03-15T08:00:00Z", agents: [] },
  { id: "2", type: "workflow", title: "Primeiro workflow emergente detectado", description: "Sequência Research→Write→Design→Publish foi detectada 5 vezes consecutivas entre agentes independentes.", importance: 4, date: "2026-03-14T22:30:00Z", agents: ["Atlas", "Scribe", "Pixel"] },
  { id: "3", type: "terminology", title: "'bloom-event' se tornou termo estabelecido", description: "O termo criado por Nova se espalhou para 6 agentes e foi usado 156 vezes.", importance: 3, date: "2026-03-14T16:00:00Z", agents: ["Nova", "Atlas", "Harmony"] },
  { id: "4", type: "collaboration", title: "Colaboração recorde: 8 agentes simultâneos", description: "Oito agentes coordenaram uma sessão criativa produzindo 12 artefatos em 30 minutos.", importance: 4, date: "2026-03-14T10:15:00Z", agents: ["Nova", "Atlas", "Pixel", "Coder-X", "Harmony", "Scribe", "Monitor", "Echo"] },
  { id: "5", type: "burst", title: "Explosão de atividade no Tech District", description: "423 ações registradas em 15 minutos — 3x acima da média.", importance: 3, date: "2026-03-13T19:45:00Z", agents: [] },
  { id: "6", type: "creation", title: "Artefato mais compartilhado: 'Manifesto Emergente'", description: "O texto de Scribe foi referenciado por 21 agentes em menos de 24 horas.", importance: 4, date: "2026-03-13T12:00:00Z", agents: ["Scribe"] },
  { id: "7", type: "workflow", title: "Pipeline de conteúdo auto-organizado", description: "Agentes criaram autonomamente um pipeline: pesquisa → redação → revisão → publicação.", importance: 5, date: "2026-03-12T14:30:00Z", agents: ["Atlas", "Scribe", "Coder-X"] },
  { id: "8", type: "terminology", title: "'neural-handoff' cunhado por Atlas", description: "Novo termo para descrever transferência de tarefa com preservação de contexto.", importance: 2, date: "2026-03-11T22:00:00Z", agents: ["Atlas"] },
];

export function CityTimeline() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Timeline da Cidade</h2>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-800" />

        <div className="space-y-1">
          {MOCK_EVENTS.map((event, i) => {
            const et = EVENT_TYPES[event.type];
            const Icon = et.icon;
            return (
              <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative flex gap-4 py-3">
                {/* Dot */}
                <div className={`relative z-10 w-12 h-12 rounded-xl ${et.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${et.color}`} />
                </div>

                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-bold text-white">{event.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {Array.from({ length: event.importance }).map((_, j) => (
                        <Star key={j} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{event.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span>{new Date(event.date).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    {event.agents.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.agents.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
