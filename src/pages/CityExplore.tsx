import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Map, Users2 } from "lucide-react";
import { motion } from "framer-motion";
import { CityExploreScene } from "@/components/office/3d/CityExploreScene";
import logo from "@/assets/logo.png";

export default function CityExplore() {
  const navigate = useNavigate();

  const userName = useMemo(() => {
    const stored = localStorage.getItem("agentoffice_user");
    return stored ? JSON.parse(stored).name || "Chefe" : "Chefe";
  }, []);

  const cityData = useMemo(() => {
    const stored = localStorage.getItem("agentoffice_city");
    return stored ? JSON.parse(stored) : { name: "São Paulo", flag: "🇧🇷" };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background select-none">
      {/* 3D City Scene */}
      <CityExploreScene playerName={userName} />

      {/* Top HUD */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-40"
      >
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/city")}
              className="p-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50">
              <img src={logo} alt="" className="w-5 h-5" />
              <span className="text-sm font-bold text-white">{cityData.flag} {cityData.name}</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">Explorar</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/city")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium"
            >
              <Map className="w-3.5 h-3.5" />
              Mapa
            </button>
            <button
              onClick={() => navigate("/office")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/80 backdrop-blur-md border border-primary/50 text-white hover:bg-primary transition-all text-xs font-medium"
            >
              <Building2 className="w-3.5 h-3.5" />
              Meu Prédio
            </button>
          </div>
        </div>
      </motion.div>

      {/* Bottom controls hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40"
      >
        <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-gray-700/50">
          <span className="text-[10px] text-gray-400">
            <span className="text-white font-bold">WASD</span> ou <span className="text-white font-bold">Setas</span> para andar
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-[10px] text-gray-400">
            <span className="text-white font-bold">CLICK</span> para teleportar
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-[10px] text-gray-400">
            <span className="text-white font-bold">SCROLL</span> zoom
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-[10px] text-gray-400">
            <span className="text-white font-bold">ARRASTAR</span> câmera
          </span>
        </div>
      </motion.div>

      {/* Mini location indicator */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-4 left-4 z-40"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50">
          <Users2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-gray-300">
            Cidade com prédios dinâmicos carregados
          </span>
        </div>
      </motion.div>
    </div>
  );
}
