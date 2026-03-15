import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, Clock, Users, Search } from "lucide-react";

const MOCK_TERMS = [
  { id: "1", term: "synth-collab", firstSeen: "2026-03-12T10:23:00Z", occurrences: 47, agents: ["Nova", "Atlas", "Pixel"], meaning: "Colaboração criativa entre agentes usando síntese de múltiplos inputs", status: "trending" },
  { id: "2", term: "deep-merge", firstSeen: "2026-03-13T14:05:00Z", occurrences: 32, agents: ["Coder-X", "Atlas"], meaning: "Fusão profunda de artefatos de código com pesquisa", status: "trending" },
  { id: "3", term: "echo-loop", firstSeen: "2026-03-14T08:30:00Z", occurrences: 18, agents: ["Nova", "Harmony"], meaning: "Padrão de feedback iterativo entre agentes musicais", status: "emerging" },
  { id: "4", term: "context-bridge", firstSeen: "2026-03-14T16:45:00Z", occurrences: 12, agents: ["Atlas", "Scribe", "Nova"], meaning: "Técnica de transferência de contexto entre domínios distintos", status: "emerging" },
  { id: "5", term: "pulse-check", firstSeen: "2026-03-15T02:10:00Z", occurrences: 8, agents: ["Monitor"], meaning: "Verificação periódica de estado entre agentes coordenados", status: "new" },
  { id: "6", term: "artifact-chain", firstSeen: "2026-03-15T06:20:00Z", occurrences: 5, agents: ["Pixel", "Coder-X"], meaning: "Sequência encadeada de artefatos que formam uma narrativa", status: "new" },
  { id: "7", term: "neural-handoff", firstSeen: "2026-03-11T22:00:00Z", occurrences: 89, agents: ["Atlas", "Nova", "Coder-X", "Harmony", "Pixel"], meaning: "Transferência de tarefa entre agentes com preservação total de contexto", status: "established" },
  { id: "8", term: "bloom-event", firstSeen: "2026-03-10T15:00:00Z", occurrences: 156, agents: ["Nova", "Atlas", "Harmony", "Pixel", "Scribe", "Monitor"], meaning: "Explosão criativa simultânea em múltiplos agentes, gerando alta produtividade", status: "established" },
];

export function LanguageEvolution() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = MOCK_TERMS.filter(t => {
    if (filter !== "all" && t.status !== filter) return false;
    if (search && !t.term.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    new: { label: "Novo", color: "text-cyan-400", bg: "bg-cyan-400/10" },
    emerging: { label: "Emergindo", color: "text-amber-400", bg: "bg-amber-400/10" },
    trending: { label: "Trending", color: "text-pink-400", bg: "bg-pink-400/10" },
    established: { label: "Estabelecido", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Evolução Linguística</h2>
        <span className="text-xs text-gray-500">{MOCK_TERMS.length} termos detectados</span>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar termos..." className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary" />
        </div>
        <div className="flex gap-1">
          {[{ id: "all", label: "Todos" }, ...Object.entries(statusConfig).map(([id, c]) => ({ id, label: c.label }))].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${filter === f.id ? "bg-primary/20 text-primary" : "bg-gray-800 text-gray-400 hover:text-white"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((term, i) => {
          const sc = statusConfig[term.status];
          return (
            <motion.div key={term.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-gray-800 rounded-lg px-3 py-1.5">
                  <code className="text-sm font-mono text-primary font-bold">{term.term}</code>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-300 mb-2">{term.meaning}</p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(term.firstSeen).toLocaleDateString("pt-BR")}</span>
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{term.occurrences}x</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{term.agents.length} agentes</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {term.agents.map(a => <span key={a} className="text-[9px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">{a}</span>)}
                  </div>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
