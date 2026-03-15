import { useState } from "react";
import { motion } from "framer-motion";
import { X, Upload, FileText, BookOpen, Workflow, FileCheck, Brain, Trash2 } from "lucide-react";

interface TrainingDoc {
  id: string;
  name: string;
  type: "document" | "knowledge-base" | "workflow" | "sop";
  size: string;
  status: "trained" | "processing" | "queued";
  addedAt: string;
}

const MOCK_DOCS: TrainingDoc[] = [
  { id: "t1", name: "Product Roadmap 2026.pdf", type: "document", size: "2.4 MB", status: "trained", addedAt: "2d ago" },
  { id: "t2", name: "Sales Playbook", type: "knowledge-base", size: "12 entries", status: "trained", addedAt: "3d ago" },
  { id: "t3", name: "Onboarding Flow", type: "workflow", size: "8 steps", status: "processing", addedAt: "1h ago" },
  { id: "t4", name: "Customer Support SOP", type: "sop", size: "1.8 MB", status: "queued", addedAt: "now" },
];

const TYPE_ICONS = {
  document: FileText,
  "knowledge-base": BookOpen,
  workflow: Workflow,
  sop: FileCheck,
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agentName?: string;
}

export function AgentTraining({ isOpen, onClose, agentName = "Atlas" }: Props) {
  const [docs, setDocs] = useState(MOCK_DOCS);
  const [dragOver, setDragOver] = useState(false);

  const mainColor = "#6b8fc4";

  const trainedCount = docs.filter(d => d.status === "trained").length;

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
        className="w-[480px] max-h-[80vh] rounded-xl border overflow-hidden flex flex-col"
        style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.98)" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" style={{ color: mainColor }} />
            <span className="text-xs font-mono font-bold tracking-wider text-white">TRAIN {agentName.toUpperCase()}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: "#34d39915", color: "#34d399" }}>
              {trainedCount}/{docs.length} trained
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>

        {/* Upload area */}
        <div
          className={`mx-4 mt-4 p-6 rounded-lg border-2 border-dashed text-center transition-colors ${dragOver ? "border-opacity-100" : "border-opacity-30"}`}
          style={{ borderColor: mainColor, backgroundColor: dragOver ? `${mainColor}10` : "transparent" }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); }}
        >
          <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: `${mainColor}60` }} />
          <p className="text-[11px] font-mono text-white mb-1">Drop files to train</p>
          <p className="text-[9px] font-mono" style={{ color: `${mainColor}50` }}>PDF, DOC, MD, TXT, JSON supported</p>
        </div>

        {/* Training categories */}
        <div className="flex gap-2 px-4 py-3">
          {[
            { label: "Documents", icon: FileText },
            { label: "Knowledge Base", icon: BookOpen },
            { label: "Workflows", icon: Workflow },
            { label: "SOPs", icon: FileCheck },
          ].map(cat => (
            <button
              key={cat.label}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-center transition-colors hover:bg-white/5"
            >
              <cat.icon className="w-4 h-4" style={{ color: `${mainColor}70` }} />
              <span className="text-[8px] font-mono tracking-wider" style={{ color: `${mainColor}60` }}>{cat.label.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {docs.map(doc => {
            const Icon = TYPE_ICONS[doc.type];
            return (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: `${mainColor}12`, background: `${mainColor}05` }}>
                <Icon className="w-4 h-4 shrink-0" style={{ color: mainColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono text-white truncate">{doc.name}</p>
                  <p className="text-[8px] font-mono" style={{ color: `${mainColor}50` }}>{doc.size} · {doc.addedAt}</p>
                </div>
                <span className="text-[8px] font-mono px-2 py-0.5 rounded shrink-0" style={{
                  backgroundColor: doc.status === "trained" ? "#34d39915" : doc.status === "processing" ? "#fbbf2415" : `${mainColor}10`,
                  color: doc.status === "trained" ? "#34d399" : doc.status === "processing" ? "#fbbf24" : `${mainColor}60`,
                }}>
                  {doc.status.toUpperCase()}
                </span>
                <button onClick={() => setDocs(prev => prev.filter(d => d.id !== doc.id))} className="p-1 rounded hover:bg-white/10">
                  <Trash2 className="w-3 h-3 text-gray-600" />
                </button>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
