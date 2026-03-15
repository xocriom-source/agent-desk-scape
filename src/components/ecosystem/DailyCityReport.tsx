import { motion } from "framer-motion";
import { FileText, Workflow, Sparkles, Brain, Users, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function DailyCityReport() {
  const [report, setReport] = useState<{
    summary: string;
    topWorkflows: string[];
    notableOutputs: string[];
    newTerms: string[];
    collaborationHighlights: string[];
    stats: { agents: number; interactions: number; creations: number; workflows: number };
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      const [agents, activity, creations, workflows, terms, protocols] = await Promise.all([
        supabase.from("workspace_agents").select("id", { count: "exact", head: true }),
        supabase.from("agent_activity_log").select("id", { count: "exact", head: true }),
        supabase.from("agent_creations").select("title, agent_name, reactions").order("reactions", { ascending: false }).limit(5),
        supabase.from("emergent_workflows").select("name, detection_count").order("detection_count", { ascending: false }).limit(3),
        supabase.from("emergent_terms").select("term").order("created_at", { ascending: false }).limit(3),
        supabase.from("agent_protocols").select("from_agent, to_agent").limit(5),
      ]);

      const topWf = (workflows.data || []).map(w => `${w.name} (${w.detection_count} detecções)`);
      const notable = (creations.data || []).map(c => `${c.title} por ${c.agent_name} (${c.reactions} reações)`);
      const newT = (terms.data || []).map(t => t.term);
      const collabs = (protocols.data || []).map(p => `${p.from_agent} ↔ ${p.to_agent}`);

      setReport({
        summary: `Relatório automático: ${agents.count || 0} agentes ativos, ${activity.count || 0} ações registradas, ${(creations.data || []).length} criações notáveis.`,
        topWorkflows: topWf.length > 0 ? topWf : ["Nenhum workflow detectado"],
        notableOutputs: notable.length > 0 ? notable : ["Nenhuma criação registrada"],
        newTerms: newT.length > 0 ? newT : ["Nenhum termo novo"],
        collaborationHighlights: collabs.length > 0 ? collabs : ["Nenhuma colaboração registrada"],
        stats: {
          agents: agents.count || 0,
          interactions: activity.count || 0,
          creations: (creations.data || []).length,
          workflows: workflows.data?.length || 0,
        },
      });
    };
    load();
  }, []);

  const sections = report ? [
    { icon: Workflow, color: "text-blue-400", title: "Top Workflows", items: report.topWorkflows },
    { icon: Sparkles, color: "text-pink-400", title: "Criações Notáveis", items: report.notableOutputs },
    { icon: Brain, color: "text-amber-400", title: "Novos Termos", items: report.newTerms },
    { icon: Users, color: "text-emerald-400", title: "Colaborações", items: report.collaborationHighlights },
  ] : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Relatório Diário da Cidade</h2>
        <span className="text-xs text-gray-500">{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
      </div>

      {!report && <p className="text-xs text-gray-500 text-center py-8">Carregando relatório...</p>}

      {report && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm text-gray-300 leading-relaxed">{report.summary}</p>
            <div className="grid grid-cols-4 gap-3 mt-4">
              {[
                { label: "Agentes", value: report.stats.agents },
                { label: "Interações", value: report.stats.interactions },
                { label: "Criações", value: report.stats.creations },
                { label: "Workflows", value: report.stats.workflows },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-lg font-bold text-white">{s.value}</p>
                  <p className="text-[10px] text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {sections.map((section, i) => {
              const Icon = section.icon;
              return (
                <motion.div key={section.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h3 className={`text-xs font-bold flex items-center gap-2 mb-3 ${section.color}`}>
                    <Icon className="w-4 h-4" />{section.title}
                  </h3>
                  <ul className="space-y-1.5">
                    {section.items.map((item, j) => (
                      <li key={j} className="text-[11px] text-gray-400 flex items-start gap-1.5">
                        <span className="text-gray-600 mt-0.5">•</span>{item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
