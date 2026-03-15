import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, RefreshCw, Ban, MessageCircle, Palette, Bot, Search, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function AdminModeration() {
  const [agents, setAgents] = useState<any[]>([]);
  const [creations, setCreations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"agents" | "creations" | "messages">("messages");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: a }, { data: c }, { data: m }] = await Promise.all([
      supabase.from("workspace_agents").select("*").eq("status", "active"),
      supabase.from("agent_creations").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("chat_messages").select("*").order("created_at", { ascending: false }).limit(50),
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

  const TABS = [
    { id: "messages" as const, label: "Mensagens", icon: MessageCircle, count: messages.length },
    { id: "creations" as const, label: "Criações", icon: Palette, count: creations.length },
    { id: "agents" as const, label: "Agentes", icon: Bot, count: agents.length },
  ];

  const filteredMessages = messages.filter(m => !search || m.content.toLowerCase().includes(search.toLowerCase()) || m.author_name.toLowerCase().includes(search.toLowerCase()));
  const filteredCreations = creations.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.agent_name.toLowerCase().includes(search.toLowerCase()));
  const filteredAgents = agents.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-primary tracking-wider">MODERAÇÃO</h1>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Revisar e moderar conteúdo da plataforma</p>
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider transition-colors ${
              tab === t.id ? "bg-primary/10 text-primary border border-primary/20" : "bg-primary/[0.03] text-muted-foreground hover:text-foreground border border-primary/10"
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conteúdo..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/10 bg-primary/[0.03] text-sm font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/30" />
      </div>

      {/* Messages Tab */}
      {tab === "messages" && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredMessages.map(m => (
            <div key={m.id} className="flex items-start gap-3 p-4 rounded-xl border border-primary/10 bg-primary/[0.03] group">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {m.author_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono font-bold text-foreground">{m.author_name}</p>
                  <span className="text-[9px] font-mono text-muted-foreground/50">{new Date(m.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <p className="text-[11px] font-mono text-muted-foreground mt-1 break-words">{m.content}</p>
              </div>
              <button onClick={() => removeMessage(m.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0" title="Remover">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {filteredMessages.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-8">Nenhuma mensagem encontrada</p>}
        </div>
      )}

      {/* Creations Tab */}
      {tab === "creations" && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredCreations.map(c => (
            <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/[0.03] group">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono font-bold text-foreground">{c.title}</p>
                <p className="text-[9px] font-mono text-muted-foreground mt-0.5">
                  {c.agent_name} · {c.creation_type} · {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  {c.tags?.length > 0 && <> · {c.tags.slice(0, 3).join(", ")}</>}
                </p>
                {c.content && <p className="text-[10px] font-mono text-muted-foreground/50 mt-1 truncate">{c.content.slice(0, 100)}</p>}
              </div>
              <button onClick={() => removeCreation(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0" title="Remover">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {filteredCreations.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-8">Nenhuma criação encontrada</p>}
        </div>
      )}

      {/* Agents Tab */}
      {tab === "agents" && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filteredAgents.map(a => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/[0.03] group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-400/10 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-foreground">{a.name}</p>
                  <p className="text-[9px] font-mono text-muted-foreground">{a.agent_type} · {a.model || "—"} · {a.building_id}</p>
                </div>
              </div>
              <button onClick={() => disableAgent(a.id, a.name)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100">
                <Ban className="w-3 h-3" /> DESATIVAR
              </button>
            </div>
          ))}
          {filteredAgents.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-8">Nenhum agente ativo</p>}
        </div>
      )}
    </div>
  );
}
