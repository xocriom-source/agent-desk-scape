import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft, Search, Plus, Bot, Zap, CreditCard, BarChart3,
  Globe, Link2, Shield, Activity, X, Check, Loader2, ChevronRight
} from "lucide-react";

type Integration = {
  id: string;
  name: string;
  provider: string;
  category: string;
  auth_type: string;
  icon: string;
  description: string | null;
  status: string;
};

type UserIntegration = {
  id: string;
  integration_id: string;
  status: string;
  connected_at: string;
};

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  ai_agents: { label: "Agentes de IA", icon: <Bot className="w-4 h-4" />, color: "text-violet-400" },
  agent_network: { label: "Rede de Agentes", icon: <Globe className="w-4 h-4" />, color: "text-cyan-400" },
  payments: { label: "Pagamentos", icon: <CreditCard className="w-4 h-4" />, color: "text-emerald-400" },
  automation: { label: "Automação", icon: <Zap className="w-4 h-4" />, color: "text-amber-400" },
  business_tools: { label: "Ferramentas", icon: <BarChart3 className="w-4 h-4" />, color: "text-blue-400" },
  communication: { label: "Comunicação", icon: <Link2 className="w-4 h-4" />, color: "text-pink-400" },
  market_data: { label: "Dados de Mercado", icon: <Activity className="w-4 h-4" />, color: "text-orange-400" },
  blockchain: { label: "Blockchain", icon: <Shield className="w-4 h-4" />, color: "text-indigo-400" },
  analytics: { label: "Analytics", icon: <BarChart3 className="w-4 h-4" />, color: "text-teal-400" },
};

