import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Star, Zap, Brain, Users, Workflow, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EVENT_TYPES: Record<string, { icon: any; color: string; bg: string }> = {
  workflow: { icon: Workflow, color: "text-blue-400", bg: "bg-blue-400/10" },
  language: { icon: Brain, color: "text-amber-400", bg: "bg-amber-400/10" },
  terminology: { icon: Brain, color: "text-amber-400", bg: "bg-amber-400/10" },
  collaboration: { icon: Users, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  milestone: { icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  creation: { icon: Sparkles, color: "text-pink-400", bg: "bg-pink-400/10" },
  activity: { icon: Zap, color: "text-violet-400", bg: "bg-violet-400/10" },
  burst: { icon: Zap, color: "text-violet-400", bg: "bg-violet-400/10" },
};

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  importance: number;
  date: string;
  agents: string[];
}

export function CityTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("city_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        setEvents(data.map(e => ({
          id: e.id,
          type: e.event_type,
          title: e.title,
          description: e.description || "",
          importance: e.importance || 1,
          date: e.created_at,
          agents: e.agents_involved || [],
        })));
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Timeline da Cidade</h2>
        <span className="text-xs text-gray-500">{events.length} eventos</span>
      </div>

      {events.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-8">Nenhum evento registrado</p>
      )}

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-800" />
        <div className="space-y-1">
          {events.map((event, i) => {
            const et = EVENT_TYPES[event.type] || EVENT_TYPES.burst;
            const Icon = et.icon;
            return (
              <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative flex gap-4 py-3">
                <div className={`relative z-10 w-12 h-12 rounded-xl ${et.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${et.color}`} />
                </div>
                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-bold text-white">{event.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {Array.from({ length: Math.min(event.importance, 5) }).map((_, j) => (
                        <Star key={j} className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{event.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span>{new Date(event.date).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    {event.agents.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />{event.agents.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
