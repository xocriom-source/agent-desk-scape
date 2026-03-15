import { useState } from "react";
import { motion } from "framer-motion";
import { X, Globe, Users, Building2, Star, MapPin, ArrowRight } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  type: "coworking" | "conference" | "hub";
  icon: string;
  description: string;
  capacity: number;
  online: number;
  rating: number;
  district: string;
}

const PUBLIC_SPACES: Workspace[] = [
  { id: "ws1", name: "Innovation Lab", type: "coworking", icon: "💡", description: "Open co-working with high-speed AI compute", capacity: 50, online: 23, rating: 4.8, district: "Innovation" },
  { id: "ws2", name: "Grand Hall", type: "conference", icon: "🏛️", description: "500-seat conference hall with holographic displays", capacity: 500, online: 0, rating: 4.9, district: "Central" },
  { id: "ws3", name: "Startup Garage", type: "coworking", icon: "🚀", description: "Casual co-working for early-stage projects", capacity: 30, online: 12, rating: 4.5, district: "Commerce" },
  { id: "ws4", name: "Creative Commons", type: "hub", icon: "🎨", description: "Art studios, music rooms, and creative tools", capacity: 40, online: 8, rating: 4.7, district: "Creative" },
  { id: "ws5", name: "The Nexus", type: "hub", icon: "🌐", description: "Networking hub for cross-team collaboration", capacity: 100, online: 34, rating: 4.6, district: "Social" },
  { id: "ws6", name: "Code Arena", type: "coworking", icon: "⚡", description: "Competitive coding and pair programming", capacity: 20, online: 15, rating: 4.4, district: "Innovation" },
];

const TYPE_LABELS = { coworking: "Co-Working", conference: "Conference", hub: "Networking Hub" };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onVisit?: (workspaceId: string) => void;
}

export function PublicWorkspaces({ isOpen, onClose, onVisit }: Props) {
  const [filter, setFilter] = useState<"all" | "coworking" | "conference" | "hub">("all");

  const mainColor = "#6b8fc4";
  const filtered = filter === "all" ? PUBLIC_SPACES : PUBLIC_SPACES.filter(w => w.type === filter);

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
        className="w-[520px] max-h-[80vh] rounded-xl border overflow-hidden flex flex-col"
        style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.98)" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" style={{ color: mainColor }} />
            <span className="text-xs font-mono font-bold tracking-wider text-white">PUBLIC WORKSPACES</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: "#34d39915", color: "#34d399" }}>
              {PUBLIC_SPACES.reduce((s, w) => s + w.online, 0)} online
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-1 px-3 py-2 border-b" style={{ borderColor: `${mainColor}10` }}>
          {(["all", "coworking", "conference", "hub"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider transition-colors"
              style={{
                backgroundColor: filter === f ? `${mainColor}20` : "transparent",
                color: filter === f ? mainColor : "#6b7280",
              }}
            >
              {f === "all" ? "ALL" : TYPE_LABELS[f].toUpperCase()}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.map(ws => (
            <div key={ws.id} className="rounded-lg border p-4" style={{ borderColor: `${mainColor}15`, background: `${mainColor}05` }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ws.icon}</span>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-white">{ws.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${mainColor}10`, color: `${mainColor}70` }}>
                        {TYPE_LABELS[ws.type]}
                      </span>
                      <span className="text-[8px] font-mono" style={{ color: `${mainColor}50` }}>
                        <MapPin className="w-2.5 h-2.5 inline" /> {ws.district}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" style={{ color: "#fbbf24" }} />
                  <span className="text-[10px] font-mono text-white">{ws.rating}</span>
                </div>
              </div>

              <p className="text-[10px] font-mono mb-3" style={{ color: `${mainColor}60` }}>{ws.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <span className="text-[9px] font-mono" style={{ color: `${mainColor}50` }}>
                    <Users className="w-3 h-3 inline" /> {ws.online}/{ws.capacity}
                  </span>
                </div>
                <button
                  onClick={() => onVisit?.(ws.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider"
                  style={{ backgroundColor: `${mainColor}15`, color: mainColor }}
                >
                  VISIT <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
