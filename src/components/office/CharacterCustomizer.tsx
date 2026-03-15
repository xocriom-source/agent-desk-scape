import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Palette, User, Sparkles, Glasses, Headphones, Shirt } from "lucide-react";

const AVATAR_COLORS = [
  "#4F46E5", "#7C3AED", "#EC4899", "#EF4444", "#F97316",
  "#EAB308", "#22C55E", "#06B6D4", "#3B82F6", "#8B5CF6",
  "#F43F5E", "#14B8A6", "#D946EF", "#0EA5E9",
];

const SKIN_TONES = [
  { id: "light", color: "#FDDCB5", label: "Claro" },
  { id: "medium", color: "#E8B88A", label: "Médio" },
  { id: "tan", color: "#C8956C", label: "Bronzeado" },
  { id: "dark", color: "#8D5B3E", label: "Escuro" },
];

const HAIR_STYLES = [
  { id: "spiky", label: "Espetado" },
  { id: "flat", label: "Liso" },
  { id: "mohawk", label: "Moicano" },
  { id: "curly", label: "Cacheado" },
  { id: "none", label: "Careca" },
];

const OUTFIT_STYLES = [
  { id: "suit", label: "Terno", icon: "👔" },
  { id: "casual", label: "Casual", icon: "👕" },
  { id: "tech", label: "Tech", icon: "🧥" },
  { id: "lab", label: "Jaleco", icon: "🥼" },
];

const ACCESSORIES = [
  { id: "none", label: "Nenhum", icon: "—" },
  { id: "glasses", label: "Óculos", icon: "👓" },
  { id: "headphones", label: "Fones", icon: "🎧" },
];

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
  skinTone?: string;
  accessory?: string;
}

