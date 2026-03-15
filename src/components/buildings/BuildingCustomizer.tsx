import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Lightbulb, TreePine, Antenna, Sparkles, Box, Save, X } from "lucide-react";
import type { CityBuilding, BuildingCustomizations } from "@/types/building";
import { BUILDING_STYLES, DISTRICTS } from "@/types/building";
import { updateBuilding } from "@/data/buildingRegistry";

interface BuildingCustomizerProps {
  building: CityBuilding;
  onSave: (updated: CityBuilding) => void;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  "hsl(220, 70%, 50%)", "hsl(142, 70%, 45%)", "hsl(330, 70%, 55%)", "hsl(45, 80%, 50%)",
  "hsl(270, 70%, 55%)", "hsl(200, 70%, 50%)", "hsl(350, 70%, 50%)", "hsl(15, 80%, 50%)",
  "hsl(180, 60%, 45%)", "hsl(0, 0%, 40%)", "hsl(30, 30%, 40%)", "hsl(260, 50%, 40%)",
];

const CUSTOMIZATION_OPTIONS: { key: keyof BuildingCustomizations; label: string; icon: typeof Lightbulb; description: string }[] = [
  { key: "neonSign", label: "Letreiro Neon", icon: Lightbulb, description: "Nome iluminado no topo" },
  { key: "rooftop", label: "Antena Rooftop", icon: Antenna, description: "Antena no terraço" },
  { key: "garden", label: "Jardim", icon: TreePine, description: "Jardim na base do prédio" },
  { key: "hologram", label: "Holograma", icon: Sparkles, description: "Efeito holográfico no topo" },
  { key: "outdoor", label: "Outdoor", icon: Box, description: "Painel publicitário" },
  { key: "sculptures", label: "Esculturas", icon: Box, description: "Arte decorativa" },
];

export function BuildingCustomizer({ building, onSave, onClose }: BuildingCustomizerProps) {
  const [name, setName] = useState(building.name);
  const [style, setStyle] = useState(building.style);
  const [district, setDistrict] = useState(building.district);
  const [primaryColor, setPrimaryColor] = useState(building.primaryColor);
  const [customizations, setCustomizations] = useState<BuildingCustomizations>({ ...building.customizations });
  const [bio, setBio] = useState(building.bio || "");

  const handleSave = () => {
    const updated = updateBuilding(building.id, { name, style, district, primaryColor, customizations, bio });
    if (updated) onSave(updated);
  };

  const toggleCustomization = (key: keyof BuildingCustomizations) => {
    setCustomizations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-96 max-h-[80vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Personalizar Prédio
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Name */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-1 block">Nome do Prédio</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary"
        />
      </div>

      {/* Bio */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary resize-none"
          placeholder="Descreva seu escritório..."
        />
      </div>

      {/* Style */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-1 block">Estilo Arquitetônico</label>
        <div className="grid grid-cols-4 gap-1.5">
          {BUILDING_STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={`text-[10px] py-1.5 px-2 rounded-lg border transition-all ${
                style === s.id ? "bg-primary/20 border-primary text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              {s.emoji} {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* District */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-1 block">Distrito</label>
        <div className="grid grid-cols-2 gap-1.5">
          {DISTRICTS.map(d => (
            <button
              key={d.id}
              onClick={() => setDistrict(d.id)}
              className={`text-[10px] py-1.5 px-2 rounded-lg border transition-all text-left ${
                district === d.id ? "bg-primary/20 border-primary text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              {d.emoji} {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-1 block">Cor Principal</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c}
              onClick={() => setPrimaryColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                primaryColor === c ? "border-white scale-110" : "border-gray-700 hover:border-gray-500"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Customizations */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-2 block">Extras</label>
        <div className="space-y-2">
          {CUSTOMIZATION_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => toggleCustomization(opt.key)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                customizations[opt.key]
                  ? "bg-primary/10 border-primary/40 text-white"
                  : "bg-gray-800/50 border-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              <opt.icon className="w-4 h-4 shrink-0" />
              <div>
                <div className="text-xs font-medium">{opt.label}</div>
                <div className="text-[10px] text-gray-500">{opt.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white font-medium py-3 rounded-xl text-sm transition-colors hover:bg-primary/90"
      >
        <Save className="w-4 h-4" />
        Salvar Personalizações
      </button>
    </motion.div>
  );
}