export default function IntegrationHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [userIntegrations, setUserIntegrations] = useState<UserIntegration[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data: intgs } = await supabase.from("platform_integrations").select("*").order("category");
    if (intgs) setIntegrations(intgs as Integration[]);

    if (user) {
      const { data: uintgs } = await supabase
        .from("user_integrations")
        .select("*")
        .eq("user_id", user.id);
      if (uintgs) setUserIntegrations(uintgs as UserIntegration[]);
    }
    setLoading(false);
  };

  const isConnected = (integrationId: string) =>
    userIntegrations.some((ui) => ui.integration_id === integrationId && ui.status === "connected");

  const handleConnect = async (integration: Integration) => {
    if (!user) return;
    setConnectingId(integration.id);

    if (isConnected(integration.id)) {
      // Disconnect
      await supabase
        .from("user_integrations")
        .delete()
        .eq("user_id", user.id)
        .eq("integration_id", integration.id);
      setUserIntegrations((prev) => prev.filter((ui) => ui.integration_id !== integration.id));
      toast.info(`${integration.name} desconectado`);
    } else {
      // Connect
      const { error } = await supabase.from("user_integrations").insert({
        user_id: user.id,
        integration_id: integration.id,
        status: "connected",
      });
      if (error) {
        toast.error("Erro ao conectar");
      } else {
        setUserIntegrations((prev) => [
          ...prev,
          { id: crypto.randomUUID(), integration_id: integration.id, status: "connected", connected_at: new Date().toISOString() },
        ]);
        toast.success(`${integration.name} conectado`);

        // Emit platform event
        await supabase.from("platform_events").insert({
          event_type: "integration.connected",
          source: "integration_hub",
          actor_id: user.id,
          target_id: integration.id,
          payload: { provider: integration.provider, category: integration.category },
        });
      }
    }
    setConnectingId(null);
  };

  const categories = [...new Set(integrations.map((i) => i.category))];
  const filtered = integrations.filter((i) => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.provider.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || i.category === activeCategory;
    return matchSearch && matchCat;
  });

  const connectedCount = userIntegrations.filter((ui) => ui.status === "connected").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Integration Hub</h1>
              <p className="text-[10px] font-mono text-muted-foreground">{connectedCount} conectadas • {integrations.length} disponíveis</p>
            </div>
          </div>
          <button
            onClick={() => setShowAgentModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            <Bot className="w-4 h-4" />
            Conectar Agente
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar integrações..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-colors ${
                !activeCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              TODOS
            </button>
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-colors ${
                    activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {meta?.label.toUpperCase() || cat.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Integrations Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((integ, idx) => {
              const connected = isConnected(integ.id);
              const meta = CATEGORY_META[integ.category];
              return (
                <motion.div
                  key={integ.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`group relative p-4 rounded-xl border transition-all hover:shadow-lg ${
                    connected ? "border-emerald-500/30 bg-emerald-500/[0.03]" : "border-border bg-card hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{integ.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground truncate">{integ.name}</h3>
                        {connected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{integ.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] font-mono font-bold ${meta?.color || "text-muted-foreground"}`}>
                          {meta?.label || integ.category}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground/50">•</span>
                        <span className="text-[9px] font-mono text-muted-foreground">{integ.auth_type.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnect(integ)}
                    disabled={connectingId === integ.id}
                    className={`mt-3 w-full py-2 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all ${
                      connected
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {connectingId === integ.id ? (
                      <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                    ) : connected ? (
                      "DESCONECTAR"
                    ) : (
                      "CONECTAR"
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma integração encontrada</p>
          </div>
        )}
      </div>

      {/* Connect Agent Modal */}
      <ConnectAgentModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        userId={user?.id}
        onSuccess={() => {
          setShowAgentModal(false);
          fetchData();
        }}
      />
    </div>
  );
}

// ── Connect Agent Modal ──
function ConnectAgentModal({
  isOpen,
  onClose,
  userId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("openclaw");
  const [agentType, setAgentType] = useState("assistant");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const CAPS = [
    "analyze_startup",
    "perform_due_diligence",
    "generate_valuation",
    "negotiate_offer",
    "market_research",
    "customer_support",
    "growth_optimization",
    "financial_analysis",
  ];

  const TYPES = [
    { id: "analyst", label: "AI Analyst", icon: "📊" },
    { id: "negotiator", label: "AI Negotiator", icon: "🤝" },
    { id: "operator", label: "AI Operator", icon: "⚙️" },
    { id: "assistant", label: "AI Assistant", icon: "🤖" },
    { id: "cfo", label: "AI CFO", icon: "💰" },
    { id: "legal", label: "AI Legal", icon: "⚖️" },
  ];

  const handleSubmit = async () => {
    if (!name.trim() || !userId) return;
    setLoading(true);

    const { error } = await supabase.from("external_agents").insert({
      name,
      provider,
      agent_type: agentType,
      capabilities,
      status: "active",
      owner_user_id: userId,
    });

    if (error) {
      toast.error("Erro ao registrar agente");
    } else {
      toast.success(`Agente ${name} registrado com sucesso`);

      await supabase.from("platform_events").insert({
        event_type: "agent.registered",
        source: "integration_hub",
        actor_id: userId,
        payload: { name, provider, agent_type: agentType },
      });

      setName("");
      setCapabilities([]);
      onSuccess();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold">Conectar Agente Externo</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground block mb-1.5">NOME DO AGENTE</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Market Analyzer Pro"
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Provider */}
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground block mb-1.5">PROVIDER</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="openclaw">OpenClaw</option>
              <option value="custom">Custom Agent</option>
              <option value="langchain">LangChain</option>
              <option value="autogpt">AutoGPT</option>
            </select>
          </div>

          {/* Agent Type */}
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground block mb-1.5">TIPO DE AGENTE</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setAgentType(t.id)}
                  className={`flex items-center gap-1.5 p-2.5 rounded-lg text-[10px] font-mono font-bold transition-colors border ${
                    agentType === t.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <label className="text-[10px] font-mono font-bold text-muted-foreground block mb-1.5">CAPABILITIES</label>
            <div className="flex flex-wrap gap-1.5">
              {CAPS.map((cap) => (
                <button
                  key={cap}
                  onClick={() =>
                    setCapabilities((prev) => (prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]))
                  }
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-colors ${
                    capabilities.includes(cap)
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cap.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-5 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            CANCELAR
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-mono font-bold tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "REGISTRAR AGENTE"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
