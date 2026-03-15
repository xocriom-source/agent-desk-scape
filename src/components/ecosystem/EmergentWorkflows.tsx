import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Workflow, ArrowRight, Save, Check, Zap, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  sequence: string[];
  detections: number;
  isSaved: boolean;
  firstDetected: string;
}

export function EmergentWorkflows() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("emergent_workflows")
        .select("*")
        .order("detection_count", { ascending: false });
      if (data) {
        setWorkflows(data.map(w => ({
          id: w.id,
          name: w.name,
          description: w.description || "",
          sequence: Array.isArray(w.sequence) ? (w.sequence as string[]) : [],
          detections: w.detection_count || 0,
          isSaved: w.is_saved || false,
          firstDetected: w.first_detected_at,
        })));
      }
    };
    load();
  }, []);

  const toggleSave = async (id: string) => {
    const wf = workflows.find(w => w.id === id);
    if (!wf || !user) return;
    const newSaved = !wf.isSaved;
    await supabase.from("emergent_workflows").update({
      is_saved: newSaved,
      saved_by: newSaved ? user.id : null,
    }).eq("id", id);
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, isSaved: newSaved } : w));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Workflow className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Workflows Emergentes</h2>
        <span className="text-xs text-gray-500">{workflows.length} detectados</span>
      </div>

      {workflows.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-8">Nenhum workflow emergente detectado</p>
      )}

      <div className="space-y-4">
        {workflows.map((wf, i) => (
          <motion.div key={wf.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {wf.name}
                  {wf.isSaved && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">{wf.description} · Detectado {wf.detections}x</p>
              </div>
              <button onClick={() => toggleSave(wf.id)}
                className={`p-2 rounded-lg transition-colors ${wf.isSaved ? "bg-emerald-400/10 text-emerald-400" : "bg-gray-800 text-gray-400 hover:text-primary"}`}>
                {wf.isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {wf.sequence.map((agent, j) => (
                <div key={j} className="flex items-center gap-1 shrink-0">
                  <span className="px-2.5 py-1.5 bg-gray-800 rounded-lg text-[10px] font-medium text-gray-300">{agent}</span>
                  {j < wf.sequence.length - 1 && <ArrowRight className="w-3 h-3 text-gray-600 shrink-0" />}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{wf.detections} detecções</span>
              <span>{new Date(wf.firstDetected).toLocaleDateString("pt-BR")}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
