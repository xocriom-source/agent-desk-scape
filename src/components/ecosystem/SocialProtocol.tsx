import { motion } from "framer-motion";
import { Handshake, Check, X, Clock, ArrowRight, MessageCircle } from "lucide-react";

const MOCK_PROTOCOLS = [
  { id: "1", from: "Atlas", to: "Scribe", type: "collaboration_request", status: "accepted", message: "Solicita colaboração para redigir relatório de mercado baseado em pesquisa recente", time: "15m atrás" },
  { id: "2", from: "Nova", to: "Harmony", type: "task_negotiation", status: "pending", message: "Propõe criação conjunta de soundtrack para apresentação visual", time: "28m atrás" },
  { id: "3", from: "Coder-X", to: "Monitor", type: "confirmation", status: "pending", message: "Confirma deploy do hook useAgentStream em ambiente de produção?", time: "45m atrás" },
  { id: "4", from: "Pixel", to: "Nova", type: "collaboration_request", status: "accepted", message: "Solicita assets visuais para complementar composição ambient", time: "1h atrás" },
  { id: "5", from: "Monitor", to: "Atlas", type: "task_negotiation", status: "rejected", message: "Propõe reanálise de dados com novo modelo — rejeitado por redundância", time: "2h atrás" },
  { id: "6", from: "Scribe", to: "Coder-X", type: "confirmation", status: "accepted", message: "Confirma uso de API documentation no novo artigo técnico", time: "3h atrás" },
];

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  collaboration_request: { label: "Colaboração", color: "text-blue-400" },
  task_negotiation: { label: "Negociação", color: "text-amber-400" },
  confirmation: { label: "Confirmação", color: "text-emerald-400" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Pendente", color: "text-amber-400", bg: "bg-amber-400/10", icon: Clock },
  accepted: { label: "Aceito", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: Check },
  rejected: { label: "Rejeitado", color: "text-red-400", bg: "bg-red-400/10", icon: X },
};

export function SocialProtocol() {
  const stats = {
    total: MOCK_PROTOCOLS.length,
    pending: MOCK_PROTOCOLS.filter(p => p.status === "pending").length,
    accepted: MOCK_PROTOCOLS.filter(p => p.status === "accepted").length,
    rejected: MOCK_PROTOCOLS.filter(p => p.status === "rejected").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Handshake className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Protocolo Social</h2>
        <span className="text-xs text-gray-500">Coordenação entre agentes</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-gray-300" },
          { label: "Pendentes", value: stats.pending, color: "text-amber-400" },
          { label: "Aceitos", value: stats.accepted, color: "text-emerald-400" },
          { label: "Rejeitados", value: stats.rejected, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Protocol signals */}
      <div className="space-y-2">
        {MOCK_PROTOCOLS.map((protocol, i) => {
          const typeInfo = TYPE_LABELS[protocol.type];
          const statusInfo = STATUS_CONFIG[protocol.status];
          const StatusIcon = statusInfo.icon;
          return (
            <motion.div key={protocol.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-primary">{protocol.from}</span>
                <ArrowRight className="w-3 h-3 text-gray-600" />
                <span className="text-xs font-bold text-white">{protocol.to}</span>
                <span className={`text-[9px] ml-auto ${typeInfo.color}`}>{typeInfo.label}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${statusInfo.bg} ${statusInfo.color} flex items-center gap-1`}>
                  <StatusIcon className="w-2.5 h-2.5" />{statusInfo.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-3 h-3 text-gray-600 shrink-0" />
                <p className="text-[11px] text-gray-400 flex-1">{protocol.message}</p>
                <span className="text-[9px] text-gray-600 shrink-0">{protocol.time}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
