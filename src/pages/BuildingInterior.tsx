import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Building2, User, Globe, Link2,
  Star, MapPin, Clock, Settings2, Eye, BarChart3, TrendingUp, Cpu
} from "lucide-react";
import { getBuildingById } from "@/data/buildingRegistry";
import { DISTRICTS, BUILDING_STYLES } from "@/types/building";
import { AIReceptionistChat } from "@/components/building/AIReceptionistChat";
import { AgentWorkspaceHub } from "@/components/workspace/AgentWorkspaceHub";
import logo from "@/assets/logo.png";

export default function BuildingInterior() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const building = useMemo(() => (id ? getBuildingById(id) : null), [id]);
  const currentUser = useMemo(() => {
    const stored = localStorage.getItem("agentoffice_user");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const isOwner = building?.ownerId === (currentUser?.email || currentUser?.name);
  const district = DISTRICTS.find(d => d.id === building?.district);
  const styleInfo = BUILDING_STYLES.find(s => s.id === building?.style);

  if (!building) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h2 className="text-xl font-display font-bold mb-2">Prédio não encontrado</h2>
          <button onClick={() => navigate("/find-building")} className="text-primary text-sm hover:underline">
            Buscar prédios
          </button>
        </div>
      </div>
    );
  }

  // Mock analytics
  const analytics = {
    visitors: Math.floor(Math.random() * 200) + 20,
    avgTime: `${Math.floor(Math.random() * 5) + 1}m ${Math.floor(Math.random() * 59)}s`,
    interactions: Math.floor(Math.random() * 80) + 5,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img src={logo} alt="" className="w-5 h-5" />
            <span className="font-display font-bold text-white text-sm">{building.name}</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">Aberto</span>
          </div>
          <div className="flex items-center gap-2">
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
              onClick={() => navigate("/city-explore")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800 text-gray-300 text-xs font-medium hover:bg-gray-700 transition-colors"
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
          style={{ background: `linear-gradient(135deg, ${building.primaryColor}15, ${building.secondaryColor}08)` }}
        >
          <div className="p-8 flex items-start gap-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: building.primaryColor + "30" }}
            >
              <Building2 className="w-10 h-10" style={{ color: building.primaryColor }} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold text-white mb-1">{building.name}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{building.ownerName}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{district?.emoji} {district?.name}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(building.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
              {building.bio && <p className="text-gray-300 text-sm">{building.bio}</p>}
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
            {/* AI Receptionist Chat */}
            <AIReceptionistChat building={building} />

            {/* Portfolio / Links */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Portfólio & Links
              </h2>
              {building.links && building.links.length > 0 ? (
                <div className="space-y-2">
                  {building.links.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors text-sm text-gray-300 hover:text-white"
                    >
                      <Link2 className="w-4 h-4 text-primary" />
                      {link}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  {isOwner ? "Adicione links ao seu portfólio nas configurações" : "Nenhum link adicionado ainda"}
                </div>
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Analytics */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Analytics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs flex items-center gap-1"><Eye className="w-3 h-3" /> Visitantes</span>
                  <span className="text-white text-sm font-bold">{analytics.visitors}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Tempo médio</span>
                  <span className="text-white text-sm font-bold">{analytics.avgTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Interações AI</span>
                  <span className="text-white text-sm font-bold">{analytics.interactions}</span>
                </div>
              </div>
            </div>

            {/* Building details */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">Detalhes do Prédio</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Estilo</span>
                  <span className="text-white">{styleInfo?.emoji} {styleInfo?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Altura</span>
                  <span className="text-white">{building.height}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Andares</span>
                  <span className="text-white">{building.floors}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Distrito</span>
                  <span className="text-white">{district?.emoji} {district?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Cor</span>
                  <div className="w-5 h-5 rounded-full border border-gray-700" style={{ backgroundColor: building.primaryColor }} />
                </div>
              </div>
            </div>

            {/* Extras */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">Extras Ativos</h3>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(building.customizations).filter(([, v]) => v).map(([k]) => (
                  <span key={k} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-lg">
                    {k === "neonSign" ? "🔆 Neon" : k === "rooftop" ? "📡 Rooftop" : k === "garden" ? "🌳 Jardim" : k === "hologram" ? "✨ Holograma" : k === "outdoor" ? "📺 Outdoor" : "🗿 Escultura"}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate("/city-explore")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Voltar à Cidade
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
