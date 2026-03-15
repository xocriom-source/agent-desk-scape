import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Check, Sparkles, Zap, Crown } from "lucide-react";
import { TRANSPORT_INFO, type TransportType } from "@/types/building";

interface VehicleOption {
  type: TransportType;
  price: number;
  tier: "free" | "premium" | "legendary";
  colors: string[];
  speed: number;
  unlocked: boolean;
}

const VEHICLE_CATALOG: VehicleOption[] = [
  { type: "bicycle", price: 0, tier: "free", colors: ["#48BB78", "#38A169", "#2F855A"], speed: 1, unlocked: true },
  { type: "car", price: 500, tier: "free", colors: ["#4A90D9", "#E53E3E", "#ECC94B", "#48BB78"], speed: 2, unlocked: true },
  { type: "motorcycle", price: 800, tier: "free", colors: ["#E53E3E", "#1A1A1A", "#F6AD55"], speed: 2.5, unlocked: true },
  { type: "futuristic_car", price: 2500, tier: "premium", colors: ["#6366F1", "#06B6D4", "#EC4899"], speed: 3, unlocked: false },
  { type: "drone", price: 3000, tier: "premium", colors: ["#9F7AEA", "#4299E1", "#38B2AC"], speed: 3, unlocked: false },
  { type: "helicopter", price: 5000, tier: "premium", colors: ["#718096", "#2D3748", "#4A5568"], speed: 3.5, unlocked: false },
  { type: "jet", price: 15000, tier: "legendary", colors: ["#E2E8F0", "#1A202C", "#C53030"], speed: 5, unlocked: false },
  { type: "boat", price: 2000, tier: "premium", colors: ["#2B6CB0", "#E2E8F0", "#C05621"], speed: 2, unlocked: false },
  { type: "yacht", price: 20000, tier: "legendary", colors: ["#E2E8F0", "#2B6CB0", "#C7A951"], speed: 2.5, unlocked: false },
];

const TIER_STYLES = {
  free: { label: "GRÁTIS", color: "text-gray-400", border: "border-gray-700", bg: "bg-gray-800/30" },
  premium: { label: "PREMIUM", color: "text-purple-400", border: "border-purple-700/50", bg: "bg-purple-900/10" },
  legendary: { label: "LENDÁRIO", color: "text-amber-400", border: "border-amber-700/50", bg: "bg-amber-900/10" },
};

const TIER_ICON = { free: Zap, premium: Sparkles, legendary: Crown };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentVehicle?: TransportType;
  onSelect?: (type: TransportType, color: string) => void;
  coins?: number;
}

