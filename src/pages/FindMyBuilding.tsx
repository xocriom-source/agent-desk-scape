import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Building2, ArrowLeft, MapPin, Sparkles, Check, Settings2 } from "lucide-react";
import { CityBuildingsScene } from "@/components/buildings/CityBuildingsScene";
import { BuildingCustomizer } from "@/components/buildings/BuildingCustomizer";
import { generateBuilding, getAllBuildings, saveBuilding, claimBuilding, seedDemoBuildings } from "@/data/buildingRegistry";
import { DISTRICTS } from "@/types/building";
import type { CityBuilding } from "@/types/building";
import { SEOHead } from "@/components/SEOHead";
import logo from "@/assets/logo.png";

export default function FindMyBuilding() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedBuilding, setGeneratedBuilding] = useState<CityBuilding | null>(null);
  const [isClaimed, setIsClaimed] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [flyTo, setFlyTo] = useState(false);
  const [step, setStep] = useState<"search" | "preview" | "claimed">("search");

  useEffect(() => {
    seedDemoBuildings();
  }, []);

  const allBuildings = useMemo(() => {
    const stored = getAllBuildings();
    if (generatedBuilding && !stored.find(b => b.id === generatedBuilding.id)) {
      return [...stored, generatedBuilding];
    }
    return stored;
  }, [generatedBuilding]);

  const currentUser = useMemo(() => {
    const stored = localStorage.getItem("agentoffice_user");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    const building = generateBuilding(searchQuery.trim());
    setGeneratedBuilding(building);
    setStep("preview");
    // Delay fly animation
    setTimeout(() => setFlyTo(true), 300);
  }, [searchQuery]);

  const handleClaim = useCallback(() => {
    if (!generatedBuilding || !currentUser) return;
    generatedBuilding.ownerId = currentUser.email || currentUser.name || "user";
    generatedBuilding.claimed = true;
    saveBuilding(generatedBuilding);
    claimBuilding(generatedBuilding.id, generatedBuilding.ownerId);
    setIsClaimed(true);
    setStep("claimed");
  }, [generatedBuilding, currentUser]);

  const handleCustomizerSave = useCallback((updated: CityBuilding) => {
    setGeneratedBuilding(updated);
    setShowCustomizer(false);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950 select-none">
      <SEOHead title="Encontre seu Prédio" description="Encontre e personalize seu prédio na cidade virtual." path="/find-building" />
      {/* 3D City Scene */}
      <CityBuildingsScene
        buildings={allBuildings}
        targetBuilding={generatedBuilding}
        onBuildingClick={(b) => {
          setGeneratedBuilding(b);
          setStep("preview");
          setFlyTo(true);
        }}
        flyToTarget={flyTo}
      />

      {/* Top HUD */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-40"
      >
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50">
              <img src={logo} alt="" className="w-5 h-5" />
              <span className="text-sm font-bold text-white">Encontrar Meu Prédio</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">{allBuildings.length} prédios</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/city")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white transition-all text-xs font-medium"
            >
              <MapPin className="w-3.5 h-3.5" />
              Cidade
            </button>
          </div>
        </div>
      </motion.div>

      {/* Search / Action Panel */}
      <AnimatePresence mode="wait">
        {step === "search" && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg"
          >
            <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="text-center mb-4">
                <Building2 className="w-8 h-8 text-primary mx-auto mb-2" />
                <h2 className="text-xl font-display font-bold text-white">Encontre seu Prédio</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Digite seu nome ou empresa para gerar um escritório na cidade
                </p>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Username, empresa ou marca..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                  className="px-5 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Gerar
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Andre", "Ocriom", "StartupLab", "CreativeStudio"].map(ex => (
                  <button
                    key={ex}
                    onClick={() => setSearchQuery(ex)}
                    className="text-[10px] text-gray-500 bg-gray-800 hover:text-white px-2 py-1 rounded-lg transition-colors"
                  >
                    ex: {ex}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === "preview" && generatedBuilding && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-md"
          >
            <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: generatedBuilding.primaryColor + "20" }}>
                  <Building2 className="w-6 h-6" style={{ color: generatedBuilding.primaryColor }} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg">{generatedBuilding.name}</h3>
                  <p className="text-gray-400 text-xs">
                    {DISTRICTS.find(d => d.id === generatedBuilding.district)?.emoji}{" "}
                    {DISTRICTS.find(d => d.id === generatedBuilding.district)?.name} · {generatedBuilding.floors} andares
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-gray-800/50 rounded-xl p-2">
                  <div className="text-sm font-bold text-white">{generatedBuilding.height}m</div>
                  <div className="text-[10px] text-gray-500">Altura</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-2">
                  <div className="text-sm font-bold text-white">{generatedBuilding.style}</div>
                  <div className="text-[10px] text-gray-500">Estilo</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-2">
                  <div className="text-sm font-bold text-white">{generatedBuilding.floors}</div>
                  <div className="text-[10px] text-gray-500">Andares</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setStep("search"); setFlyTo(false); setGeneratedBuilding(null); }}
                  className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Buscar outro
                </button>
                <button
                  onClick={handleClaim}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Reivindicar Prédio
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "claimed" && generatedBuilding && (
          <motion.div
            key="claimed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-md"
          >
            <div className="bg-gray-900/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-6 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display font-bold text-white text-xl mb-1">Prédio Reivindicado!</h3>
              <p className="text-gray-400 text-sm mb-4">
                <span className="font-bold text-white">{generatedBuilding.name}</span> agora é seu escritório digital
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCustomizer(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  <Settings2 className="w-4 h-4" />
                  Personalizar
                </button>
                <button
                  onClick={() => navigate(`/building/${generatedBuilding.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                  Entrar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customizer panel */}
      {showCustomizer && generatedBuilding && (
        <div className="absolute top-20 right-4 z-50">
          <BuildingCustomizer
            building={generatedBuilding}
            onSave={handleCustomizerSave}
            onClose={() => setShowCustomizer(false)}
          />
        </div>
      )}

      {/* Controls hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 right-4 z-30"
      >
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-md border border-gray-700/50">
          <span className="text-[10px] text-gray-400">
            <span className="text-white font-bold">SCROLL</span> zoom · <span className="text-white font-bold">ARRASTAR</span> girar · <span className="text-white font-bold">CLICK</span> selecionar
          </span>
        </div>
      </motion.div>
    </div>
  );
}
