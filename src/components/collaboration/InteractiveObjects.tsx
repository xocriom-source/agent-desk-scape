import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Presentation, Video, ScreenShare, X, Maximize2, ExternalLink } from "lucide-react";

interface OfficeObject {
  id: string;
  name: string;
  type: "computer" | "whiteboard" | "meeting-table" | "tv-screen";
  icon: string;
  description: string;
  action: string;
}

const OFFICE_OBJECTS: OfficeObject[] = [
  { id: "o1", name: "Workstation", type: "computer", icon: "💻", description: "Access your personal dashboard, tasks, and analytics", action: "Open Dashboard" },
  { id: "o2", name: "Whiteboard", type: "whiteboard", icon: "📋", description: "Collaborative whiteboard for brainstorming and planning", action: "Open Whiteboard" },
  { id: "o3", name: "Meeting Table", type: "meeting-table", icon: "🪑", description: "Start a video call with your team or visitors", action: "Start Meeting" },
  { id: "o4", name: "TV Screen", type: "tv-screen", icon: "📺", description: "Share your screen or present slides to visitors", action: "Share Screen" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  buildingId?: string;
}

export function InteractiveObjects({ isOpen, onClose, buildingId }: Props) {
  const [selectedObject, setSelectedObject] = useState<OfficeObject | null>(null);
  const [activeApp, setActiveApp] = useState<string | null>(null);

  const mainColor = "#6b8fc4";

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[500px] max-w-[95vw] rounded-xl border overflow-hidden"
      style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.95)", backdropFilter: "blur(12px)" }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4" style={{ color: mainColor }} />
          <span className="text-xs font-mono font-bold tracking-wider text-white">INTERACTIVE OBJECTS</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {!selectedObject ? (
        <div className="grid grid-cols-2 gap-2 p-3">
          {OFFICE_OBJECTS.map(obj => (
            <button
              key={obj.id}
              onClick={() => setSelectedObject(obj)}
              className="flex items-start gap-3 p-3 rounded-lg border text-left transition-all hover:border-opacity-50"
              style={{ borderColor: `${mainColor}15`, background: `${mainColor}05` }}
            >
              <span className="text-2xl">{obj.icon}</span>
              <div>
                <h4 className="text-xs font-mono font-bold text-white tracking-wider">{obj.name}</h4>
                <p className="text-[9px] font-mono mt-1" style={{ color: `${mainColor}70` }}>{obj.description}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4">
          <button onClick={() => setSelectedObject(null)} className="text-[10px] font-mono tracking-wider mb-3" style={{ color: `${mainColor}60` }}>
            ← BACK TO OBJECTS
          </button>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{selectedObject.icon}</span>
            <div>
              <h3 className="text-sm font-mono font-bold text-white">{selectedObject.name}</h3>
              <p className="text-[10px] font-mono" style={{ color: `${mainColor}70` }}>{selectedObject.description}</p>
            </div>
          </div>

          {/* App content area */}
          <div className="rounded-lg border p-6 flex flex-col items-center justify-center min-h-[150px]" style={{ borderColor: `${mainColor}15`, background: `${mainColor}05` }}>
            {selectedObject.type === "computer" && (
              <div className="text-center">
                <Monitor className="w-10 h-10 mx-auto mb-3" style={{ color: mainColor }} />
                <p className="text-xs font-mono text-white mb-1">Personal Dashboard</p>
                <p className="text-[9px] font-mono" style={{ color: `${mainColor}60` }}>Tasks, analytics, and agent management</p>
              </div>
            )}
            {selectedObject.type === "whiteboard" && (
              <div className="text-center">
                <Presentation className="w-10 h-10 mx-auto mb-3" style={{ color: mainColor }} />
                <p className="text-xs font-mono text-white mb-1">Collaborative Whiteboard</p>
                <p className="text-[9px] font-mono" style={{ color: `${mainColor}60` }}>Draw, plan, and brainstorm in real-time</p>
              </div>
            )}
            {selectedObject.type === "meeting-table" && (
              <div className="text-center">
                <Video className="w-10 h-10 mx-auto mb-3" style={{ color: mainColor }} />
                <p className="text-xs font-mono text-white mb-1">Video Conference</p>
                <p className="text-[9px] font-mono" style={{ color: `${mainColor}60` }}>HD video + screen share + recording</p>
              </div>
            )}
            {selectedObject.type === "tv-screen" && (
              <div className="text-center">
                <ScreenShare className="w-10 h-10 mx-auto mb-3" style={{ color: mainColor }} />
                <p className="text-xs font-mono text-white mb-1">Screen Sharing</p>
                <p className="text-[9px] font-mono" style={{ color: `${mainColor}60` }}>Present to visitors and team members</p>
              </div>
            )}
          </div>

          <button
            className="w-full mt-3 py-2.5 rounded-lg text-xs font-mono font-bold tracking-wider"
            style={{ backgroundColor: `${mainColor}20`, color: mainColor }}
          >
            {selectedObject.action.toUpperCase()}
          </button>
        </div>
      )}
    </motion.div>
  );
}
