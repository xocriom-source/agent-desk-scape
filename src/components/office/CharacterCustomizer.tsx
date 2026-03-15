import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Palette, User, Sparkles } from "lucide-react";

const AVATAR_COLORS = [
  "#4F46E5", "#7C3AED", "#EC4899", "#EF4444", "#F97316",
  "#EAB308", "#22C55E", "#06B6D4", "#3B82F6", "#8B5CF6",
  "#F43F5E", "#14B8A6",
];

const HAIR_STYLES = ["spiky", "flat", "mohawk", "none"];
const OUTFIT_STYLES = ["suit", "casual", "tech", "lab"];

interface CharacterCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: PlayerConfig) => void;
  initial?: PlayerConfig;
}

export interface PlayerConfig {
  name: string;
  color: string;
  hairStyle: string;
  outfitStyle: string;
}

export function CharacterCustomizer({ isOpen, onClose, onSave, initial }: CharacterCustomizerProps) {
  const [config, setConfig] = useState<PlayerConfig>(
    initial || {
      name: "Chefe",
      color: "#4F46E5",
      hairStyle: "spiky",
      outfitStyle: "suit",
    }
  );

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-gray-900">Personalize seu Personagem</h2>
                  <p className="text-xs text-gray-500">Você é o chefe! Customize seu avatar.</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Preview */}
              <div className="flex justify-center">
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: config.color + "20" }}
                  >
                    {/* Simple avatar preview */}
                    <svg width="64" height="64" viewBox="0 0 64 64">
                      {/* Body */}
                      <rect x="18" y="28" width="28" height="30" rx="4" fill={config.color} />
                      {/* Darker lower */}
                      <rect x="18" y="44" width="28" height="14" rx="4" fill={config.color} opacity="0.8" />
                      {/* Head */}
                      <rect x="20" y="14" width="24" height="18" rx="4" fill="#FBBF8B" />
                      {/* Hair */}
                      {config.hairStyle === "spiky" && (
                        <path d="M18 18 L22 8 L28 14 L32 6 L38 14 L42 8 L46 18" fill="#1E1B4B" />
                      )}
                      {config.hairStyle === "flat" && (
                        <rect x="18" y="10" width="28" height="10" rx="4" fill="#1E1B4B" />
                      )}
                      {config.hairStyle === "mohawk" && (
                        <rect x="28" y="4" width="8" height="16" rx="3" fill="#1E1B4B" />
                      )}
                      {/* Eyes */}
                      <rect x="25" y="22" width="4" height="4" rx="1" fill="#1a1a2e" />
                      <rect x="35" y="22" width="4" height="4" rx="1" fill="#1a1a2e" />
                      {/* Crown for boss */}
                      <text x="32" y="8" textAnchor="middle" fontSize="12">👑</text>
                    </svg>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-display font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {config.name || "Chefe"}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4" />
                  Seu nome
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="Nome do seu personagem"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
                />
              </div>

              {/* Color */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4" />
                  Cor do personagem
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setConfig({ ...config, color })}
                      className={`w-9 h-9 rounded-xl transition-all ${
                        config.color === color
                          ? "ring-2 ring-offset-2 ring-gray-900 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {config.color === color && (
                        <Check className="w-4 h-4 text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair Style */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Estilo de cabelo</label>
                <div className="grid grid-cols-4 gap-2">
                  {HAIR_STYLES.map((style) => (
                    <button
                      key={style}
                      onClick={() => setConfig({ ...config, hairStyle: style })}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                        config.hairStyle === style
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {style === "spiky" ? "Espetado" : style === "flat" ? "Liso" : style === "mohawk" ? "Moicano" : "Careca"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outfit */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Roupa</label>
                <div className="grid grid-cols-4 gap-2">
                  {OUTFIT_STYLES.map((style) => (
                    <button
                      key={style}
                      onClick={() => setConfig({ ...config, outfitStyle: style })}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                        config.outfitStyle === style
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {style === "suit" ? "Terno" : style === "casual" ? "Casual" : style === "tech" ? "Tech" : "Jaleco"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors"
              >
                <Check className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
