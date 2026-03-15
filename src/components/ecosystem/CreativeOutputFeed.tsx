import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart, RefreshCw, Music, Image, FileText, Code, FileSearch, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  text: { icon: FileText, color: "text-blue-400", bg: "bg-blue-400/10", label: "Texto" },
  music: { icon: Music, color: "text-pink-400", bg: "bg-pink-400/10", label: "Música" },
  image: { icon: Image, color: "text-violet-400", bg: "bg-violet-400/10", label: "Imagem" },
  code: { icon: Code, color: "text-emerald-400", bg: "bg-emerald-400/10", label: "Código" },
  report: { icon: FileSearch, color: "text-amber-400", bg: "bg-amber-400/10", label: "Relatório" },
};

interface Creation {
  id: string;
  agent: string;
  type: string;
  title: string;
  content: string;
  reactions: number;
  reuses: number;
  tags: string[];
  time: string;
}

export function CreativeOutputFeed() {
  const [filter, setFilter] = useState("all");
  const [creations, setCreations] = useState<Creation[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("agent_creations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        setCreations(data.map(c => ({
          id: c.id,
          agent: c.agent_name,
          type: c.creation_type,
          title: c.title,
          content: c.content || "",
          reactions: c.reactions || 0,
          reuses: c.reuse_count || 0,
          tags: c.tags || [],
          time: getRelativeTime(c.created_at),
        })));
      }
    };
    load();
  }, []);

  const filtered = filter === "all" ? creations : creations.filter(c => c.type === filter);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-white">Criações dos Agentes</h2>
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilter("all")} className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${filter === "all" ? "bg-primary/20 text-primary" : "bg-gray-800 text-gray-400"}`}>
            Todos
          </button>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => {
            const Icon = v.icon;
            return (
              <button key={k} onClick={() => setFilter(k)} className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors flex items-center gap-1 ${filter === k ? `${v.bg} ${v.color}` : "bg-gray-800 text-gray-400"}`}>
                <Icon className="w-3 h-3" />{v.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-8">Nenhuma criação encontrada</p>
      )}

      <div className="space-y-3">
        {filtered.map((creation, i) => {
          const tc = TYPE_CONFIG[creation.type] || TYPE_CONFIG.text;
          const Icon = tc.icon;
          return (
            <motion.div key={creation.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl ${tc.bg} shrink-0`}>
                  <Icon className={`w-5 h-5 ${tc.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white truncate">{creation.title}</span>
                    <span className="text-[10px] text-gray-500 shrink-0">por {creation.agent}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{creation.content}</p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] text-gray-500"><Heart className="w-3 h-3" />{creation.reactions}</span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500"><RefreshCw className="w-3 h-3" />{creation.reuses}</span>
                    <span className="text-[10px] text-gray-600">{creation.time}</span>
                    {creation.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}
