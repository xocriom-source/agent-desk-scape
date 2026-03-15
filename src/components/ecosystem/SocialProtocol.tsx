import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Handshake, Check, X, Clock, ArrowRight, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  collaboration_request: { label: "Colaboração", color: "text-blue-400" },
  task_negotiation: { label: "Negociação", color: "text-amber-400" },
  task_delegation: { label: "Delegação", color: "text-cyan-400" },
  information_request: { label: "Info", color: "text-violet-400" },
  confirmation: { label: "Confirmação", color: "text-emerald-400" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Pendente", color: "text-amber-400", bg: "bg-amber-400/10", icon: Clock },
  accepted: { label: "Aceito", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: Check },
  completed: { label: "Concluído", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: Check },
  rejected: { label: "Rejeitado", color: "text-red-400", bg: "bg-red-400/10", icon: X },
};

interface Protocol {
  id: string;
  from: string;
  to: string;
  type: string;
  status: string;
  message: string;
  time: string;
}

export function SocialProtocol() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("agent_protocols")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        setProtocols(data.map(p => ({
          id: p.id,
          from: p.from_agent,
          to: p.to_agent,
          type: p.protocol_type,
          status: p.status || "pending",
          message: p.message || "",
          time: getRelativeTime(p.created_at),
        })));
      }
    };
    load();
  }, []);

  const stats = {
    total: protocols.length,
    pending: protocols.filter(p => p.status === "pending").length,
    accepted: protocols.filter(p => ["accepted", "completed"].includes(p.status)).length,
    rejected: protocols.filter(p => p.status === "rejected").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Handshake className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Protocolo Social</h2>
        <span className="text-xs text-gray-500">Coordenação entre agentes</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Pendentes", value: stats.pending, color: "text-amber-400" },
          { label: "Aceitos", value: stats.accepted, color: "text-emerald-400" },
          { label: "Rejeitados", value: stats.rejected, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {protocols.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-8">Nenhum protocolo registrado</p>
      )}

      <div className="space-y-2">
        {protocols.map((protocol, i) => {
          const tl = TYPE_LABELS[protocol.type] || TYPE_LABELS.collaboration_request;
          const sc = STATUS_CONFIG[protocol.status] || STATUS_CONFIG.pending;
          const StatusIcon = sc.icon;
          return (
            <motion.div key={protocol.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-white">{protocol.from}</span>
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                  <span className="font-bold text-white">{protocol.to}</span>
                  <span className={`text-[9px] ${tl.color}`}>({tl.label})</span>
                </div>
                <span className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                  <StatusIcon className="w-3 h-3" />{sc.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 flex items-start gap-1.5">
                <MessageCircle className="w-3 h-3 mt-0.5 shrink-0 text-gray-600" />{protocol.message}
              </p>
              <p className="text-[9px] text-gray-600 mt-2">{protocol.time}</p>
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
