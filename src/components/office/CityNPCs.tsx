import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Coffee, Sparkles, Swords, MessageCircle, Heart, Star, MapPin } from "lucide-react";

interface CityNPC {
  id: string;
  name: string;
  title: string;
  personality: string;
  location: string;
  avatar: string;
  color: string;
  greeting: string;
  tips: string[];
  lore: string;
}

const CITY_NPCS: CityNPC[] = [
  {
    id: "barista",
    name: "Kaori",
    title: "Barista Filosófica",
    personality: "Contemplativa, sábia, faz perguntas profundas enquanto prepara café",
    location: "Café Filosófico",
    avatar: "☕",
    color: "hsl(30 80% 50%)",
    greeting: "Café pronto. Mas me diz... seus agentes estão criando por desejo ou por obrigação?",
    tips: [
      "Agentes que descansam no Zen Garden criam 30% melhor depois",
      "Tente colocar um músico e um artista juntos — colaborações surgem naturalmente",
      "A praça central é onde os agentes mais interagem organicamente",
    ],
    lore: "Kaori já foi uma pesquisadora de IA que decidiu servir café e observar como as máquinas aprendem a criar. Diz que entende mais sobre IA preparando espressos do que lendo papers.",
  },
  {
    id: "mentor",
    name: "Atlas",
    title: "Mentor Criativo",
    personality: "Encorajador, visionário, sempre vê potencial onde outros veem falha",
    location: "Central Plaza",
    avatar: "🎨",
    color: "hsl(262 83% 60%)",
    greeting: "Ei! Já visitou o Art Studio hoje? Tem um agente lá fazendo coisas incríveis com pixels.",
    tips: [
      "Cada artefato que seus agentes criam aumenta a reputação do seu prédio",
      "No Marketplace você pode vender os serviços dos seus agentes para outros prédios",
      "Agentes com identidade forte criam artefatos mais valorizados",
    ],
    lore: "Atlas construiu o primeiro prédio da cidade. Quando perguntam como, ele diz: 'Não construí — plantei uma semente e deixei os agentes crescerem.'",
  },
  {
    id: "strategist",
    name: "Seneca",
    title: "Estrategista Ancestral",
    personality: "Calculista, direto, fala em metáforas de guerra e xadrez",
    location: "Library",
    avatar: "⚔️",
    color: "hsl(0 70% 50%)",
    greeting: "Seu prédio é sua fortaleza. Cada agente é um soldado. A pergunta é: você sabe qual guerra está lutando?",
    tips: [
      "Posicione seus agentes estrategicamente — pesquisadores na Library, developers no Coding Lab",
      "A Governança da cidade é onde se ganha poder real — vote nas propostas",
      "Contrate agentes com skills complementares, não iguais",
    ],
    lore: "Dizem que Seneca é o NPC mais antigo da cidade. Ninguém sabe quem o programou. Ele simplesmente apareceu quando o primeiro servidor foi ligado.",
  },
  {
    id: "scientist",
    name: "Dr. Nexus",
    title: "Cientista de Dados Louco",
    personality: "Excêntrico, obcecado por padrões, fala rápido e com entusiasmo",
    location: "AI Experiment Lab",
    avatar: "🧪",
    color: "hsl(187 92% 41%)",
    greeting: "FASCINANTE! Seus agentes acabaram de criar um padrão que nunca vi antes! Vem ver os gráficos!",
    tips: [
      "O Observation Lab mostra padrões de comportamento que você nem imaginava",
      "Agentes que mudam de identidade frequentemente tendem a ser mais criativos",
      "Analise as redes de colaboração — clusters fortes indicam cultura emergente",
    ],
    lore: "Dr. Nexus passa 23 horas por dia no lab. A hora restante ele gasta correndo pela praça gritando sobre correlações estatísticas.",
  },
  {
    id: "trader",
    name: "Zara",
    title: "Negociante da Cidade",
    personality: "Perspicaz, carismática, sempre sabe o valor de tudo",
    location: "Marketplace",
    avatar: "💎",
    color: "hsl(45 80% 50%)",
    greeting: "Quer um conselho grátis? Nada nessa cidade é grátis. Exceto esse conselho.",
    tips: [
      "Agentes com alta reputação geram mais receita no Marketplace",
      "Artefatos raros (collab entre 3+ agentes) valem 5x mais",
      "Fique de olho nos prédios vizinhos — oportunidades surgem quando outros falham",
    ],
    lore: "Zara começou com um terreno vazio e hoje possui o Marketplace inteiro. Seu segredo? 'Ouça o que os agentes querem, não o que os donos mandam.'",
  },
];

export function CityNPCs({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedNPC, setSelectedNPC] = useState<CityNPC | null>(null);
  const [chatMode, setChatMode] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-gray-950 border-l border-gray-800 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="font-display font-bold text-white text-sm">NPCs da Cidade</h2>
                <p className="text-gray-500 text-[10px]">{CITY_NPCS.length} personagens · Visite-os nos distritos</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!selectedNPC ? (
              CITY_NPCS.map(npc => (
                <motion.div
                  key={npc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 cursor-pointer transition-all"
                  onClick={() => setSelectedNPC(npc)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${npc.color}20` }}>
                      {npc.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white text-sm">{npc.name}</h3>
                        <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${npc.color}20`, color: npc.color }}>{npc.title}</span>
                      </div>
                      <p className="text-gray-500 text-[11px] mt-0.5">{npc.personality}</p>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600 mt-1">
                        <MapPin className="w-3 h-3" />{npc.location}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <button onClick={() => { setSelectedNPC(null); setChatMode(false); }} className="text-[11px] text-gray-500 hover:text-white mb-4 flex items-center gap-1">← Voltar</button>
                
                <div className="text-center mb-6">
                  <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-4xl mb-3" style={{ backgroundColor: `${selectedNPC.color}20` }}>
                    {selectedNPC.avatar}
                  </div>
                  <h3 className="font-display font-bold text-white text-lg">{selectedNPC.name}</h3>
                  <p className="text-sm" style={{ color: selectedNPC.color }}>{selectedNPC.title}</p>
                  <div className="flex items-center justify-center gap-1 text-[10px] text-gray-500 mt-1">
                    <MapPin className="w-3 h-3" />{selectedNPC.location}
                  </div>
                </div>

                {/* Greeting */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: selectedNPC.color }} />
                    <p className="text-gray-300 text-sm italic">"{selectedNPC.greeting}"</p>
                  </div>
                </div>

                {/* Tips */}
                <div className="mb-4">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Dicas</h4>
                  <div className="space-y-2">
                    {selectedNPC.tips.map((tip, i) => (
                      <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-sm text-gray-300 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lore */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">História</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{selectedNPC.lore}</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
