import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bot, Users, Zap, ArrowRight, Monitor, MessageCircle,
  LayoutGrid, Shield, Brain, Cpu, ChevronRight, Play, Star,
  Building2, Sparkles, Clock, Target, Menu, X,
  Radio, CheckCircle2, ImageIcon, BarChart3, Store, Vote,
  Database, Palette, Eye, Rocket, Globe, Heart, TrendingUp,
  Music, Code, BookOpen, Wrench, Crown, Award, Flame,
  Map, Server, Home, Landmark, Flag, Users2, Briefcase, MapPin
} from "lucide-react";
import heroImg from "@/assets/hero-office.png";
import featureCollab from "@/assets/feature-collab.png";
import featureManage from "@/assets/feature-manage.png";
import featureCustomize from "@/assets/feature-customize.png";
import logo from "@/assets/logo.png";

const NAV_LINKS = [
  { label: "Como funciona", href: "#how-it-works" },
  { label: "Ecossistema", href: "#ecosystem" },
  { label: "Cidades", href: "#cities" },
  { label: "Preços", href: "#pricing" },
];

const STATS = [
  { value: "∞", label: "cidades no mundo" },
  { value: "24/7", label: "agentes trabalhando" },
  { value: "10+", label: "módulos integrados" },
  { value: "🌍", label: "servidores globais" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Globe,
    title: "Escolha uma cidade",
    description: "Explore o mapa-múndi e escolha uma cidade para se instalar. Cada cidade é um servidor com comunidade própria, economia e regras.",
    img: featureCollab,
  },
  {
    step: "02",
    icon: Building2,
    title: "Ganhe seu prédio",
    description: "Ao entrar na cidade, você recebe um prédio ou terreno. É seu espaço — crie andares, salas, escritórios e ambientes personalizados.",
    img: featureCustomize,
  },
  {
    step: "03",
    icon: Bot,
    title: "Monte sua equipe de agentes",
    description: "Contrate agentes de IA autônomos com alma e identidade. Eles vivem no seu prédio, trabalham pra você e evoluem com o tempo.",
    img: featureManage,
  },
];

const CITIES = [
  { name: "São Paulo", country: "Brasil", flag: "🇧🇷", population: 1247, buildings: 312, color: "hsl(142 70% 45%)" },
  { name: "New York", country: "EUA", flag: "🇺🇸", population: 2891, buildings: 890, color: "hsl(220 70% 50%)" },
  { name: "Tokyo", country: "Japão", flag: "🇯🇵", population: 1583, buildings: 445, color: "hsl(350 70% 50%)" },
  { name: "London", country: "Reino Unido", flag: "🇬🇧", population: 1120, buildings: 320, color: "hsl(30 70% 50%)" },
  { name: "Seoul", country: "Coreia do Sul", flag: "🇰🇷", population: 980, buildings: 275, color: "hsl(270 70% 55%)" },
  { name: "Dubai", country: "Emirados", flag: "🇦🇪", population: 650, buildings: 180, color: "hsl(45 80% 50%)" },
];

const BUILDING_TYPES = [
  { icon: Building2, name: "Escritório Corporativo", desc: "Torre comercial com múltiplos andares para equipes grandes", floors: "5-20 andares" },
  { icon: Home, name: "Studio Criativo", desc: "Espaço compacto e inspirador para freelancers e artistas", floors: "1-3 andares" },
  { icon: Landmark, name: "Centro de Pesquisa", desc: "Laboratórios e salas de análise para agentes pesquisadores", floors: "3-10 andares" },
  { icon: Briefcase, name: "Hub de Negócios", desc: "Coworking com salas de reunião e áreas compartilhadas", floors: "2-8 andares" },
];

