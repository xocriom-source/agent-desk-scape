import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ExternalLink, CheckCircle, Settings, AlertCircle } from "lucide-react";

const INTEGRATIONS = [
  { name: "Google Calendar", icon: "📅", description: "Sincronizar reuniões e eventos", category: "Calendário", docs: "calendar.google.com" },
  { name: "Slack", icon: "💬", description: "Notificações e chat integrado", category: "Comunicação", docs: "api.slack.com" },
  { name: "GitHub", icon: "🐙", description: "Repositórios e CI/CD", category: "Desenvolvimento", docs: "github.com" },
  { name: "Zapier", icon: "⚡", description: "Automações e integrações via workflow", category: "Automação", docs: "zapier.com" },
  { name: "Outlook", icon: "📧", description: "Email e calendário corporativo", category: "Calendário", docs: "outlook.com" },
  { name: "Discord", icon: "🎮", description: "Comunicação em tempo real para times", category: "Comunicação", docs: "discord.com" },
  { name: "Notion", icon: "📝", description: "Documentação e bases de conhecimento", category: "Produtividade", docs: "notion.so" },
  { name: "Figma", icon: "🎨", description: "Design e prototipagem colaborativa", category: "Design", docs: "figma.com" },
  { name: "Linear", icon: "📐", description: "Gestão de projetos e issues", category: "Produtividade", docs: "linear.app" },
  { name: "n8n", icon: "🔗", description: "Automação de workflows open source", category: "Automação", docs: "n8n.io" },
];

export function AdminIntegrations() {
  const [enabled, setEnabled] = useState<Set<string>>(new Set());
  const [configuring, setConfiguring] = useState<string | null>(null);

  const toggle = (name: string) => {
    if (!enabled.has(name)) {
      setConfiguring(name);
      return;
    }
    setEnabled(prev => { const next = new Set(prev); next.delete(name); return next; });
    toast.info(`${name} desabilitado`);
  };

  const confirmEnable = (name: string) => {
    setEnabled(prev => { const next = new Set(prev); next.add(name); return next; });
    setConfiguring(null);
    toast.success(`${name} habilitado com sucesso`);
  };

  const categories = [...new Set(INTEGRATIONS.map(i => i.category))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-display font-bold text-primary tracking-wider">INTEGRAÇÕES</h1>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
          {enabled.size} de {INTEGRATIONS.length} integrações ativas
        </p>
      </div>

      {/* Status summary */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-400/10 border border-emerald-400/20">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-mono font-bold text-emerald-400">{enabled.size} Ativas</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-primary/10">
          <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-mono font-bold text-muted-foreground">{INTEGRATIONS.length - enabled.size} Disponíveis</span>
        </div>
      </div>

      {categories.map(cat => (
        <div key={cat}>
          <h2 className="text-[10px] font-mono font-bold text-muted-foreground tracking-widest mb-3">{cat.toUpperCase()}</h2>
          <div className="space-y-2">
            {INTEGRATIONS.filter(i => i.category === cat).map((i, idx) => (
              <motion.div key={i.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                  enabled.has(i.name) ? "border-emerald-400/20 bg-emerald-400/[0.03]" : "border-primary/10 bg-primary/[0.03]"
                }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{i.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-foreground">{i.name}</span>
                      {enabled.has(i.name) && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <p className="text-[9px] font-mono text-muted-foreground">{i.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {enabled.has(i.name) && (
                    <button className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Configurar">
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => toggle(i.name)}
                    className={`px-4 py-2 rounded-lg text-[9px] font-mono font-bold transition-colors ${
                      enabled.has(i.name)
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}>
                    {enabled.has(i.name) ? "DESABILITAR" : "CONFIGURAR"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Configuration Modal */}
      {configuring && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConfiguring(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-background border border-primary/20 rounded-2xl p-6 max-w-md w-full mx-4 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{INTEGRATIONS.find(i => i.name === configuring)?.icon}</span>
              <div>
                <h3 className="text-lg font-display font-bold text-foreground">{configuring}</h3>
                <p className="text-[10px] font-mono text-muted-foreground">{INTEGRATIONS.find(i => i.name === configuring)?.description}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-muted-foreground block mb-1">API KEY</label>
                <input placeholder="Insira a API key..." className="w-full px-3 py-2.5 rounded-xl border border-primary/10 bg-primary/[0.03] text-xs font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/30" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-muted-foreground block mb-1">WEBHOOK URL (opcional)</label>
                <input placeholder="https://..." className="w-full px-3 py-2.5 rounded-xl border border-primary/10 bg-primary/[0.03] text-xs font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/30" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setConfiguring(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-primary/10 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
                CANCELAR
              </button>
              <button onClick={() => confirmEnable(configuring)} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-mono font-bold tracking-wider hover:bg-primary/90 transition-colors">
                HABILITAR
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