export function CharacterCustomizer({ isOpen, onClose, onSave, initial }: CharacterCustomizerProps) {
  const [config, setConfig] = useState<PlayerConfig>(
    initial || {
      name: "Chefe",
      color: "#4F46E5",
      hairStyle: "spiky",
      outfitStyle: "suit",
      skinTone: "medium",
      accessory: "none",
    }
  );

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const skin = SKIN_TONES.find(s => s.id === config.skinTone)?.color || "#E8B88A";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-lg">Personalize seu Avatar</h2>
                  <p className="text-xs text-muted-foreground">Você é o chefe! Customize como quiser.</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row">
              {/* Preview */}
              <div className="md:w-1/3 p-6 flex flex-col items-center justify-center bg-muted/20 border-b md:border-b-0 md:border-r border-border">
                <div className="relative mb-4">
                  <div
                    className="w-32 h-32 rounded-2xl flex items-center justify-center border-2 border-border"
                    style={{ backgroundColor: config.color + "15" }}
                  >
                    <svg width="96" height="96" viewBox="0 0 96 96">
                      {/* Shoes */}
                      <rect x="30" y="82" width="10" height="5" rx="2" fill="#1a1a2e" />
                      <rect x="56" y="82" width="10" height="5" rx="2" fill="#1a1a2e" />
                      {/* Legs */}
                      <rect x="32" y="70" width="8" height="14" fill="#2D3748" />
                      <rect x="56" y="70" width="8" height="14" fill="#2D3748" />
                      {/* Body */}
                      <rect x="26" y="40" width="44" height="32" rx="4" fill={config.color} />
                      {config.outfitStyle === "suit" && (
                        <>
                          <rect x="46" y="42" width="3" height="20" fill="#DC2626" />
                          <rect x="32" y="38" width="32" height="5" rx="2" fill="#FFFFFF" />
                        </>
                      )}
                      {config.outfitStyle === "tech" && (
                        <>
                          <rect x="26" y="40" width="44" height="32" rx="4" fill="#1a1a2e" />
                          <circle cx="48" cy="56" r="4" fill={config.color} />
                        </>
                      )}
                      {config.outfitStyle === "lab" && (
                        <>
                          <rect x="24" y="38" width="48" height="36" rx="4" fill="#F0F0F0" />
                          <rect x="38" y="42" width="20" height="12" rx="2" fill={config.color} />
                        </>
                      )}
                      {/* Head */}
                      <rect x="30" y="16" width="36" height="26" rx="6" fill={skin} />
                      {/* Hair */}
                      {config.hairStyle === "spiky" && (
                        <path d="M28 22 L36 6 L42 16 L48 4 L54 16 L60 6 L68 22" fill="#1E1B4B" />
                      )}
                      {config.hairStyle === "flat" && (
                        <rect x="28" y="10" width="40" height="14" rx="6" fill="#4A3728" />
                      )}
                      {config.hairStyle === "mohawk" && (
                        <rect x="42" y="2" width="12" height="20" rx="4" fill="#C62828" />
                      )}
                      {config.hairStyle === "curly" && (
                        <>
                          <circle cx="34" cy="14" r="6" fill="#1B5E20" />
                          <circle cx="42" cy="12" r="6" fill="#1B5E20" />
                          <circle cx="50" cy="12" r="6" fill="#1B5E20" />
                          <circle cx="58" cy="14" r="6" fill="#1B5E20" />
                        </>
                      )}
                      {/* Eyes */}
                      <rect x="36" y="26" width="6" height="6" rx="2" fill="#FFFFFF" />
                      <rect x="54" y="26" width="6" height="6" rx="2" fill="#FFFFFF" />
                      <rect x="38" y="28" width="3" height="3" rx="1" fill="#1a1a2e" />
                      <rect x="56" y="28" width="3" height="3" rx="1" fill="#1a1a2e" />
                      {/* Mouth */}
                      <rect x="42" y="36" width="12" height="2" rx="1" fill={skin} opacity="0.6" />
                      {/* Glasses */}
                      {config.accessory === "glasses" && (
                        <>
                          <rect x="34" y="24" width="10" height="8" rx="2" fill="none" stroke="#333" strokeWidth="1.5" />
                          <rect x="52" y="24" width="10" height="8" rx="2" fill="none" stroke="#333" strokeWidth="1.5" />
                          <line x1="44" y1="28" x2="52" y2="28" stroke="#333" strokeWidth="1.5" />
                        </>
                      )}
                      {/* Headphones */}
                      {config.accessory === "headphones" && (
                        <>
                          <path d="M28 26 Q28 8 48 8 Q68 8 68 26" fill="none" stroke="#333" strokeWidth="3" />
                          <rect x="24" y="22" width="6" height="10" rx="2" fill="#333" />
                          <rect x="66" y="22" width="6" height="10" rx="2" fill="#333" />
                        </>
                      )}
                      {/* Crown */}
                      <text x="48" y="8" textAnchor="middle" fontSize="14">👑</text>
                    </svg>
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-display font-bold px-4 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: config.color }}>
                    {config.name || "Chefe"}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-4">Prévia do seu personagem</p>
              </div>

              {/* Options */}
              <div className="md:w-2/3 p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <User className="w-4 h-4 text-primary" />
                    Nome
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    placeholder="Nome do seu personagem"
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Skin Tone */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">🎨 Tom de pele</label>
                  <div className="flex gap-2">
                    {SKIN_TONES.map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => setConfig({ ...config, skinTone: tone.id })}
                        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all border ${
                          config.skinTone === tone.id
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: tone.color }} />
                        <span className="text-[10px] text-muted-foreground">{tone.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Palette className="w-4 h-4 text-primary" />
                    Cor da roupa
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setConfig({ ...config, color })}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          config.color === color
                            ? "ring-2 ring-offset-2 ring-primary scale-110"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {config.color === color && <Check className="w-3.5 h-3.5 text-white mx-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hair Style */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">💇 Cabelo</label>
                  <div className="grid grid-cols-5 gap-2">
                    {HAIR_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setConfig({ ...config, hairStyle: style.id })}
                        className={`px-2 py-2 rounded-xl text-xs font-medium transition-all border ${
                          config.hairStyle === style.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Outfit */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">👔 Roupa</label>
                  <div className="grid grid-cols-4 gap-2">
                    {OUTFIT_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setConfig({ ...config, outfitStyle: style.id })}
                        className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                          config.outfitStyle === style.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="text-base">{style.icon}</span>
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accessories */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">✨ Acessório</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ACCESSORIES.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => setConfig({ ...config, accessory: acc.id })}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                          config.accessory === acc.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="text-base">{acc.icon}</span>
                        {acc.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
              <button
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-colors"
              >
                <Check className="w-4 h-4" />
                Salvar Personagem
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
