import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Building2, User, Globe, Link2,
  Star, MapPin, Clock, Settings2, Eye, BarChart3, TrendingUp, Cpu,
  Users, Bot, MessageCircle, Brain, Monitor
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DISTRICTS, BUILDING_STYLES } from "@/types/building";
import { AIReceptionistChat } from "@/components/building/AIReceptionistChat";
import { AgentWorkspaceHub } from "@/components/workspace/AgentWorkspaceHub";
import { InteractiveObjects } from "@/components/collaboration/InteractiveObjects";
import { TeamAgents } from "@/components/collaboration/TeamAgents";
import { MessengerHub } from "@/components/collaboration/MessengerHub";
import { AgentTraining } from "@/components/collaboration/AgentTraining";
import logo from "@/assets/logo.png";

interface DBBuilding {
  id: string;
  name: string;
  owner_id: string | null;
  district: string;
  style: string;
  floors: number;
  height: number;
  primary_color: string | null;
  secondary_color: string | null;
  customizations: Record<string, any> | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export default function BuildingInterior() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [building, setBuilding] = useState<DBBuilding | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [loading, setLoading] = useState(true);

  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showObjects, setShowObjects] = useState(false);
  const [showTeamAgents, setShowTeamAgents] = useState(false);
  const [showMessenger, setShowMessenger] = useState(false);
  const [showTraining, setShowTraining] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    async function fetch() {
      const { data } = await supabase
        .from("city_buildings")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setBuilding(data as unknown as DBBuilding);
        // Fetch owner name
        if (data.owner_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", data.owner_id)
            .single();
          if (profile) setOwnerName(profile.display_name);
        }
      }
      setLoading(false);
    }
    fetch();
  }, [id]);

  const isOwner = building?.owner_id === user?.id;
  const district = DISTRICTS.find(d => d.id === building?.district);
  const styleInfo = BUILDING_STYLES.find(s => s.id === building?.style);
  const primaryColor = building?.primary_color || "#3b82f6";
  const secondaryColor = building?.secondary_color || "#1e3a5f";
  const customizations = (building?.customizations || {}) as Record<string, boolean>;

  const analytics = useMemo(() => ({
    visitors: Math.floor(Math.random() * 200) + 20,
    avgTime: `${Math.floor(Math.random() * 5) + 1}m ${Math.floor(Math.random() * 59)}s`,
    interactions: Math.floor(Math.random() * 80) + 5,
  }), [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[10px] font-mono tracking-wider text-muted-foreground">CARREGANDO...</p>
        </div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-xl font-display font-bold mb-2">Prédio não encontrado</h2>
          <button onClick={() => navigate("/city")} className="text-primary text-sm hover:underline">
            Voltar à cidade
          </button>
        </div>
      </div>
    );
  }

  // Build a compatible object for AIReceptionistChat
  const chatBuilding = {
    id: building.id,
    name: building.name,
    ownerName,
    district: building.district,
    style: building.style,
    floors: building.floors,
    height: building.height,
    primaryColor,
    secondaryColor,
    bio: "",
    links: [] as string[],
    customizations,
    createdAt: building.created_at,
    coordinates: { x: 0, z: 0 },
    claimed: true,
    ownerId: building.owner_id || "",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img src={logo} alt="" className="w-5 h-5" />
            <span className="font-display font-bold text-foreground text-sm">{building.name}</span>
            <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Aberto</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowWorkspace(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors">
              <Cpu className="w-3.5 h-3.5" /> Agent Workspace
            </button>
            <button onClick={() => setShowTeamAgents(true)} className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-medium hover:bg-accent transition-colors">
              <Users className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setShowTraining(true)} className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-medium hover:bg-accent transition-colors">
              <Brain className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setShowMessenger(true)} className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-medium hover:bg-accent transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setShowObjects(true)} className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-medium hover:bg-accent transition-colors">
              <Monitor className="w-3.5 h-3.5" />
            </button>
            {isOwner && (
              <button
                onClick={() => navigate("/find-building")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Personalizar
              </button>
            )}
            <button
              onClick={() => navigate("/city")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted text-muted-foreground text-xs font-medium hover:bg-accent transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              Voltar à cidade
            </button>
          </div>
        </div>
      </div>

      <div className="pt-14 max-w-6xl mx-auto px-4 py-8">
        {/* Building Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-8"
          style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}08)` }}
        >
          <div className="p-8 flex items-start gap-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: primaryColor + "30" }}
            >
              <Building2 className="w-10 h-10" style={{ color: primaryColor }} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold text-foreground mb-1">{building.name}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{ownerName || "—"}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{district?.emoji} {district?.name}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(building.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <AIReceptionistChat building={chatBuilding} />

            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Portfólio & Links
              </h2>
              <div className="text-center py-6 text-muted-foreground text-sm">
                {isOwner ? "Adicione links ao seu portfólio nas configurações" : "Nenhum link adicionado ainda"}
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Analytics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> Visitantes</span>
                  <span className="text-foreground text-sm font-bold">{analytics.visitors}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Tempo médio</span>
                  <span className="text-foreground text-sm font-bold">{analytics.avgTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Interações AI</span>
                  <span className="text-foreground text-sm font-bold">{analytics.interactions}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Detalhes do Prédio</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estilo</span>
                  <span className="text-foreground">{styleInfo?.emoji} {styleInfo?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Altura</span>
                  <span className="text-foreground">{building.height}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Andares</span>
                  <span className="text-foreground">{building.floors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distrito</span>
                  <span className="text-foreground">{district?.emoji} {district?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cor</span>
                  <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: primaryColor }} />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Extras Ativos</h3>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(customizations).filter(([, v]) => v).map(([k]) => (
                  <span key={k} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-lg">
                    {k === "neonSign" ? "🔆 Neon" : k === "rooftop" ? "📡 Rooftop" : k === "garden" ? "🌳 Jardim" : k === "hologram" ? "✨ Holograma" : k === "outdoor" ? "📺 Outdoor" : "🗿 Escultura"}
                  </span>
                ))}
                {Object.entries(customizations).filter(([, v]) => v).length === 0 && (
                  <span className="text-muted-foreground text-xs">Nenhum extra ativo</span>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate("/city")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Voltar à Cidade
            </button>
          </motion.div>
        </div>
      </div>
      <AgentWorkspaceHub isOpen={showWorkspace} onClose={() => setShowWorkspace(false)} buildingId={building.id} buildingName={building.name} />
      <InteractiveObjects isOpen={showObjects} onClose={() => setShowObjects(false)} buildingId={building.id} />
      <TeamAgents isOpen={showTeamAgents} onClose={() => setShowTeamAgents(false)} />
      <MessengerHub isOpen={showMessenger} onClose={() => setShowMessenger(false)} />
      <AgentTraining isOpen={showTraining} onClose={() => setShowTraining(false)} />
    </div>
  );
}
