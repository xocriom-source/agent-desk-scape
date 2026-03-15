import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Map, Users2, Trophy, Megaphone, Plane, Search, Car, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { CityExploreScene } from "@/components/office/3d/CityExploreScene";
import { CityLeaderboard } from "@/components/city/CityLeaderboard";
import { CityAdPlacement } from "@/components/city/CityAdPlacement";
import { CityActivityTicker } from "@/components/city/CityActivityTicker";
import { VehicleShop } from "@/components/city/VehicleShop";
import type { TransportType } from "@/types/building";
import logo from "@/assets/logo.png";

export default function CityExplore() {
  const navigate = useNavigate();
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAds, setShowAds] = useState(false);
  const [showVehicleShop, setShowVehicleShop] = useState(false);
  const [flyMode, setFlyMode] = useState(false);
  const [inVehicle, setInVehicle] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<TransportType>("car");
  const [vehicleColor, setVehicleColor] = useState("#4A90D9");

  const userName = useMemo(() => {
    const stored = localStorage.getItem("agentoffice_user");
    return stored ? JSON.parse(stored).name || "Chefe" : "Chefe";
  }, []);

  const cityData = useMemo(() => {
    const stored = localStorage.getItem("agentoffice_city");
    return stored ? JSON.parse(stored) : { name: "São Paulo", flag: "🇧🇷" };
  }, []);

  const handleVehicleSelect = useCallback((type: TransportType, color: string) => {
    setCurrentVehicle(type);
    setVehicleColor(color);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background select-none">
      {/* 3D City Scene */}
      <CityExploreScene
        playerName={userName}
        flyMode={flyMode}
        inVehicle={inVehicle}
        vehicleType={currentVehicle}
        vehicleColor={vehicleColor}
        onVehicleToggle={setInVehicle}
      />

      {/* Top HUD */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-40"
      >
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
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
            {/* Vehicle indicator */}
            {inVehicle && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#C8D880]/20 backdrop-blur-md border border-[#C8D880]/50 text-[#C8D880] text-xs font-medium"
                style={{ fontFamily: "monospace" }}
              >
                <Car className="w-3.5 h-3.5" />
                EM VEÍCULO
                <span className="text-[8px] bg-black/40 px-1.5 py-0.5 rounded">[E] SAIR</span>
              </div>
            )}

            {/* Flight mode toggle */}
            <button
              onClick={() => setFlyMode(!flyMode)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-md border text-xs font-medium transition-all ${
                flyMode
                  ? "bg-[#C8D880]/20 border-[#C8D880]/50 text-[#C8D880]"
                  : "bg-black/60 border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80"
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              FLY
            </button>

            <button
              onClick={() => setShowVehicleShop(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              GARAGE
              <span className="text-[8px] bg-amber-500 text-black px-1 rounded-sm font-bold">NEW</span>
            </button>

            <button
              onClick={() => setShowLeaderboard(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium"
            >
              <Trophy className="w-3.5 h-3.5" />
              RANK
            </button>

            <button
              onClick={() => setShowAds(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium"
            >
              <Megaphone className="w-3.5 h-3.5" />
              ADS
            </button>

            <button
              onClick={() => navigate("/find-building")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 text-gray-300 hover:text-white hover:bg-black/80 transition-all text-xs font-medium"
            >
              <Search className="w-3.5 h-3.5" />
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

      {/* Flight mode controls popup */}
      {flyMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
        >
          <div className="bg-[#1A1A20]/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl px-8 py-6 text-center shadow-2xl">
            <h3 className="text-sm font-bold text-gray-300 tracking-widest mb-4" style={{ fontFamily: "monospace" }}>
              FLIGHT CONTROLS
            </h3>
            <div className="space-y-2 text-xs" style={{ fontFamily: "monospace" }}>
              {[
                ["MOUSE", "STEER"],
                ["SCROLL", "SPEED"],
                ["SHIFT / ALT", "BOOST / SLOW"],
                ["ESC", "PAUSE & EXIT"],
              ].map(([key, action]) => (
                <div key={key} className="flex justify-between gap-8">
                  <span className="text-white font-bold">{key}</span>
                  <span className="text-gray-500">{action}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setFlyMode(false)}
              className="mt-4 px-6 py-2.5 bg-[#4A6AE5] text-white text-xs font-bold tracking-wider rounded-lg hover:bg-[#5A7AF5] transition-colors"
              style={{ fontFamily: "monospace" }}
            >
              GOT IT, LET'S FLY!
            </button>
          </div>
        </motion.div>
      )}

      {/* Activity Ticker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40"
      >
        <CityActivityTicker />
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
            <span className="text-white font-bold">WASD</span> andar
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-[10px] text-gray-400">
            <span className="text-white font-bold">CLICK</span> teleportar
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-[10px] text-gray-400">
            <span className="text-white font-bold">SCROLL</span> zoom
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-[10px] text-gray-400">
            <span className="text-white font-bold">E</span> veículo
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-[10px] text-gray-400">
            <span className="text-white font-bold">DRAG</span> câmera
          </span>
        </div>
      </motion.div>

      {/* Building count */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-4 left-4 z-40"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50">
          <Users2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-gray-300">
            Cidade com prédios dinâmicos
          </span>
        </div>
      </motion.div>

      {/* Lo-fi music hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 right-4 z-40"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-gray-700/50 cursor-pointer hover:bg-black/80 transition-all">
          <span className="text-[10px] text-gray-400">▶ LO-FI ...</span>
        </div>
      </motion.div>

      {/* Panels */}
      <CityLeaderboard isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <CityAdPlacement isOpen={showAds} onClose={() => setShowAds(false)} />
      <VehicleShop
        isOpen={showVehicleShop}
        onClose={() => setShowVehicleShop(false)}
        currentVehicle={currentVehicle}
        onSelect={handleVehicleSelect}
      />
    </div>
  );
}
