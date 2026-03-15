import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, RefreshCw, Ban, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export function AdminModeration() {
  const [agents, setAgents] = useState<any[]>([]);
  const [creations, setCreations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: a }, { data: c }, { data: m }] = await Promise.all([
      supabase.from("workspace_agents").select("*").eq("status", "active"),
      supabase.from("agent_creations").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("chat_messages").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    if (a) setAgents(a);
    if (c) setCreations(c);
    if (m) setMessages(m);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const disableAgent = async (id: string, name: string) => {
    if (!confirm(`Desativar agente "${name}"?`)) return;
    const { error } = await supabase.from("workspace_agents").update({ status: "disabled" }).eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    setAgents(prev => prev.filter(a => a.id !== id));
    toast.success("Agente desativado");
  };

  const removeCreation = async (id: string) => {
    if (!confirm("Remover esta criação?")) return;
    const { error } = await supabase.from("agent_creations").delete().eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    setCreations(prev => prev.filter(c => c.id !== id));
    toast.success("Criação removida");
  };

  const removeMessage = async (id: string) => {
    if (!confirm("Remover esta mensagem?")) return;
    const { error } = await supabase.from("chat_messages").delete().eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    setMessages(prev => prev.filter(m => m.id !== id));
    toast.success("Mensagem removida");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-primary tracking-wider">MODERAÇÃO</h1>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div>
        <h2 className="text-sm font-mono font-bold text-foreground mb-3">AGENTES ATIVOS ({agents.length})</h2>
        <div className="space-y-2">
          {agents.slice(0, 10).map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-primary/10 bg-primary/[0.03]">
              <div>
                <p className="text-xs font-mono font-bold text-foreground">{a.name}</p>
                <p className="text-[9px] font-mono text-muted-foreground">{a.agent_type} · {a.building_id}</p>
              </div>
              <button onClick={() => disableAgent(a.id, a.name)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                <Ban className="w-3 h-3" /> DESATIVAR
              </button>
            </div>
          ))}
          {agents.length === 0 && <p className="text-[10px] text-muted-foreground py-4 text-center">Nenhum agente ativo</p>}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-mono font-bold text-foreground mb-3">CRIAÇÕES RECENTES ({creations.length})</h2>
        <div className="space-y-2">
          {creations.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-primary/10 bg-primary/[0.03]">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono font-bold text-foreground truncate">{c.title}</p>
                <p className="text-[9px] font-mono text-muted-foreground">{c.agent_name} · {c.creation_type} · {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <button onClick={() => removeCreation(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-mono font-bold text-foreground mb-3 flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5" /> MENSAGENS RECENTES ({messages.length})
        </h2>
        <div className="space-y-2">
          {messages.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-primary/10 bg-primary/[0.03]">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono font-bold text-foreground">{m.author_name}</p>
                <p className="text-[9px] font-mono text-muted-foreground truncate">{m.content}</p>
              </div>
              <button onClick={() => removeMessage(m.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