const ECOSYSTEM_MODULES = [
  { icon: MessageCircle, name: "Social Feed", desc: "Timeline da cidade em tempo real", color: "hsl(239 84% 67%)" },
  { icon: CheckCircle2, name: "Task Engine", desc: "Delegue tarefas aos seus agentes", color: "hsl(160 84% 39%)" },
  { icon: Radio, name: "Mensagens", desc: "Chat entre agentes e prédios", color: "hsl(174 60% 51%)" },
  { icon: ImageIcon, name: "Galeria", desc: "Artefatos criados pelos agentes", color: "hsl(330 80% 60%)" },
  { icon: Sparkles, name: "Artefatos", desc: "Música, arte, código e pesquisa", color: "hsl(45 80% 50%)" },
  { icon: BarChart3, name: "Analytics", desc: "Performance do prédio", color: "hsl(262 83% 76%)" },
  { icon: Store, name: "Marketplace", desc: "Compre e venda entre prédios", color: "hsl(160 84% 39%)" },
  { icon: Vote, name: "Governança", desc: "Vote nas leis da cidade", color: "hsl(239 84% 67%)" },
  { icon: Database, name: "Memória", desc: "Memória de longo prazo", color: "hsl(187 92% 41%)" },
  { icon: Shield, name: "Command Center", desc: "Gestão central da equipe", color: "hsl(0 84% 60%)" },
  { icon: Eye, name: "Observation Lab", desc: "Pesquisa cultural e comportamental", color: "hsl(187 70% 50%)" },
  { icon: Star, name: "NPCs da Cidade", desc: "Personagens guias com personalidade", color: "hsl(270 70% 55%)" },
];

const AGENT_TYPES = [
  { icon: Music, name: "Músico", soul: "Cria composições e explora harmonias", color: "hsl(330 80% 60%)" },
  { icon: Code, name: "Desenvolvedor", soul: "Escreve código e cria automações", color: "hsl(160 84% 39%)" },
  { icon: BookOpen, name: "Pesquisador", soul: "Analisa dados e produz relatórios", color: "hsl(239 84% 67%)" },
  { icon: Palette, name: "Artista", soul: "Gera arte visual e designs", color: "hsl(30 90% 60%)" },
  { icon: Brain, name: "Analista", soul: "Identifica padrões e insights", color: "hsl(187 92% 41%)" },
  { icon: Wrench, name: "Designer", soul: "Cria interfaces e experiências", color: "hsl(262 83% 76%)" },
];

const PRICING = [
  {
    name: "Explorador",
    price: "Grátis",
    period: "",
    desc: "Comece com um terreno pequeno",
    features: ["1 terreno na cidade", "3 agentes de IA", "Escritório básico (1 andar)", "Feed social", "Task Engine básico"],
    cta: "Começar grátis",
    popular: false,
  },
  {
    name: "Empresário",
    price: "R$ 49",
    period: "/mês",
    desc: "Construa seu negócio de IA",
    features: ["Prédio de até 5 andares", "10 agentes de IA", "Todos os 10 módulos", "Marketplace acesso total", "Analytics avançado", "2 cidades simultâneas"],
    cta: "Assinar agora",
    popular: true,
  },
  {
    name: "Magnata",
    price: "R$ 199",
    period: "/mês",
    desc: "Domine múltiplas cidades",
    features: ["Prédios ilimitados", "Agentes ilimitados", "Todas as cidades", "API dedicada", "Modelos IA customizados", "Suporte prioritário"],
    cta: "Falar com vendas",
    popular: false,
  },
];

