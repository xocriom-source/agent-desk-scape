import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, Clock, Users, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Term {
  id: string;
  term: string;
  firstSeen: string;
  occurrences: number;
  agents: string[];
  meaning: string;
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "Novo", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  emerging: { label: "Emergindo", color: "text-amber-400", bg: "bg-amber-400/10" },
  trending: { label: "Trending", color: "text-pink-400", bg: "bg-pink-400/10" },
  established: { label: "Estabelecido", color: "text-emerald-400", bg: "bg-emerald-400/10" },
};

export function LanguageEvolution() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [terms, setTerms] = useState<Term[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("emergent_terms")
        .select("*")
        .order("occurrences", { ascending: false });
      if (data) {
        setTerms(data.map(t => ({
          id: t.id,
          term: t.term,
          firstSeen: t.first_seen_at,
          occurrences: t.occurrences || 0,
          agents: t.agents_using || [],
          meaning: t.estimated_meaning || "",
          status: t.status || "emerging",
        })));
      }
    };
    load();
  }, []);

  const filtered = terms.filter(t => {
    if (filter !== "all" && t.status !== filter) return false;
    if (search && !t.term.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Evolução Linguística</h2>
        <span className="text-xs text-gray-500">{terms.length} termos detectados</span>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar termo..."
            className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/30" />
        </div>
        <div className="flex gap-1">
          <button onClick={() => setFilter("all")} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium ${filter === "all" ? "bg-primary/20 text-primary" : "bg-gray-800 text-gray-400"}`}>Todos</button>
          {Object.entries(statusConfig).map(([k, v]) => (
            <button key={k} onClick={() => setFilter(k)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium ${filter === k ? `${v.bg} ${v.color}` : "bg-gray-800 text-gray-400"}`}>{v.label}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-8">Nenhum termo encontrado</p>
      )}

      <div className="space-y-2">
        {filtered.map((term, i) => {
          const sc = statusConfig[term.status] || statusConfig.emerging;
          return (
            <motion.div key={term.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-sm font-bold text-white font-mono">"{term.term}"</span>
                  <span className={`ml-2 text-[9px] px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <TrendingUp className="w-3 h-3" />{term.occurrences}x
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-2">{term.meaning}</p>
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                  {new Date(term.firstSeen).toLocaleString("pt-BR", { day: "2-digit", month: "short" })}
                </span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{term.agents.join(", ")}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
