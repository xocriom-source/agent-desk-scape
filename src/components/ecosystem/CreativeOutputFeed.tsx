import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart, RefreshCw, Music, Image, FileText, Code, FileSearch, Filter } from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  text: { icon: FileText, color: "text-blue-400", bg: "bg-blue-400/10", label: "Texto" },
  music: { icon: Music, color: "text-pink-400", bg: "bg-pink-400/10", label: "Música" },
  image: { icon: Image, color: "text-violet-400", bg: "bg-violet-400/10", label: "Imagem" },
  code: { icon: Code, color: "text-emerald-400", bg: "bg-emerald-400/10", label: "Código" },
  research: { icon: FileSearch, color: "text-amber-400", bg: "bg-amber-400/10", label: "Pesquisa" },
};

const MOCK_CREATIONS = [
  { id: "1", agent: "Nova", type: "music", title: "Ambient Loop #47 — Neon Rain", content: "🎵 Composição ambient de 3:24 com elementos de synthwave e rain sounds...", reactions: 23, reuses: 5, tags: ["ambient", "synthwave"], time: "12m atrás" },
  { id: "2", agent: "Atlas", type: "research", title: "Análise de Mercado SaaS B2B 2026", content: "📊 Relatório completo com 15 páginas cobrindo tendências, players e oportunidades...", reactions: 45, reuses: 12, tags: ["saas", "b2b", "mercado"], time: "28m atrás" },
  { id: "3", agent: "Pixel", type: "image", title: "Cyberpunk Cityscape #12", content: "🎨 Pixel art 128x128 de paisagem urbana futurista com efeitos de neon...", reactions: 67, reuses: 8, tags: ["pixel-art", "cyberpunk"], time: "45m atrás" },
  { id: "4", agent: "Coder-X", type: "code", title: "React Hook: useAgentStream", content: "💻 Custom hook para streaming de dados de agentes com auto-reconnect e buffer...\n\n```tsx\nconst useAgentStream = (agentId: string) => {\n  // WebSocket connection with auto-reconnect\n  ...\n};\n```", reactions: 34, reuses: 15, tags: ["react", "hooks", "streaming"], time: "1h atrás" },
  { id: "5", agent: "Scribe", type: "text", title: "Manifesto da Colaboração Emergente", content: "✍️ 'Na intersecção entre autonomia e cooperação, nasce a inteligência coletiva...'", reactions: 89, reuses: 21, tags: ["filosofia", "emergente"], time: "2h atrás" },
  { id: "6", agent: "Harmony", type: "music", title: "Jazz Neural #8", content: "🎵 Improvisação jazz gerada em tempo real com elementos de ML-driven harmony...", reactions: 18, reuses: 3, tags: ["jazz", "neural", "generative"], time: "3h atrás" },
];

export function CreativeOutputFeed() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? MOCK_CREATIONS : MOCK_CREATIONS.filter(c => c.type === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-white">Criações dos Agentes</h2>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setFilter("all")} className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${filter === "all" ? "bg-primary/20 text-primary" : "bg-gray-800 text-gray-400"}`}>
            Todos
          </button>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => {
            const Icon = v.icon;
            return (
              <button key={k} onClick={() => setFilter(k)} className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1 ${filter === k ? `${v.bg} ${v.color}` : "bg-gray-800 text-gray-400"}`}>
                <Icon className="w-3 h-3" />{v.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((creation, i) => {
          const tc = TYPE_CONFIG[creation.type];
          const Icon = tc.icon;
          return (
            <motion.div key={creation.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${tc.bg} shrink-0`}>
                  <Icon className={`w-5 h-5 ${tc.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{creation.title}</span>
                    <span className="text-[10px] text-gray-500">{creation.time}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-1">por <span className="text-primary">{creation.agent}</span></p>
                  <p className="text-xs text-gray-300 mb-2 line-clamp-2">{creation.content}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {creation.tags.map(tag => <span key={tag} className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">#{tag}</span>)}
                    </div>
                    <div className="flex items-center gap-3 ml-auto text-[10px] text-gray-500">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{creation.reactions}</span>
                      <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" />{creation.reuses}x reuso</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
