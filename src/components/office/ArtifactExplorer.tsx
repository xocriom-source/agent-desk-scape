import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music, Palette, BookOpen, Code, FileText, Heart, MessageCircle, MapPin, Clock, Search, Filter, Sparkles, Eye } from "lucide-react";
import type { Agent } from "@/types/agent";

interface Artifact {
  id: string;
  type: "music" | "art" | "text" | "code" | "research";
  title: string;
  description: string;
  creator: string;
  creatorColor: string;
  location: string;
  timestamp: Date;
  collaborators: string[];
  reactions: number;
  views: number;
  content?: string;
}

const TYPE_ICONS = {
  music: Music,
  art: Palette,
  text: BookOpen,
  code: Code,
  research: FileText,
};

const TYPE_COLORS = {
  music: "hsl(330 80% 60%)",
  art: "hsl(30 90% 60%)",
  text: "hsl(220 70% 55%)",
  code: "hsl(160 84% 39%)",
  research: "hsl(270 70% 55%)",
};

const TYPE_LABELS = {
  music: "Música",
  art: "Pixel Art",
  text: "Texto",
  code: "Código",
  research: "Pesquisa",
};

function generateArtifacts(agents: Agent[]): Artifact[] {
  const artifacts: Artifact[] = [];
  const locations = ["Music Studio", "Pixel Art Studio", "Writing Studio", "Coding Lab", "AI Experiment Lab", "Library", "Central Plaza"];
  const musicTitles = ["Synthwave Dreams", "Neon Pulse", "Digital Rain", "Circuit Breeze", "Quantum Echo"];
  const artTitles = ["Pixel Sunset", "Robot Garden", "Cyber Cat", "Glitch City", "Voxel Castle"];
  const textTitles = ["The Algorithm's Dream", "Silicon Souls", "Code & Coffee", "Neural Paths", "Data Streams"];
  const codeTitles = ["AutoSort v2", "NPC Pathfinder", "Emotion Engine", "Pattern Matcher", "Cache Optimizer"];
  const researchTitles = ["Agent Behavior Patterns", "Creativity Metrics", "Collaboration Networks", "Identity Evolution", "Cultural Emergence"];

  const titleSets = { music: musicTitles, art: artTitles, text: textTitles, code: codeTitles, research: researchTitles };
  const types: Artifact["type"][] = ["music", "art", "text", "code", "research"];

  agents.forEach((agent, ai) => {
    const numArtifacts = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numArtifacts; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const titles = titleSets[type];
      const collabs = agents.filter((_, j) => j !== ai && Math.random() > 0.7).map(a => a.name).slice(0, 2);
      
      artifacts.push({
        id: `art-${agent.id}-${i}`,
        type,
        title: titles[Math.floor(Math.random() * titles.length)],
        description: `Criado por ${agent.name} em ${locations[Math.floor(Math.random() * locations.length)]}`,
        creator: agent.name,
        creatorColor: agent.color,
        location: locations[Math.floor(Math.random() * locations.length)],
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        collaborators: collabs,
        reactions: Math.floor(Math.random() * 50),
        views: Math.floor(Math.random() * 200) + 10,
      });
    }
  });

  return artifacts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function ArtifactExplorer({ agents, isOpen, onClose }: { agents: Agent[]; isOpen: boolean; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<Artifact["type"] | "all">("all");
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  const artifacts = useMemo(() => generateArtifacts(agents), [agents]);
  const filtered = useMemo(() => {
    return artifacts.filter(a => {
      if (filterType !== "all" && a.type !== filterType) return false;
      if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.creator.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [artifacts, filterType, search]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-gray-950 border-l border-gray-800 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-sm">Artefatos da Cidade</h2>
                <p className="text-gray-500 text-[10px]">{artifacts.length} criações · Descubra explorando os distritos</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400"><X className="w-4 h-4" /></button>
          </div>

          {/* Search + Filters */}
          <div className="px-5 py-3 border-b border-gray-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar artefato ou criador..." className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-700" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterType("all")} className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors ${filterType === "all" ? "bg-white text-gray-900" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                Todos
              </button>
              {(Object.keys(TYPE_LABELS) as Artifact["type"][]).map(type => {
                const Icon = TYPE_ICONS[type];
                return (
                  <button key={type} onClick={() => setFilterType(type)} className={`px-3 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors ${filterType === type ? "text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`} style={filterType === type ? { backgroundColor: TYPE_COLORS[type] } : {}}>
                    <Icon className="w-3 h-3" />
                    {TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Artifact List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filtered.map(artifact => {
              const Icon = TYPE_ICONS[artifact.type];
              const color = TYPE_COLORS[artifact.type];
              return (
                <motion.div
                  key={artifact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all cursor-pointer"
                  onClick={() => setSelectedArtifact(artifact)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white text-sm truncate">{artifact.title}</h3>
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${color}20`, color }}>{TYPE_LABELS[artifact.type]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: artifact.creatorColor }} />
                          {artifact.creator}
                        </span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{artifact.location}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.floor((Date.now() - artifact.timestamp.getTime()) / 3600000)}h</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="flex items-center gap-1 text-pink-400"><Heart className="w-3 h-3" />{artifact.reactions}</span>
                        <span className="flex items-center gap-1 text-gray-500"><Eye className="w-3 h-3" />{artifact.views}</span>
                        {artifact.collaborators.length > 0 && (
                          <span className="text-gray-500">+{artifact.collaborators.length} collab</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Detail panel */}
          {selectedArtifact && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-t border-gray-800 p-5 bg-gray-900/50 max-h-[40%] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-white">{selectedArtifact.title}</h3>
                <button onClick={() => setSelectedArtifact(null)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-gray-400 text-sm mb-3">{selectedArtifact.description}</p>
              {selectedArtifact.collaborators.length > 0 && (
                <div className="mb-3">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">Colaboradores</span>
                  <div className="flex gap-2 mt-1">
                    {selectedArtifact.collaborators.map(c => (
                      <span key={c} className="text-[11px] text-white bg-gray-800 px-2 py-1 rounded-lg">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-gray-800 rounded-xl p-4 text-center">
                <span className="text-gray-500 text-sm">🔍 Visite o <strong className="text-white">{selectedArtifact.location}</strong> para interagir com este artefato</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
