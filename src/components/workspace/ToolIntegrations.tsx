import { useState } from "react";
import { motion } from "framer-motion";
import { X, Link2, Check, Settings, ExternalLink } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  icon: string;
  description: string;
  connected: boolean;
  category: string;
}

const INTEGRATIONS: Integration[] = [
  { id: "gcal", name: "Google Calendar", icon: "📅", description: "Sincronize eventos e atualize status automaticamente", connected: false, category: "Produtividade" },
  { id: "slack", name: "Slack", icon: "💬", description: "Receba notificações e envie mensagens do workspace", connected: true, category: "Comunicação" },
  { id: "github", name: "GitHub", icon: "🐙", description: "Visualize PRs, issues e commits no workspace", connected: false, category: "Desenvolvimento" },
  { id: "zapier", name: "Zapier", icon: "⚡", description: "Automatize workflows entre plataformas", connected: false, category: "Automação" },
  { id: "outlook", name: "Microsoft Outlook", icon: "📧", description: "E-mails e calendário integrados", connected: false, category: "Produtividade" },
  { id: "notion", name: "Notion", icon: "📝", description: "Sincronize documentos e bases de conhecimento", connected: true, category: "Documentação" },
  { id: "figma", name: "Figma", icon: "🎨", description: "Visualize designs e protótipos no whiteboard", connected: false, category: "Design" },
  { id: "jira", name: "Jira", icon: "📋", description: "Acompanhe tickets e sprints do workspace", connected: false, category: "Desenvolvimento" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ToolIntegrations({ isOpen, onClose }: Props) {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const mainColor = "#6b8fc4";

  const toggle = (id: string) => {
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, connected: !i.connected } : i));
  };

  if (!isOpen) return null;

  const categories = [...new Set(integrations.map(i => i.category))];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[550px] md:h-[480px] z-50 rounded-2xl border overflow-hidden flex flex-col"
      style={{ borderColor: `${mainColor}30`, background: "rgba(13,21,37,0.97)", backdropFilter: "blur(16px)" }}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: `${mainColor}15` }}>
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4" style={{ color: mainColor }} />
          <span className="text-xs font-mono font-bold tracking-wider text-white">INTEGRAÇÕES</span>
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${mainColor}10`, color: mainColor }}>
            {integrations.filter(i => i.connected).length} conectadas
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5"><X className="w-4 h-4 text-gray-500" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {categories.map(cat => (
          <div key={cat}>
            <p className="text-[9px] font-mono font-bold tracking-wider mb-2" style={{ color: `${mainColor}40` }}>{cat.toUpperCase()}</p>
            <div className="space-y-2">
              {integrations.filter(i => i.category === cat).map(integ => (
                <div key={integ.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: integ.connected ? `${mainColor}30` : `${mainColor}10` }}>
                  <span className="text-xl">{integ.icon}</span>
                  <div className="flex-1">
                    <p className="text-[11px] font-mono font-bold text-white">{integ.name}</p>
                    <p className="text-[9px] font-mono" style={{ color: `${mainColor}40` }}>{integ.description}</p>
                  </div>
                  <button onClick={() => toggle(integ.id)}
                    className="px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold tracking-wider transition-all"
                    style={integ.connected ? { backgroundColor: "#34d39920", color: "#34d399" } : { backgroundColor: `${mainColor}15`, color: mainColor }}
                  >
                    {integ.connected ? <><Check className="w-3 h-3 inline mr-1" />CONECTADO</> : "CONECTAR"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
