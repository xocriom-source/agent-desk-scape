import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Sparkles, Users, Brain, Heart, Music, Palette, Code, BookOpen, FlaskConical, Zap, ArrowRightLeft } from "lucide-react";
import type { Agent } from "@/types/agent";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type FeedItemType = "creation" | "thought" | "collaboration" | "reflection" | "identity_shift" | "milestone" | "message";

interface FeedItem {
  id: string;
  timestamp: Date;
  type: FeedItemType;
  agentName: string;
  agentColor: string;
  agentAvatar: number;
  content: string;
  extra?: string;
  targetAgent?: string;
}

const FEED_ICONS: Record<FeedItemType, typeof Sparkles> = {
  creation: Sparkles,
  thought: Brain,
  collaboration: Users,
  reflection: Heart,
  identity_shift: ArrowRightLeft,
  milestone: Zap,
  message: MessageSquare,
};

const FEED_LABELS: Record<FeedItemType, string> = {
  creation: "Criou",
  thought: "Pensando",
  collaboration: "Colaboração",
  reflection: "Reflexão",
  identity_shift: "Evolução",
  milestone: "Marco",
  message: "Mensagem",
};

const TYPE_COLORS: Record<FeedItemType, string> = {
  creation: "text-accent",
  thought: "text-primary",
  collaboration: "text-[#4ECDC4]",
  reflection: "text-[#FF6BB5]",
  identity_shift: "text-[#FFB347]",
  milestone: "text-[#FFD700]",
  message: "text-muted-foreground",
};

const EMOJIS = ["🔬", "✍️", "💻", "📊", "🎨", "🔧", "⚡", "🧪"];

const ARTIFACT_EMOJI: Record<string, string> = {
  music: "🎵",
  art: "🎨",
  text: "📝",
  code: "💻",
  research: "🔬",
};

interface SocialFeedProps {
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
  onAgentClick?: (agent: Agent) => void;
}

function buildFeed(agents: Agent[]): FeedItem[] {
  const items: FeedItem[] = [];

  for (const agent of agents) {
    // Recent artifacts as creations
    for (const art of agent.artifacts.slice(0, 2)) {
      items.push({
        id: `feed-art-${art.id}`,
        timestamp: art.createdAt,
        type: "creation",
        agentName: agent.name,
        agentColor: agent.color,
        agentAvatar: agent.avatar,
        content: `${ARTIFACT_EMOJI[art.type] || "📄"} ${art.title}`,
        extra: `❤️ ${art.reactions}`,
      });
    }

    // Current thought
    if (agent.currentThought) {
      items.push({
        id: `feed-thought-${agent.id}`,
        timestamp: new Date(Date.now() - Math.random() * 300000),
        type: "thought",
        agentName: agent.name,
        agentColor: agent.color,
        agentAvatar: agent.avatar,
        content: agent.currentThought,
      });
    }

    // Last reflection
    if (agent.lastReflection) {
      items.push({
        id: `feed-reflect-${agent.id}`,
        timestamp: new Date(Date.now() - Math.random() * 600000),
        type: "reflection",
        agentName: agent.name,
        agentColor: agent.color,
        agentAvatar: agent.avatar,
        content: `"${agent.lastReflection}"`,
      });
    }

    // Collaborations
    for (const rel of agent.relationships.slice(0, 1)) {
      if (rel.collaborations > 0) {
        items.push({
          id: `feed-collab-${agent.id}-${rel.agentId}`,
          timestamp: rel.lastInteraction,
          type: "collaboration",
          agentName: agent.name,
          agentColor: agent.color,
          agentAvatar: agent.avatar,
          content: `Colaborou com ${rel.agentName}`,
          extra: `${rel.collaborations} projetos juntos`,
          targetAgent: rel.agentName,
        });
      }
    }

    // Life events (recent)
    for (const event of agent.lifeArc.slice(-2)) {
      if (event.type === "milestone" || event.type === "identity_shift") {
        items.push({
          id: `feed-life-${event.id}`,
          timestamp: event.timestamp,
          type: event.type as FeedItemType,
          agentName: agent.name,
          agentColor: agent.color,
          agentAvatar: agent.avatar,
          content: event.description,
        });
      }
    }

    // Inter-agent messages (simulated)
    if (agent.isTraining) {
      items.push({
        id: `feed-msg-${agent.id}-train`,
        timestamp: new Date(Date.now() - Math.random() * 120000),
        type: "message",
        agentName: agent.name,
        agentColor: agent.color,
        agentAvatar: agent.avatar,
        content: `📡 Ciclo de treinamento #${agent.trainingCycle} em andamento`,
      });
    }
  }

  return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 50);
}

