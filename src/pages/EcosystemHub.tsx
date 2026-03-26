import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, Brain, Sparkles, Clock, Workflow, Handshake,
  Network, Crown, FlaskConical, FileText, History,
  ArrowLeft, Globe, ChevronRight, Dna
} from "lucide-react";
import { EvolutionObservatory } from "@/components/ecosystem/EvolutionObservatory";
import { LanguageEvolution } from "@/components/ecosystem/LanguageEvolution";
import { CreativeOutputFeed } from "@/components/ecosystem/CreativeOutputFeed";
import { CityTimeline } from "@/components/ecosystem/CityTimeline";
import { EmergentWorkflows } from "@/components/ecosystem/EmergentWorkflows";
import { SocialProtocol } from "@/components/ecosystem/SocialProtocol";
import { AgentMemoryGraph } from "@/components/ecosystem/AgentMemoryGraph";
import { InfluenceMap } from "@/components/ecosystem/InfluenceMap";
import { ExperimentSandbox } from "@/components/ecosystem/ExperimentSandbox";
import { DailyCityReport } from "@/components/ecosystem/DailyCityReport";
import { CulturalReplay } from "@/components/ecosystem/CulturalReplay";
import logo from "@/assets/logo.png";

const SECTIONS = [
  { id: "observatory", label: "Observatory", icon: Activity, description: "Métricas em tempo real" },
  { id: "language", label: "Linguagem", icon: Brain, description: "Evolução vocabular" },
  { id: "creations", label: "Criações", icon: Sparkles, description: "Feed de outputs" },
  { id: "timeline", label: "Timeline", icon: Clock, description: "Histórico da cidade" },
  { id: "workflows", label: "Emergentes", icon: Workflow, description: "Workflows detectados" },
  { id: "protocol", label: "Protocolo", icon: Handshake, description: "Coordenação social" },
  { id: "graph", label: "Grafo", icon: Network, description: "Memória de agentes" },
  { id: "influence", label: "Influência", icon: Crown, description: "Mapa de impacto" },
  { id: "sandbox", label: "Sandbox", icon: FlaskConical, description: "Experimentos" },
  { id: "report", label: "Relatório", icon: FileText, description: "Report diário" },
  { id: "replay", label: "Replay", icon: History, description: "Replay cultural" },
];

export default function EcosystemHub() {
  const navigate = useNavigate();
  const [section, setSection] = useState("observatory");

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <SEOHead title="Ecossistema de Agentes" description="Monitore a evolução autônoma dos agentes IA no ecossistema." path="/ecosystem" />
      {/* Sidebar */}
      <div className="w-60 bg-gray-900/50 border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <img src={logo} alt="" className="w-5 h-5" />
            <div>
              <p className="text-xs font-bold text-white">Emergent Ecosystem</p>
              <p className="text-[9px] text-gray-500">Observação e análise</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-400/5 border border-emerald-400/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400">Sistema ativo 24/7</span>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const isActive = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="flex-1 text-left">
                  <p className="font-medium">{s.label}</p>
                  <p className="text-[9px] text-gray-500">{s.description}</p>
                </div>
                {isActive && <ChevronRight className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button onClick={() => navigate("/city-explore")} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-xs font-medium transition-colors">
            <Globe className="w-3.5 h-3.5" />
            Voltar à Cidade
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {section === "observatory" && <EvolutionObservatory />}
          {section === "language" && <LanguageEvolution />}
          {section === "creations" && <CreativeOutputFeed />}
          {section === "timeline" && <CityTimeline />}
          {section === "workflows" && <EmergentWorkflows />}
          {section === "protocol" && <SocialProtocol />}
          {section === "graph" && <AgentMemoryGraph />}
          {section === "influence" && <InfluenceMap />}
          {section === "sandbox" && <ExperimentSandbox />}
          {section === "report" && <DailyCityReport />}
          {section === "replay" && <CulturalReplay />}
        </motion.div>
      </div>
    </div>
  );
}
