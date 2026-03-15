import { useState } from "react";
import { motion } from "framer-motion";
import { X, Eye, Minimize2, Maximize2, Moon, Sun } from "lucide-react";

type FocusModeType = "normal" | "simplified" | "mini" | "zen";

const MODES: { id: FocusModeType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "normal", label: "Normal", icon: <Maximize2 className="w-4 h-4" />, desc: "Todas as funcionalidades visíveis" },
  { id: "simplified", label: "Simplificado", icon: <Eye className="w-4 h-4" />, desc: "Apenas ferramentas essenciais" },
  { id: "mini", label: "Mini Mode", icon: <Minimize2 className="w-4 h-4" />, desc: "Barra compacta flutuante" },
  { id: "zen", label: "Zen", icon: <Moon className="w-4 h-4" />, desc: "Sem distrações, foco total" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentMode: FocusModeType;
  onModeChange: (mode: FocusModeType) => void;
}

export function FocusMode({ isOpen, onClose, currentMode, onModeChange }: Props) {
  const mainColor = "#6b8fc4";

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-72 rounded-xl border overflow-hidden"
      style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.95)", backdropFilter: "blur(12px)" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
        <span className="text-xs font-mono font-bold tracking-wider text-white">MODO DE FOCO</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5"><X className="w-3.5 h-3.5 text-gray-500" /></button>
      </div>
      <div className="p-3 space-y-2">
        {MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => { onModeChange(mode.id); onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${currentMode === mode.id ? "border" : "hover:bg-white/5"}`}
            style={currentMode === mode.id ? { borderColor: `${mainColor}40`, backgroundColor: `${mainColor}08` } : {}}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${mainColor}15`, color: currentMode === mode.id ? mainColor : "#6b7280" }}>
              {mode.icon}
            </div>
            <div>
              <p className="text-[11px] font-mono font-bold text-white">{mode.label}</p>
              <p className="text-[9px] font-mono" style={{ color: `${mainColor}50` }}>{mode.desc}</p>
            </div>
            {currentMode === mode.id && <span className="ml-auto text-[8px] font-mono" style={{ color: mainColor }}>ATIVO</span>}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export type { FocusModeType };
