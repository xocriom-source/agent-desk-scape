import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bot, Users, Zap, Settings, ArrowRight, Monitor, MessageCircle,
  LayoutGrid, Shield, Brain, Cpu, ChevronRight, Play, Star,
  Building2, Sparkles, Clock, Target, Menu, X
} from "lucide-react";
import heroImg from "@/assets/hero-office.png";
import featureCollab from "@/assets/feature-collab.png";
import featureManage from "@/assets/feature-manage.png";
import featureCustomize from "@/assets/feature-customize.png";
import logo from "@/assets/logo.png";

const NAV_LINKS = [
  { label: "Produto", href: "#features" },
  { label: "Recursos", href: "#resources" },
  { label: "Preços", href: "#pricing" },
];

const FEATURES_TABS = [
  { label: "Colaboração", icon: Users },
  { label: "Gestão", icon: Target },
  { label: "Automação", icon: Zap },
];

const STATS = [
  { value: "10x", label: "mais produtivo" },
  { value: "24/7", label: "agentes ativos" },
  { value: "∞", label: "escalabilidade" },
  { value: "0", label: "downtime" },
];

const CAPABILITIES = [
  {
    icon: Brain,
    title: "Agentes Autônomos",
    description: "Crie agentes de IA que trabalham de forma autônoma, executando tarefas complexas sem supervisão constante.",
  },
  {
    icon: MessageCircle,
    title: "Comunicação Inteligente",
    description: "Converse com seus agentes em tempo real. Dê ordens, receba relatórios e acompanhe o progresso.",
  },
  {
    icon: LayoutGrid,
    title: "Escritório Personalizável",
    description: "Monte seu escritório virtual com salas, mesas e decorações. Cada espaço reflete sua empresa.",
  },
  {
    icon: Shield,
    title: "Controle Total",
    description: "Como chefe, você tem controle absoluto. Crie, pause, reassigne e monitore todos os agentes.",
  },
  {
    icon: Cpu,
    title: "Múltiplos Modelos de IA",
    description: "Conecte diferentes modelos de IA a cada agente. GPT, Claude, Llama — escolha o melhor para cada função.",
  },
  {
    icon: Clock,
    title: "Operação 24/7",
    description: "Seus agentes nunca param. Trabalham dia e noite, entregando resultados enquanto você descansa.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const tabImages = [featureCollab, featureManage, featureCustomize];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={logo} alt="AgentOffice" className="w-8 h-8" />
              <span className="font-display font-bold text-xl text-gray-900">AgentOffice</span>
              <span className="hidden sm:inline-block text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                ● Novo
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-5 py-2.5 rounded-lg transition-colors"
              >
                Comece agora
              </button>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3"
          >
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="block text-sm font-medium text-gray-600 py-2">
                {link.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => navigate("/login")} className="flex-1 text-sm font-medium text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg">
                Entrar
              </button>
              <button onClick={() => navigate("/signup")} className="flex-1 text-sm font-medium text-white bg-gray-900 px-4 py-2.5 rounded-lg">
                Comece agora
              </button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-gray-600">
                Sua empresa virtual com agentes de IA autônomos
              </span>
              <ChevronRight className="w-3 h-3 text-gray-400" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-gray-900 leading-tight mb-6 tracking-tight">
              Uma empresa virtual que{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                funciona sozinha
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Crie, gerencie e controle agentes de IA no seu escritório virtual.
              Eles trabalham, colaboram e entregam resultados — 24 horas por dia.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/signup")}
                className="group flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium px-8 py-3.5 rounded-xl text-base transition-all shadow-lg hover:shadow-xl"
              >
                Crie Seu Escritório
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-6 py-3.5 rounded-xl text-base transition-colors">
                <Play className="w-4 h-4" />
                Ver demonstração
              </button>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-900">
              {/* Mock browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-gray-400 bg-gray-700/50 px-4 py-1 rounded-lg">
                    app.agentoffice.ai/escritorio
                  </span>
                </div>
              </div>
              <img
                src={heroImg}
                alt="AgentOffice - Escritório virtual com agentes de IA"
                className="w-full"
                loading="lazy"
              />
            </div>
            {/* Glow */}
            <div className="absolute -z-10 inset-0 bg-gradient-to-b from-primary/5 via-purple-500/5 to-transparent blur-3xl scale-110" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-display font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature: Virtual Office */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
              Escritório Virtual
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-center text-gray-900 mb-4">
            Colaboração instantânea com IA
          </h2>
          <p className="text-gray-500 text-center max-w-2xl mx-auto text-lg mb-16">
            Veja seus agentes trabalhando em tempo real. Ande pelo escritório, dê ordens e acompanhe cada tarefa de perto.
          </p>

          {/* Tabs */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-gray-100 rounded-xl p-1">
              {FEATURES_TABS.map((tab, i) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === i
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl overflow-hidden shadow-xl border border-gray-200"
          >
            <img
              src={tabImages[activeTab]}
              alt={FEATURES_TABS[activeTab].label}
              className="w-full"
              loading="lazy"
            />
          </motion.div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
              Recursos
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-gray-900 mb-4">
            Tudo que você precisa para gerenciar sua equipe de IA
          </h2>
          <p className="text-gray-500 text-center max-w-2xl mx-auto text-lg mb-16">
            Do recrutamento à gestão, do monitoramento à automação.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAPABILITIES.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                  <cap.icon className="w-6 h-6 text-gray-600 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-display font-semibold text-gray-900 text-lg mb-2">{cap.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{cap.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="resources" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-gray-900 mb-16">
            Crie seu escritório em minutos
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Building2,
                title: "Crie seu escritório",
                description: "Escolha um modelo ou comece do zero. Personalize salas, mesas e decorações.",
                img: featureCustomize,
              },
              {
                step: "02",
                icon: Bot,
                title: "Contrate agentes",
                description: "Adicione agentes de IA com funções específicas: pesquisador, escritor, desenvolvedor...",
                img: featureManage,
              },
              {
                step: "03",
                icon: Zap,
                title: "Comece a produzir",
                description: "Dê ordens, distribua tarefas e veja seus agentes entregando resultados em tempo real.",
                img: featureCollab,
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="rounded-2xl overflow-hidden border border-gray-200 mb-5 group-hover:shadow-lg transition-shadow">
                  <img src={item.img} alt={item.title} className="w-full h-48 object-cover" loading="lazy" />
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-display font-bold text-sm shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-gray-900 text-lg mb-1">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gray-900 rounded-3xl px-8 py-16 sm:px-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/20" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                Pronto para montar sua equipe de IA?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Crie seu escritório virtual gratuito e comece a contratar seus primeiros agentes hoje.
              </p>
              <button
                onClick={() => navigate("/signup")}
                className="group inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-medium px-8 py-3.5 rounded-xl text-base transition-all"
              >
                Comece gratuitamente
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AgentOffice" className="w-6 h-6" />
            <span className="font-display font-bold text-gray-900">AgentOffice</span>
          </div>
          <div className="flex gap-8">
            {["Produto", "Recursos", "Preços", "Suporte"].map((link) => (
              <a key={link} href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                {link}
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            © 2026 AgentOffice. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