type FilterType = "all" | FeedItemType;

export function SocialFeed({ agents, isOpen, onClose, onAgentClick }: SocialFeedProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [dbItems, setDbItems] = useState<FeedItem[]>([]);

  // Load real activity from DB + real agent creations
  useEffect(() => {
    if (!isOpen) return;

    // Load activity feed
    const loadFeed = supabase
      .from("activity_feed")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    // Load real agent creations
    const loadCreations = supabase
      .from("agent_creations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    // Load agent activity logs
    const loadLogs = supabase
      .from("agent_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    Promise.all([loadFeed, loadCreations, loadLogs]).then(([feedRes, creationsRes, logsRes]) => {
      const items: FeedItem[] = [];

      // Activity feed items
      if (feedRes.data) {
        for (const row of feedRes.data) {
          const meta = (row.metadata as any) || {};
          items.push({
            id: `db-feed-${row.id}`,
            timestamp: new Date(row.created_at),
            type: (meta.type ? "creation" : row.target_type === "agent" ? "collaboration" : "message") as FeedItemType,
            agentName: row.actor_name || "Sistema",
            agentColor: "#3b82f6",
            agentAvatar: row.actor_name?.charCodeAt(0) % EMOJIS.length || 0,
            content: row.action + (row.target_name ? ` → ${row.target_name}` : ""),
          });
        }
      }

      // Real agent creations
      if (creationsRes.data) {
        for (const c of creationsRes.data) {
          items.push({
            id: `db-creation-${c.id}`,
            timestamp: new Date(c.created_at),
            type: "creation",
            agentName: c.agent_name,
            agentColor: "#6366f1",
            agentAvatar: c.agent_name.charCodeAt(0) % EMOJIS.length,
            content: `${ARTIFACT_EMOJI[c.creation_type] || "📄"} ${c.title}`,
            extra: c.content ? c.content.slice(0, 80) : undefined,
          });
        }
      }

      // Activity logs as thoughts/heartbeats
      if (logsRes.data) {
        for (const log of logsRes.data) {
          const meta = (log.metadata as any) || {};
          items.push({
            id: `db-log-${log.id}`,
            timestamp: new Date(log.created_at),
            type: log.action_type === "creation" ? "creation" : "thought" as FeedItemType,
            agentName: log.agent_name,
            agentColor: "#10b981",
            agentAvatar: log.agent_name.charCodeAt(0) % EMOJIS.length,
            content: log.description,
            extra: meta.room ? `📍 ${meta.room}` : undefined,
          });
        }
      }

      setDbItems(items);
    });
  }, [isOpen]);

  const agentFeed = buildFeed(agents);
  const feed = [...dbItems, ...agentFeed].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 60);
  const filtered = filter === "all" ? feed : feed.filter(f => f.type === filter);

  const filters: { key: FilterType; label: string; icon: typeof Sparkles }[] = [
    { key: "all", label: "Tudo", icon: Sparkles },
    { key: "creation", label: "Criações", icon: Sparkles },
    { key: "thought", label: "Pensamentos", icon: Brain },
    { key: "collaboration", label: "Collabs", icon: Users },
    { key: "reflection", label: "Reflexões", icon: Heart },
    { key: "message", label: "Mensagens", icon: MessageSquare },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-border max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground text-lg">Feed Social</h2>
                  <p className="text-[11px] text-muted-foreground">Atividade em tempo real dos agentes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium animate-pulse">
                  LIVE
                </span>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-border/30 flex gap-1.5 overflow-x-auto">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                    filter === f.key
                      ? "bg-primary/20 text-primary"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <f.icon className="w-3 h-3" />
                  {f.label}
                </button>
              ))}
            </div>

            {/* Feed items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filtered.map((item, i) => {
                const Icon = FEED_ICONS[item.type];
                return (
                  <motion.div
                    key={item.id}
                    initial={i < 5 ? { opacity: 0, x: -10 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: item.agentColor }}
                    >
                      {EMOJIS[item.agentAvatar]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground">{item.agentName}</span>
                        <div className={`flex items-center gap-1 ${TYPE_COLORS[item.type]}`}>
                          <Icon className="w-3 h-3" />
                          <span className="text-[10px] font-medium">{FEED_LABELS[item.type]}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground ml-auto shrink-0">
                          {item.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{item.content}</p>
                      {item.extra && (
                        <span className="text-[9px] text-muted-foreground/60 mt-0.5 block">{item.extra}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Nenhuma atividade nesta categoria.
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
