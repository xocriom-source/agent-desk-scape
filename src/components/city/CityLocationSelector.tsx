/**
 * CityLocationSelector — allows users to pick a real-world city
 * to generate an OSM-based city layout with GLB buildings.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, MapPin, Loader2, X, Search, ArrowRight, AlertCircle, Undo2 } from "lucide-react";
import { CITY_PRESETS, type CityPreset } from "@/systems/city/OSMCityGenerator";

interface CityLocationSelectorProps {
  loading: boolean;
  error: string | null;
  activePreset: CityPreset | null;
  isOSMMode: boolean;
  onSelectPreset: (preset: CityPreset) => void;
  onCustomLocation: (lat: number, lon: number, radius: number) => void;
  onSwitchToProcedural: () => void;
  buildingCount?: number;
  streetCount?: number;
}

export function CityLocationSelector({
  loading,
  error,
  activePreset,
  isOSMMode,
  onSelectPreset,
  onCustomLocation,
  onSwitchToProcedural,
  buildingCount = 0,
  streetCount = 0,
}: CityLocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customLat, setCustomLat] = useState("");
  const [customLon, setCustomLon] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const filteredPresets = search
    ? CITY_PRESETS.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.country.toLowerCase().includes(search.toLowerCase())
      )
    : CITY_PRESETS;

  const handleCustomSubmit = () => {
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      onCustomLocation(lat, lon, 400);
      setOpen(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/80 backdrop-blur-sm border border-border hover:bg-accent/50 transition-colors text-xs"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        ) : (
          <Globe className="w-3.5 h-3.5 text-primary" />
        )}
        <span className="text-foreground font-medium">
          {loading
            ? "Carregando..."
            : isOSMMode && activePreset
            ? `${activePreset.emoji} ${activePreset.name}`
            : "🌍 Cidade Real"}
        </span>
        {isOSMMode && buildingCount > 0 && (
          <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
            {buildingCount} prédios
          </span>
        )}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl w-[90vw] max-w-lg max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Carregar Cidade Real</h2>
                    <p className="text-[10px] text-muted-foreground">
                      Dados reais do OpenStreetMap renderizados com modelos GLB
                    </p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar cidade..."
                    className="w-full bg-muted border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mx-3 mt-3 p-2 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                  <span className="text-[10px] text-destructive">{error}</span>
                </div>
              )}

              {/* Active status */}
              {isOSMMode && activePreset && (
                <div className="mx-3 mt-3 p-2 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] text-primary font-medium">
                      {activePreset.emoji} {activePreset.name} — {buildingCount} prédios, {streetCount} ruas
                    </span>
                  </div>
                  <button
                    onClick={onSwitchToProcedural}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <Undo2 className="w-3 h-3" />
                    Voltar
                  </button>
                </div>
              )}

              {/* Preset list */}
              <div className="p-3 overflow-y-auto max-h-[45vh] space-y-2">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    disabled={loading}
                    onClick={() => {
                      onSelectPreset(preset);
                      setOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      activePreset?.id === preset.id
                        ? "bg-primary/10 border-primary/40"
                        : "bg-muted/30 border-border hover:bg-accent/50"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{preset.emoji}</span>
                        <div>
                          <h3 className="text-xs font-bold text-foreground">{preset.name}</h3>
                          <p className="text-[10px] text-muted-foreground">{preset.country}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{preset.description}</p>
                  </button>
                ))}

                {/* Custom location */}
                <div className="border-t border-border pt-3 mt-3">
                  <button
                    onClick={() => setShowCustom(!showCustom)}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Coordenadas personalizadas
                  </button>

                  {showCustom && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={customLat}
                        onChange={(e) => setCustomLat(e.target.value)}
                        placeholder="Latitude"
                        className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={customLon}
                        onChange={(e) => setCustomLon(e.target.value)}
                        placeholder="Longitude"
                        className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={handleCustomSubmit}
                        disabled={loading}
                        className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50"
                      >
                        Ir
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-border bg-muted/20">
                <p className="text-[9px] text-muted-foreground text-center">
                  Dados geográficos © OpenStreetMap contributors · Visual: Kenney City Kit GLB
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
