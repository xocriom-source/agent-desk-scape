import { useState } from "react";
import { motion } from "framer-motion";
import { X, Monitor, Pen, Square, Circle, Type, Eraser, MousePointer, Download } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TOOLS = [
  { id: "pointer", icon: <MousePointer className="w-3.5 h-3.5" />, label: "Selecionar" },
  { id: "pen", icon: <Pen className="w-3.5 h-3.5" />, label: "Desenhar" },
  { id: "rect", icon: <Square className="w-3.5 h-3.5" />, label: "Retângulo" },
  { id: "circle", icon: <Circle className="w-3.5 h-3.5" />, label: "Círculo" },
  { id: "text", icon: <Type className="w-3.5 h-3.5" />, label: "Texto" },
  { id: "eraser", icon: <Eraser className="w-3.5 h-3.5" />, label: "Apagar" },
];

const COLORS = ["#6b8fc4", "#ef4444", "#34d399", "#fbbf24", "#a855f7", "#ffffff"];

export function ScreenSharing({ isOpen, onClose }: Props) {
  const [activeTool, setActiveTool] = useState("pointer");
  const [activeColor, setActiveColor] = useState(COLORS[0]);
  const [isSharing, setIsSharing] = useState(false);
  const mainColor = "#6b8fc4";

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[750px] md:h-[500px] z-50 rounded-2xl border overflow-hidden flex flex-col"
      style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.97)", backdropFilter: "blur(16px)" }}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4" style={{ color: mainColor }} />
          <span className="text-xs font-mono font-bold tracking-wider text-white">COMPARTILHAMENTO & WHITEBOARD</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSharing(!isSharing)} className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold tracking-wider ${isSharing ? "bg-red-500/20 text-red-400" : ""}`} style={!isSharing ? { backgroundColor: `${mainColor}20`, color: mainColor } : {}}>
            {isSharing ? "⏹ PARAR" : "📺 COMPARTILHAR TELA"}
          </button>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-5 py-2 border-b" style={{ borderColor: `${mainColor}10` }}>
        {TOOLS.map(t => (
          <button key={t.id} onClick={() => setActiveTool(t.id)} title={t.label}
            className="p-2 rounded-lg transition-all"
            style={{ backgroundColor: activeTool === t.id ? `${mainColor}20` : "transparent", color: activeTool === t.id ? mainColor : "#6b7280" }}
          >
            {t.icon}
          </button>
        ))}
        <div className="w-px h-6 bg-gray-700 mx-1" />
        {COLORS.map(c => (
          <button key={c} onClick={() => setActiveColor(c)}
            className="w-5 h-5 rounded-full border-2 transition-all"
            style={{ backgroundColor: c, borderColor: activeColor === c ? "#fff" : "transparent" }}
          />
        ))}
        <div className="ml-auto">
          <button className="p-2 rounded-lg hover:bg-white/5"><Download className="w-3.5 h-3.5 text-gray-500" /></button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative cursor-crosshair" style={{ backgroundColor: "#0a0e1a" }}>
        {isSharing ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4/5 h-4/5 rounded-xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: `${mainColor}30` }}>
              <div className="text-center">
                <Monitor className="w-12 h-12 mx-auto mb-3" style={{ color: `${mainColor}30` }} />
                <p className="text-xs font-mono" style={{ color: `${mainColor}50` }}>Compartilhando sua tela...</p>
                <p className="text-[9px] font-mono text-gray-600 mt-1">2 pessoas visualizando</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${mainColor}10` }}>
                <Pen className="w-8 h-8" style={{ color: `${mainColor}30` }} />
              </div>
              <p className="text-xs font-mono text-gray-400">Whiteboard colaborativo</p>
              <p className="text-[9px] font-mono text-gray-600 mt-1">Use as ferramentas acima para desenhar</p>
            </div>
          </div>
        )}

        {/* Viewer cursors mock */}
        <div className="absolute top-1/3 left-1/4">
          <div className="w-3 h-3 rotate-[-15deg]" style={{ color: "#34d399" }}>
            <MousePointer className="w-3 h-3" style={{ color: "#34d399" }} />
          </div>
          <span className="text-[8px] font-mono ml-3" style={{ color: "#34d399" }}>Ana</span>
        </div>
      </div>
    </motion.div>
  );
}
