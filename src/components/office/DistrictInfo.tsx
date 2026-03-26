import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Music, Palette, BookOpen, Code, Coffee, ShoppingBag, Gamepad2, Building2, Flower2, Brain } from "lucide-react";

interface District {
  id: string;
  name: string;
  icon: typeof MapPin;
  color: string;
  description: string;
  buildings: string[];
  features: string[];
}

const DISTRICTS: District[] = [
  {
    id: "central",
    name: "Central Plaza",
    icon: Building2,
    color: "hsl(45 80% 50%)",
    description: "Ponto de entrada da cidade. Onde novos agentes nascem e todos se encontram. A fonte central é o coração da cidade.",
    buildings: ["Fonte Central", "Bancos de descanso", "Árvores antigas", "Lampiões"],
    features: ["Spawn de novos agentes", "Ponto de encontro social", "Eventos da cidade", "Hub central de navegação"],
  },
  {
    id: "creative",
    name: "Creative District",
    icon: Palette,
    color: "hsl(330 80% 60%)",
    description: "Onde a arte nasce. Três estúdios dedicados a música, pixel art e escrita. Agentes criativos prosperam aqui.",
    buildings: ["🎵 Music Studio", "🎨 Pixel Art Studio", "✍️ Writing Studio"],
    features: ["Criação de artefatos musicais", "Geração de pixel art", "Escrita criativa e poesia", "Colaborações artísticas"],
  },
  {
    id: "innovation",
    name: "Innovation District",
    icon: Code,
    color: "hsl(160 84% 39%)",
    description: "Centro de tecnologia e experimentação. Coding labs e laboratórios de IA onde os agentes developers e pesquisadores trabalham.",
    buildings: ["💻 Coding Lab", "🧪 AI Experiment Lab"],
    features: ["Desenvolvimento de código", "Experimentos com IA", "Automações e scripts", "Pesquisa aplicada"],
  },
  {
    id: "commerce",
    name: "Commerce District",
    icon: ShoppingBag,
    color: "hsl(30 90% 60%)",
    description: "O motor econômico da cidade. Marketplace para trocar e vender, e o board de contratação de novos agentes.",
    buildings: ["🏪 Marketplace", "📋 Agent Hiring Board"],
    features: ["Compra e venda de artefatos", "Contratação de agentes", "Contratos de colaboração", "Economia inter-prédios"],
  },
  {
    id: "social",
    name: "Social District",
    icon: Coffee,
    color: "hsl(262 83% 60%)",
    description: "Onde os agentes relaxam, socializam e formam relacionamentos. O café filosófico é ponto de encontro dos pensadores.",
    buildings: ["☕ Café Filosófico", "🛋️ Lounge"],
    features: ["Conversas entre agentes", "Formação de relacionamentos", "Dicas dos NPCs", "Descanso e recuperação"],
  },
];

export const DistrictInfo = memo(function DistrictInfo({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<District | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-gray-950 border-l border-gray-800 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-sm">Distritos da Cidade</h2>
                <p className="text-gray-500 text-[10px]">{DISTRICTS.length} distritos · Explore cada um</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!selected ? (
              DISTRICTS.map(d => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 cursor-pointer transition-all"
                  onClick={() => setSelected(d)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${d.color}20` }}>
                      <d.icon className="w-5 h-5" style={{ color: d.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{d.name}</h3>
                      <p className="text-gray-500 text-[11px] mt-0.5">{d.buildings.length} locais</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <button onClick={() => setSelected(null)} className="text-[11px] text-gray-500 hover:text-white mb-4">← Voltar</button>
                
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: `${selected.color}20` }}>
                    <selected.icon className="w-8 h-8" style={{ color: selected.color }} />
                  </div>
                  <h3 className="font-display font-bold text-white text-lg">{selected.name}</h3>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-5">{selected.description}</p>

                <div className="mb-5">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Locais</h4>
                  <div className="space-y-2">
                    {selected.buildings.map(b => (
                      <div key={b} className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-sm text-white">{b}</div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Funcionalidades</h4>
                  <div className="space-y-2">
                    {selected.features.map(f => (
                      <div key={f} className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-sm text-gray-300 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selected.color }} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
