import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { Zap, X, MapPin, Building2, Users, Calendar, ChevronRight } from "lucide-react";

interface TeleportPoint {
  id: string;
  name: string;
  icon: string;
  category: "office" | "meeting" | "hub" | "event";
  description: string;
  coords: [number, number, number];
  online: number;
}

const TELEPORT_POINTS: TeleportPoint[] = [
  { id: "tp1", name: "My Office", icon: "🏢", category: "office", description: "Your personal office space", coords: [0, 0, 5], online: 1 },
  { id: "tp2", name: "Meeting Room A", icon: "🪑", category: "meeting", description: "8-person conference room", coords: [10, 0, -5], online: 4 },
  { id: "tp3", name: "Meeting Room B", icon: "🪑", category: "meeting", description: "4-person huddle space", coords: [-8, 0, 3], online: 0 },
  { id: "tp4", name: "Central Plaza", icon: "🏛️", category: "hub", description: "Main city gathering point", coords: [0, 0, 0], online: 23 },
  { id: "tp5", name: "Innovation Hub", icon: "💡", category: "hub", description: "Co-working & networking space", coords: [15, 0, 10], online: 12 },
  { id: "tp6", name: "Creative District", icon: "🎨", category: "hub", description: "Art studios and galleries", coords: [-12, 0, -8], online: 7 },
  { id: "tp7", name: "Hackathon Arena", icon: "⚡", category: "event", description: "Weekly coding events", coords: [20, 0, -15], online: 34 },
  { id: "tp8", name: "Conference Hall", icon: "🎤", category: "event", description: "Keynotes & presentations", coords: [-5, 0, -20], online: 0 },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: MapPin },
  { id: "office", label: "Office", icon: Building2 },
  { id: "meeting", label: "Meeting", icon: Users },
  { id: "hub", label: "Hubs", icon: MapPin },
  { id: "event", label: "Events", icon: Calendar },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTeleport: (coords: [number, number, number]) => void;
}

export function TeleportSystem({ isOpen, onClose, onTeleport }: Props) {
  const [filter, setFilter] = useState("all");
  const [teleporting, setTeleporting] = useState<string | null>(null);

  const mainColor = "#6b8fc4";

  const filtered = filter === "all" ? TELEPORT_POINTS : TELEPORT_POINTS.filter(tp => tp.category === filter);

  const handleTeleport = (tp: TeleportPoint) => {
    setTeleporting(tp.id);
    setTimeout(() => {
      onTeleport(tp.coords);
      setTeleporting(null);
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        className="w-[420px] max-h-[70vh] rounded-xl border overflow-hidden"
        style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.98)" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: mainColor }} />
            <span className="text-xs font-mono font-bold tracking-wider text-white">TELEPORT</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        {/* Category filters */}
        <div className="flex gap-1 px-3 py-2 border-b overflow-x-auto" style={{ borderColor: `${mainColor}10` }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider whitespace-nowrap transition-colors"
              style={{
                backgroundColor: filter === cat.id ? `${mainColor}20` : "transparent",
                color: filter === cat.id ? mainColor : "#6b7280",
              }}
            >
              <cat.icon className="w-3 h-3" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Locations */}
        <div className="overflow-y-auto max-h-[50vh] p-2">
          {filtered.map(tp => (
            <button
              key={tp.id}
              onClick={() => handleTeleport(tp)}
              disabled={teleporting !== null}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all hover:bg-white/5 disabled:opacity-50"
            >
              <span className="text-xl">{tp.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-white">{tp.name}</span>
                  {tp.online > 0 && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: "#34d39920", color: "#34d399" }}>
                      {tp.online} online
                    </span>
                  )}
                </div>
                <p className="text-[9px] font-mono mt-0.5" style={{ color: `${mainColor}60` }}>{tp.description}</p>
              </div>
              {teleporting === tp.id ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-t-transparent rounded-full"
                  style={{ borderColor: mainColor }}
                />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Teleport overlay */}
      <AnimatePresence>
        {teleporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: `radial-gradient(circle, ${mainColor}40 0%, transparent 70%)` }}
          >
            <motion.div
              animate={{ scale: [1, 1.5, 0], opacity: [1, 1, 0] }}
              transition={{ duration: 0.8 }}
              className="text-4xl"
            >
              ⚡
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
