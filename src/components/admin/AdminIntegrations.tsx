import { useState } from "react";
import { toast } from "sonner";

const INTEGRATIONS = [
  { name: "Google Calendar", icon: "📅", description: "Sincronizar reuniões e eventos" },
  { name: "Slack", icon: "💬", description: "Notificações e chat integrado" },
  { name: "GitHub", icon: "🐙", description: "Repositórios e CI/CD" },
  { name: "Zapier", icon: "⚡", description: "Automações e integrações" },
  { name: "Outlook", icon: "📧", description: "Email e calendário corporativo" },
  { name: "Discord", icon: "🎮", description: "Comunicação em tempo real" },
  { name: "Notion", icon: "📝", description: "Documentação e bases de conhecimento" },
  { name: "Figma", icon: "🎨", description: "Design e prototipagem" },
];

export function AdminIntegrations() {
  const [enabled, setEnabled] = useState<Set<string>>(new Set());

  const toggle = (name: string) => {
    setEnabled(prev => {
      const next = new Set(prev);
      if (next.has(name)) { next.delete(name); toast.info(`${name} desabilitado`); }
      else { next.add(name); toast.success(`${name} habilitado`); }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-display font-bold text-primary tracking-wider">INTEGRAÇÕES</h1>
      <p className="text-xs font-mono text-muted-foreground">Gerencie integrações externas da plataforma</p>
      <div className="space-y-2">
        {INTEGRATIONS.map(i => (
          <div key={i.name} className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/[0.03]">
            <div className="flex items-center gap-3">
              <span className="text-xl">{i.icon}</span>
              <div>
                <span className="text-sm font-mono font-bold text-foreground">{i.name}</span>
                <p className="text-[9px] font-mono text-muted-foreground">{i.description}</p>
              </div>
            </div>
            <button onClick={() => toggle(i.name)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-colors ${
                enabled.has(i.name) 
                  ? "bg-emerald-400/10 text-emerald-400 hover:bg-destructive/10 hover:text-destructive" 
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}>
              {enabled.has(i.name) ? "ATIVO" : "CONFIGURAR"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
