import { useState } from "react";
import { motion } from "framer-motion";
import { Circle, X, ChevronDown } from "lucide-react";

export type UserStatus = "available" | "focused" | "in-meeting" | "away";

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; icon: string }> = {
  available: { label: "Available", color: "#34d399", icon: "🟢" },
  focused: { label: "Focused", color: "#fbbf24", icon: "🟡" },
  "in-meeting": { label: "In Meeting", color: "#ef4444", icon: "🔴" },
  away: { label: "Away", color: "#6b7280", icon: "⚫" },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: UserStatus;
  onStatusChange: (status: UserStatus) => void;
  userName: string;
}

export function UserStatusSystem({ isOpen, onClose, currentStatus, onStatusChange, userName }: Props) {
  const mainColor = "#6b8fc4";
  const config = STATUS_CONFIG[currentStatus];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="fixed top-16 right-4 z-50 w-64 rounded-xl border overflow-hidden"
      style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.95)", backdropFilter: "blur(12px)" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
        <span className="text-xs font-mono font-bold tracking-wider text-white">STATUS</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Current status */}
      <div className="px-4 py-3 border-b" style={{ borderColor: `${mainColor}10` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: `${mainColor}15` }}>
            👤
          </div>
          <div>
            <p className="text-xs font-mono font-bold text-white">{userName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
              <span className="text-[10px] font-mono" style={{ color: config.color }}>{config.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status options */}
      <div className="p-2">
        {(Object.entries(STATUS_CONFIG) as [UserStatus, typeof config][]).map(([key, val]) => (
          <button
            key={key}
            onClick={() => { onStatusChange(key); onClose(); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              currentStatus === key ? "bg-white/5" : "hover:bg-white/5"
            }`}
          >
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: val.color }} />
            <span className="text-[11px] font-mono tracking-wider text-white">{val.label}</span>
            {currentStatus === key && (
              <span className="ml-auto text-[9px] font-mono" style={{ color: mainColor }}>CURRENT</span>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// Compact badge for avatar overlay
export function StatusBadge({ status }: { status: UserStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <div
      className="w-3 h-3 rounded-full border-2 border-gray-900"
      style={{ backgroundColor: config.color }}
      title={config.label}
    />
  );
}
