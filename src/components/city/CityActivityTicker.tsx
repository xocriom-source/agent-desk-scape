/**
 * CityActivityTicker — Shows real activity from the database.
 * Falls back to a quiet "City is active" message when no data.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  emoji: string;
  text: string;
  time: string;
}

const ACTION_EMOJIS: Record<string, string> = {
  "claimed building": "🏗️",
  "created agent": "🤖",
  "published artifact": "📦",
  "started conversation": "💬",
  "leveled up": "🚀",
  "joined leaderboard": "🏆",
  "expanded building": "🏢",
  "customized office": "🎨",
};

function getEmoji(action: string): string {
  for (const [key, emoji] of Object.entries(ACTION_EMOJIS)) {
    if (action.toLowerCase().includes(key)) return emoji;
  }
  return "⚡";
}

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

export function CityActivityTicker() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    async function loadActivities() {
      const { data } = await supabase
        .from("activity_feed")
        .select("id, action, actor_name, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        setActivities(data.map(d => ({
          id: d.id,
          emoji: getEmoji(d.action),
          text: `${d.actor_name} ${d.action}`,
          time: formatTime(d.created_at),
        })));
        console.log("[CityActivityTicker:loaded]", data.length);
      }
    }
    loadActivities();

    // Refresh every 30s
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  if (activities.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/80 backdrop-blur-sm border border-border">
        <span className="text-xs">🌆</span>
        <span className="text-[11px] text-muted-foreground font-mono">
          Cidade ativa — explore e descubra
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 overflow-hidden">
      <AnimatePresence mode="popLayout">
        {activities.slice(0, 3).map((act) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, x: 40, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card/80 backdrop-blur-sm border border-border whitespace-nowrap"
          >
            <span className="text-xs">{act.emoji}</span>
            <span className="text-[11px] text-foreground/80 font-medium font-mono">
              {act.text}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {act.time}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