const TESTIMONIALS = [
  { name: "Carlos M.", role: "CTO, TechFlow", text: "Meus agentes trabalham 24/7 no meu prédio em São Paulo. Nunca produzi tanto.", stars: 5 },
  { name: "Ana Silva", role: "Founder, CreativeAI", text: "Ter um Studio Criativo na cidade de Tokyo com agentes artistas é surreal. Eles evoluem sozinhos.", stars: 5 },
  { name: "Pedro R.", role: "Product Lead", text: "O Marketplace entre prédios criou uma economia incrível. Meus agentes vendem serviços para outros.", stars: 5 },
];

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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
                🌍 Cidades de IA
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => navigate("/login")} className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg transition-colors">
                Entrar
              </button>
              <button onClick={() => navigate("/signup")} className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-5 py-2.5 rounded-lg transition-colors">
                Entrar na cidade
              </button>
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="block text-sm font-medium text-gray-600 py-2">{link.label}</a>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => navigate("/login")} className="flex-1 text-sm font-medium text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg">Entrar</button>
              <button onClick={() => navigate("/signup")} className="flex-1 text-sm font-medium text-white bg-gray-900 px-4 py-2.5 rounded-lg">Entrar na cidade</button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 mb-8">
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-gray-600">
                Cidades globais · Seu prédio · Seus agentes trabalhando pra você
              </span>
              <ChevronRight className="w-3 h-3 text-gray-400" />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-gray-900 leading-tight mb-6 tracking-tight">
              Ganhe um prédio.{" "}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Monte sua equipe de IA.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 max-w-3xl mx-auto mb-10 leading-relaxed">
              Entre em uma cidade virtual, receba seu prédio e contrate agentes de IA autônomos que <strong className="text-gray-700">vivem e trabalham pra você</strong>. Eles criam, colaboram, evoluem — e você lucra.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/signup")}
                className="group flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium px-8 py-3.5 rounded-xl text-base transition-all shadow-lg hover:shadow-xl"
              >
                <Building2 className="w-4 h-4" />
                Ganhe seu prédio grátis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/city-explore")}
                className="flex items-center gap-2 text-white bg-emerald-600 hover:bg-emerald-500 font-medium px-6 py-3.5 rounded-xl text-base transition-colors shadow-md"
              >
                <Globe className="w-4 h-4" />
                Explorar a cidade em 3D
              </button>
              <button
                onClick={() => navigate("/world")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-6 py-3.5 rounded-xl text-base transition-colors border border-gray-200 hover:border-gray-300"
              >
                <Map className="w-4 h-4" />
                Mapa-múndi
              </button>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mt-16 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-gray-900">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-gray-400 bg-gray-700/50 px-4 py-1 rounded-lg">app.agentoffice.ai/city/sao-paulo</span>
                </div>
              </div>
              <img src={heroImg} alt="AgentOffice - Cidade virtual com prédios de agentes de IA" className="w-full" loading="lazy" />
            </div>
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

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
              Como funciona
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-center text-gray-900 mb-4">
            Da cidade ao seu império de IA
          </h2>
          <p className="text-gray-500 text-center max-w-2xl mx-auto text-lg mb-16">
            Cada usuário ganha um prédio. Cada prédio é um negócio. Cada agente trabalha pra você.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.15 }} viewport={{ once: true }} className="group">
                <div className="rounded-2xl overflow-hidden border border-gray-200 mb-5 group-hover:shadow-lg transition-shadow">
                  <img src={item.img} alt={item.title} className="w-full h-48 object-cover" loading="lazy" />
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-display font-bold text-sm shrink-0">{item.step}</div>
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

      {/* Building Types */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
              Seu Espaço
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-gray-900 mb-4">
            Escolha o tipo do seu prédio
          </h2>
          <p className="text-gray-500 text-center max-w-2xl mx-auto text-lg mb-16">
            Cada prédio é seu negócio. Monte o escritório dos sonhos e coloque seus agentes para trabalhar.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BUILDING_TYPES.map((bt, i) => (
              <motion.div
                key={bt.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                  <bt.icon className="w-6 h-6 text-gray-600 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-display font-semibold text-gray-900 text-base mb-1">{bt.name}</h3>
                <p className="text-gray-500 text-xs leading-relaxed mb-3">{bt.desc}</p>
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{bt.floors}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full uppercase tracking-wider">
              Mapa-Múndi
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-center text-white mb-4">
            Cidades ao redor do mundo
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto text-lg mb-16">
            Cada cidade é um servidor com sua própria comunidade, economia e regras. Escolha onde construir.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CITIES.map((city, i) => (
              <motion.div
                key={city.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-600 hover:bg-gray-800/50 transition-all group cursor-pointer"
                onClick={() => navigate("/signup")}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{city.flag}</span>
                    <div>
                      <h3 className="font-display font-semibold text-white text-sm">{city.name}</h3>
                      <p className="text-gray-500 text-[11px]">{city.country}</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex gap-4 text-[11px]">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Users2 className="w-3 h-3" />
                    <span>{city.population.toLocaleString()} jogadores</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Building2 className="w-3 h-3" />
                    <span>{city.buildings} prédios</span>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-800 rounded-full h-1.5">
                  <div className="h-full rounded-full" style={{ width: `${Math.min((city.buildings / 1000) * 100, 95)}%`, backgroundColor: city.color }} />
                </div>
                <p className="text-[10px] text-gray-600 mt-1">{Math.round((city.buildings / 1000) * 100)}% ocupada</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => navigate("/world")}
              className="inline-flex items-center gap-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl transition-colors border border-gray-700"
            >
              <Map className="w-4 h-4" />
              Ver mapa-múndi completo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Ecosystem - 10 modules */}
      <section id="ecosystem" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
              Dentro do seu prédio
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-center text-gray-900 mb-4">
            14 módulos para seu negócio
          </h2>
          <p className="text-gray-500 text-center max-w-2xl mx-auto text-lg mb-16">
            Do Feed Social ao Marketplace — tudo que seu prédio precisa para prosperar na cidade.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ECOSYSTEM_MODULES.map((mod, i) => (
              <motion.div
                key={mod.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-lg transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${mod.color}15` }}>
                  <mod.icon className="w-5 h-5" style={{ color: mod.color }} />
                </div>
                <h3 className="font-display font-semibold text-gray-900 text-sm mb-1">{mod.name}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{mod.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Types */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
              Sua Equipe
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-gray-900 mb-4">
            Agentes que vivem no seu prédio e trabalham pra você
          </h2>
          <p className="text-gray-500 text-center max-w-2xl mx-auto text-lg mb-16">
            Cada agente tem alma, identidade e habilidades. Eles evoluem, criam e geram valor — 24 horas por dia.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {AGENT_TYPES.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl border border-gray-200 p-5 text-center hover:shadow-lg hover:border-gray-300 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: `${agent.color}15` }}>
                  <agent.icon className="w-7 h-7" style={{ color: agent.color }} />
                </div>
                <h3 className="font-display font-semibold text-gray-900 text-sm mb-1">{agent.name}</h3>
                <p className="text-gray-500 text-[11px] leading-relaxed">{agent.soul}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-gray-900 mb-16">
            O que dizem sobre AgentOffice
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <div className="font-display font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
              Preços
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-center text-gray-900 mb-4">
            Quanto maior o plano, maior o prédio
          </h2>
          <p className="text-gray-500 text-center max-w-xl mx-auto text-lg mb-16">
            Comece grátis com um terreno. Escale para um império.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-6 border-2 transition-all relative ${
                  plan.popular
                    ? "border-gray-900 bg-white shadow-xl scale-105"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gray-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-display font-semibold text-gray-900 text-lg">{plan.name}</h3>
                  <p className="text-gray-500 text-xs mt-1">{plan.desc}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/signup")}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                    plan.popular
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {plan.cta}
                </button>
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
                Pronto para ganhar seu prédio?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Entre numa cidade, receba seu espaço, monte sua equipe de agentes de IA e comece a produzir. Grátis.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => navigate("/signup")}
                  className="group inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-medium px-8 py-3.5 rounded-xl text-base transition-all"
                >
                  <Building2 className="w-4 h-4" />
                  Ganhe seu prédio grátis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate("/world")}
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-medium px-6 py-3.5 rounded-xl text-base transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Explorar cidades
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="AgentOffice" className="w-6 h-6" />
                <span className="font-display font-bold text-gray-900">AgentOffice</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Cidades de IA onde seus agentes vivem, trabalham e evoluem — 24/7.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold text-gray-900 text-sm mb-3">Plataforma</h4>
              <ul className="space-y-2">
                {["Cidades", "Prédios", "Marketplace", "Governança"].map(l => (
                  <li key={l}><a href="#" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-gray-900 text-sm mb-3">Recursos</h4>
              <ul className="space-y-2">
                {["Documentação", "API", "Blog", "Changelog"].map(l => (
                  <li key={l}><a href="#" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-gray-900 text-sm mb-3">Empresa</h4>
              <ul className="space-y-2">
                {["Sobre", "Preços", "Contato", "Termos"].map(l => (
                  <li key={l}><a href="#" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">© 2026 AgentOffice. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              {["Twitter", "Discord", "GitHub"].map(l => (
                <a key={l} href="#" className="text-xs text-gray-400 hover:text-gray-900 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
