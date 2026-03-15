import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Home, Landmark, Briefcase, ArrowRight,
  ArrowLeft, Users2, Zap, Star, Globe, Check
} from "lucide-react";
import logo from "@/assets/logo.png";

const BUILDING_OPTIONS = [
  {
    id: "corporate",
    icon: Building2,
    name: "Escritório Corporativo",
    desc: "Torre comercial com múltiplos andares. Ideal para equipes grandes com foco em produtividade e operações.",
    floors: "5-20 andares",
    agents: "Até 20 agentes",
    bestFor: "Operações, gestão de projetos, análise de dados",
    color: "hsl(239 84% 67%)",
    features: ["Salas de reunião", "Área de gestão", "Dashboard integrado"],
  },
  {
    id: "studio",
    icon: Home,
    name: "Studio Criativo",
    desc: "Espaço compacto e inspirador. Perfeito para freelancers, artistas e criadores de conteúdo.",
    floors: "1-3 andares",
    agents: "Até 6 agentes",
    bestFor: "Arte, música, escrita criativa, design",
    color: "hsl(330 80% 60%)",
    features: ["Estúdio de música", "Ateliê de arte", "Área de inspiração"],
  },
  {
    id: "research",
    icon: Landmark,
    name: "Centro de Pesquisa",
    desc: "Laboratórios equipados para análise e experimentação. Foco em inovação e descobertas.",
    floors: "3-10 andares",
    agents: "Até 12 agentes",
    bestFor: "Pesquisa, AI, ciência de dados, experimentação",
    color: "hsl(160 84% 39%)",
    features: ["Lab de IA", "Sala de análise", "Biblioteca digital"],
  },
  {
    id: "hub",
    icon: Briefcase,
    name: "Hub de Negócios",
    desc: "Coworking com áreas compartilhadas. Networking e colaboração com outros prédios da cidade.",
    floors: "2-8 andares",
    agents: "Até 15 agentes",
    bestFor: "Networking, vendas, marketing, parcerias",
    color: "hsl(45 80% 50%)",
    features: ["Marketplace integrado", "Sala de pitch", "Área de networking"],
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [buildingName, setBuildingName] = useState("");

  const handleFinish = () => {
    const building = BUILDING_OPTIONS.find(b => b.id === selectedBuilding);
    if (!building) return;

    const userData = localStorage.getItem("agentoffice_user");
    if (userData) {
      const parsed = JSON.parse(userData);
      parsed.building = {
        type: selectedBuilding,
        name: buildingName || `${parsed.name}'s ${building.name}`,
      };
      parsed.onboarded = true;
      localStorage.setItem("agentoffice_user", JSON.stringify(parsed));
    }

    navigate("/world");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={logo} alt="" className="w-8 h-8" />
          <span className="font-display font-bold text-xl">AgentOffice</span>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-8 h-1 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-gray-700"}`} />
          <div className={`w-8 h-1 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-gray-700"}`} />
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold mb-2">Escolha o tipo do seu prédio</h1>
              <p className="text-gray-400">Cada tipo tem vantagens únicas. Você pode mudar depois.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {BUILDING_OPTIONS.map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBuilding(b.id)}
                  className={`rounded-2xl p-5 border-2 cursor-pointer transition-all ${
                    selectedBuilding === b.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-800 bg-gray-900/50 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${b.color}20` }}>
                      <b.icon className="w-5 h-5" style={{ color: b.color }} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-white">{b.name}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed mt-1">{b.desc}</p>
                    </div>
                    {selectedBuilding === b.id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 text-[10px] mb-3">
                    <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md">{b.floors}</span>
                    <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md">{b.agents}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {b.features.map(f => (
                      <span key={f} className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${b.color}15`, color: b.color }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => selectedBuilding && setStep(2)}
                disabled={!selectedBuilding}
                className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold mb-2">Dê um nome ao seu prédio</h1>
              <p className="text-gray-400">Este será o nome visível para outros jogadores na cidade.</p>
            </div>

            <div className="max-w-md mx-auto mb-8">
              {(() => {
                const b = BUILDING_OPTIONS.find(x => x.id === selectedBuilding)!;
                return (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${b.color}20` }}>
                        <b.icon className="w-6 h-6" style={{ color: b.color }} />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-white">{b.name}</h3>
                        <p className="text-xs text-gray-500">{b.bestFor}</p>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Ex: MeuNegócio HQ, Creative Labs..."
                      value={buildingName}
                      onChange={e => setBuildingName(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary text-sm"
                      autoFocus
                    />
                  </div>
                );
              })()}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
                <button
                  onClick={handleFinish}
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Escolher cidade
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