export function VehicleShop({ isOpen, onClose, currentVehicle = "car", onSelect, coins = 1250 }: Props) {
  const [selected, setSelected] = useState<TransportType>(currentVehicle);
  const [selectedColor, setSelectedColor] = useState(0);
  const selectedVehicle = VEHICLE_CATALOG.find(v => v.type === selected) || VEHICLE_CATALOG[0];
  const info = TRANSPORT_INFO[selected];
  const tierStyle = TIER_STYLES[selectedVehicle.tier];
  const TierIcon = TIER_ICON[selectedVehicle.tier];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-[#2A2A20] bg-[#0D0E0A] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h1 className="text-3xl font-black tracking-wider text-white" style={{ fontFamily: "monospace" }}>
                VEHICLE <span className="text-[#C8D880]">SHOP</span>
              </h1>
              <p className="text-xs text-gray-500 mt-1 tracking-widest" style={{ fontFamily: "monospace" }}>
                ESCOLHA SEU TRANSPORTE NA CIDADE
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/20 border border-amber-700/30">
                  <span className="text-sm">🪙</span>
                  <span className="text-sm font-bold text-amber-400" style={{ fontFamily: "monospace" }}>{coins.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Grid */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {VEHICLE_CATALOG.map((v) => {
                  const vInfo = TRANSPORT_INFO[v.type];
                  const isSelected = selected === v.type;
                  const isCurrent = currentVehicle === v.type;
                  const ts = TIER_STYLES[v.tier];
                  return (
                    <button
                      key={v.type}
                      onClick={() => { setSelected(v.type); setSelectedColor(0); }}
                      className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-[#C8D880] bg-[#C8D880]/5"
                          : `${ts.border} ${ts.bg} hover:border-gray-500`
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      {!v.unlocked && (
                        <div className="absolute top-1 left-1">
                          <Lock className="w-3 h-3 text-gray-600" />
                        </div>
                      )}
                      <span className="text-2xl">{vInfo.emoji}</span>
                      <span className={`text-[8px] font-bold tracking-wider ${isSelected ? "text-[#C8D880]" : "text-gray-400"}`}
                        style={{ fontFamily: "monospace" }}
                      >
                        {vInfo.name.toUpperCase()}
                      </span>
                      {v.price > 0 && (
                        <span className="text-[8px] text-gray-600" style={{ fontFamily: "monospace" }}>
                          🪙 {v.price.toLocaleString()}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Vehicle Details */}
            <div className="px-6 pb-6">
              <div className={`rounded-xl border ${tierStyle.border} ${tierStyle.bg} p-5`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl">{info.emoji}</span>
                      <h2 className="text-xl font-black text-white" style={{ fontFamily: "monospace" }}>
                        {info.name.toUpperCase()}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <TierIcon className={`w-3.5 h-3.5 ${tierStyle.color}`} />
                      <span className={`text-[10px] font-bold tracking-wider ${tierStyle.color}`} style={{ fontFamily: "monospace" }}>
                        {tierStyle.label}
                      </span>
                      <span className="text-[10px] text-gray-600 tracking-wider" style={{ fontFamily: "monospace" }}>
                        · {info.movement === "ground" ? "TERRESTRE" : info.movement === "air" ? "AÉREO" : "AQUÁTICO"}
                      </span>
                    </div>
                  </div>
                  {selectedVehicle.price > 0 && (
                    <div className="text-right">
                      <div className="text-xl font-black text-white" style={{ fontFamily: "monospace" }}>
                        🪙 {selectedVehicle.price.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <span className="text-[10px] text-gray-500 tracking-wider block mb-1" style={{ fontFamily: "monospace" }}>VELOCIDADE</span>
                    <div className="flex justify-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`w-4 h-1.5 rounded-full ${i < selectedVehicle.speed ? "bg-[#C8D880]" : "bg-gray-800"}`} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <span className="text-[10px] text-gray-500 tracking-wider block mb-1" style={{ fontFamily: "monospace" }}>MOVIMENTO</span>
                    <span className="text-xs font-bold text-white" style={{ fontFamily: "monospace" }}>
                      {info.movement === "ground" ? "🛣️" : info.movement === "air" ? "☁️" : "🌊"}
                    </span>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <span className="text-[10px] text-gray-500 tracking-wider block mb-1" style={{ fontFamily: "monospace" }}>CORES</span>
                    <div className="flex justify-center gap-1">
                      {selectedVehicle.colors.slice(0, 3).map((c, i) => (
                        <div key={i} className="w-3 h-3 rounded-full border border-gray-700" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Color picker */}
                <div className="mb-4">
                  <span className="text-[10px] text-gray-400 tracking-widest font-bold block mb-2" style={{ fontFamily: "monospace" }}>
                    SELECIONAR COR
                  </span>
                  <div className="flex gap-2">
                    {selectedVehicle.colors.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedColor(i)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          selectedColor === i ? "border-[#C8D880] scale-110" : "border-gray-700 hover:border-gray-500"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Action */}
                {selectedVehicle.unlocked || selectedVehicle.price === 0 ? (
                  <button
                    onClick={() => { onSelect?.(selected, selectedVehicle.colors[selectedColor]); onClose(); }}
                    className="w-full py-3 rounded-lg text-sm font-bold tracking-wider text-black bg-[#C8D880] hover:bg-[#D8E890] transition-colors"
                    style={{ fontFamily: "monospace" }}
                  >
                    {currentVehicle === selected ? "JÁ EQUIPADO ✓" : "EQUIPAR VEÍCULO"}
                  </button>
                ) : coins >= selectedVehicle.price ? (
                  <button
                    onClick={() => { onSelect?.(selected, selectedVehicle.colors[selectedColor]); onClose(); }}
                    className="w-full py-3 rounded-lg text-sm font-bold tracking-wider text-black bg-[#C8D880] hover:bg-[#D8E890] transition-colors"
                    style={{ fontFamily: "monospace" }}
                  >
                    COMPRAR POR 🪙 {selectedVehicle.price.toLocaleString()}
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 rounded-lg text-sm font-bold tracking-wider text-gray-500 bg-gray-800 border border-gray-700 cursor-not-allowed"
                    style={{ fontFamily: "monospace" }}
                  >
                    <Lock className="w-3.5 h-3.5 inline mr-1.5" />
                    MOEDAS INSUFICIENTES (🪙 {selectedVehicle.price.toLocaleString()})
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
