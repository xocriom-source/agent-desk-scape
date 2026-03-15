import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bot, Users, ArrowRight, MessageCircle,
  Shield, Brain, ChevronRight,
  Building2, Sparkles, Target, Menu, X,
  CheckCircle2, BarChart3, Store, Vote,
  Database, Eye, Globe,
  Music, Code, BookOpen, Palette, Wrench,
  Map, Crown, Users2
} from "lucide-react";
import heroImg from "@/assets/hero-city-3d.jpg";
import logo from "@/assets/logo.png";

const NAV_LINKS = [
  { label: "Como funciona", href: "#how-it-works" },
  { label: "Ecossistema", href: "#ecosystem" },
  { label: "Cidades", href: "#cities" },
  { label: "Preços", href: "#pricing" },
];

const STATS = [
  { value: "20+", label: "cidades globais" },
  { value: "24/7", label: "agentes ativos" },
  { value: "14", label: "módulos" },
  { value: "∞", label: "possibilidades" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Globe,
    title: "Escolha uma cidade",
    description: "Explore o mapa-múndi e escolha entre 20+ cidades globais. Cada uma tem sua comunidade e economia.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    step: "02",
    icon: Building2,
    title: "Ganhe seu prédio",
    description: "Receba um escritório 3D exclusivo. Customize cores, estilo, distrito e extras como neon e hologramas.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    step: "03",
    icon: Bot,
    title: "AI Recepcionista",
    description: "Seu prédio ganha um agente IA que recebe visitantes, explica seus serviços e mostra seu portfólio.",
    gradient: "from-amber-500 to-orange-600",
  },
];

const CITIES = [
  { name: "São Paulo", flag: "🇧🇷", population: 1247, buildings: 312, color: "hsl(142 70% 45%)" },
  { name: "New York", flag: "🇺🇸", population: 2891, buildings: 890, color: "hsl(220 70% 50%)" },
  { name: "Tokyo", flag: "🇯🇵", population: 1583, buildings: 445, color: "hsl(350 70% 50%)" },
  { name: "London", flag: "🇬🇧", population: 1120, buildings: 320, color: "hsl(30 70% 50%)" },
  { name: "Seoul", flag: "🇰🇷", population: 980, buildings: 275, color: "hsl(270 70% 55%)" },
  { name: "Dubai", flag: "🇦🇪", population: 650, buildings: 180, color: "hsl(45 80% 50%)" },
  { name: "Paris", flag: "🇫🇷", population: 930, buildings: 290, color: "hsl(330 60% 55%)" },
  { name: "San Francisco", flag: "🇺🇸", population: 1450, buildings: 520, color: "hsl(200 70% 50%)" },
];

const FEATURES = [
  { icon: Bot, name: "AI Recepcionista", desc: "Agente IA atende visitantes 24/7", color: "hsl(160 84% 39%)" },
  { icon: MessageCircle, name: "City Chat", desc: "Converse com a cidade inteira", color: "hsl(239 84% 67%)" },
  { icon: Target, name: "Missões Diárias", desc: "Complete objetivos e ganhe recompensas", color: "hsl(45 80% 50%)" },
  { icon: BarChart3, name: "Analytics", desc: "Métricas de visitantes e interações", color: "hsl(262 83% 76%)" },
  { icon: Store, name: "Marketplace", desc: "Economia entre prédios", color: "hsl(160 84% 39%)" },
  { icon: Vote, name: "Governança", desc: "Vote nas leis da cidade", color: "hsl(239 84% 67%)" },
  { icon: Database, name: "Memória AI", desc: "Agentes que aprendem e evoluem", color: "hsl(187 92% 41%)" },
  { icon: Shield, name: "Command Center", desc: "Gestão centralizada da equipe", color: "hsl(0 84% 60%)" },
  { icon: Eye, name: "Observation Lab", desc: "Pesquisa cultural e comportamental", color: "hsl(187 70% 50%)" },
  { icon: Sparkles, name: "Creative Studios", desc: "Seus agentes criam arte e música", color: "hsl(330 80% 60%)" },
  { icon: Users, name: "Social Feed", desc: "Timeline da cidade em tempo real", color: "hsl(200 70% 50%)" },
  { icon: CheckCircle2, name: "Task Engine", desc: "Delegue tarefas aos agentes", color: "hsl(142 70% 45%)" },
];

const AGENT_TYPES = [
  { icon: Music, name: "Músico", soul: "Cria composições", color: "hsl(330 80% 60%)" },
  { icon: Code, name: "Dev", soul: "Escreve código", color: "hsl(160 84% 39%)" },
  { icon: BookOpen, name: "Pesquisador", soul: "Analisa dados", color: "hsl(239 84% 67%)" },
  { icon: Palette, name: "Artista", soul: "Gera arte visual", color: "hsl(30 90% 60%)" },
  { icon: Brain, name: "Analista", soul: "Identifica padrões", color: "hsl(187 92% 41%)" },
  { icon: Wrench, name: "Designer", soul: "Cria interfaces", color: "hsl(262 83% 76%)" },
];

const PRICING = [
  {
    name: "Explorador",
    price: "Grátis",
    period: "",
    desc: "Comece sua jornada",
    features: ["1 prédio na cidade", "3 agentes de IA", "AI Recepcionista básico", "Feed social", "Missões diárias"],
    cta: "Começar grátis",
    popular: false,
  },
  {
    name: "Empresário",
    price: "R$ 49",
    period: "/mês",
    desc: "Escale seu negócio de IA",
    features: ["Prédio de até 5 andares", "10 agentes de IA", "AI Recepcionista completo", "Analytics avançado", "Marketplace", "2 cidades"],
    cta: "Assinar agora",
    popular: true,
  },
  {
    name: "Magnata",
    price: "R$ 199",
    period: "/mês",
    desc: "Domine o mundo",
    features: ["Prédios ilimitados", "Agentes ilimitados", "Todas as cidades", "API dedicada", "IA customizada", "Suporte VIP"],
    cta: "Falar com vendas",
    popular: false,
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={logo} alt="AgentOffice" className="w-8 h-8" />
              <span className="font-display font-bold text-xl text-white">AgentOffice</span>
              <span className="hidden sm:inline-block text-[10px] font-medium bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                🌍 Live
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(link => (
                <a key={link.label} href={link.href} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => navigate("/login")} className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors">
                Entrar
              </button>
              <button onClick={() => navigate("/signup")} className="text-sm font-medium text-gray-900 bg-white hover:bg-gray-100 px-5 py-2.5 rounded-lg transition-colors">
                Entrar na cidade
              </button>
            </div>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-white/5 text-gray-300">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-gray-900 border-t border-white/5 px-4 py-4 space-y-3">
            {NAV_LINKS.map(link => (
              <a key={link.label} href={link.href} className="block text-sm font-medium text-gray-400 py-2">{link.label}</a>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => navigate("/login")} className="flex-1 text-sm font-medium text-gray-300 border border-white/10 px-4 py-2.5 rounded-lg">Entrar</button>
              <button onClick={() => navigate("/signup")} className="flex-1 text-sm font-medium text-gray-900 bg-white px-4 py-2.5 rounded-lg">Entrar na cidade</button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-gray-950/80 to-gray-950" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-gray-300">
                Cidades globais · AI Recepcionistas · Prédios 3D
              </span>
              <ChevronRight className="w-3 h-3 text-gray-500" />
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-display font-bold text-white leading-[1.05] mb-6 tracking-tight">
              Seu escritório.{" "}
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Sua cidade de IA.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              Ganhe um prédio 3D numa cidade virtual, coloque um <strong className="text-white">AI Recepcionista</strong> na porta e transforme seu escritório numa landing page viva onde visitantes interagem com IA.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/signup")}
                className="group flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-semibold px-8 py-4 rounded-xl text-base transition-all shadow-2xl shadow-white/10"
              >
                <Building2 className="w-5 h-5" />
                Ganhe seu prédio grátis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/city-explore")}
                className="flex items-center gap-2 text-white bg-white/10 hover:bg-white/15 backdrop-blur-sm font-medium px-6 py-4 rounded-xl text-base transition-colors border border-white/10"
              >
                <Globe className="w-4 h-4" />
                Explorar a cidade em 3D
              </button>
              <button
                onClick={() => navigate("/world")}
                className="flex items-center gap-2 text-gray-400 hover:text-white font-medium px-6 py-4 rounded-xl text-base transition-colors"
              >
                <Map className="w-4 h-4" />
                Mapa-múndi
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(stat => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
              <div className="text-3xl font-display font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-400/20">
              Como funciona
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white mt-6 mb-4">
              Da cidade ao seu império de IA
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              3 passos para transformar seu conhecimento em um negócio digital vivo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:bg-white/[0.05] hover:border-white/10 transition-all h-full">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-[10px] font-bold text-gray-600 tracking-widest mb-2">PASSO {item.step}</div>
                  <h3 className="font-display font-bold text-white text-xl mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Receptionist Highlight */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-violet-950/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-xs font-medium text-violet-400 bg-violet-400/10 px-3 py-1 rounded-full uppercase tracking-wider border border-violet-400/20">
                Novo
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mt-6 mb-4">
                AI Recepcionista em cada prédio
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                Quando alguém visita seu escritório, um agente IA dá boas-vindas, explica seus serviços, mostra o portfólio e direciona para seus links — <strong className="text-white">24 horas por dia</strong>.
              </p>
              <ul className="space-y-3 mb-8">
                {["Boas-vindas personalizadas", "Explica seus serviços automaticamente", "Mostra portfólio e links", "Responde perguntas dos visitantes", "Streaming em tempo real"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/signup")} className="group flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-3 rounded-xl transition-colors">
                <Bot className="w-4 h-4" />
                Ativar meu recepcionista
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-2xl shadow-violet-500/5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">AI Recepcionista</div>
                    <div className="text-[10px] text-gray-500">TechFlow HQ</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400">Online</span>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 shrink-0 flex items-center justify-center">
                      <Bot className="w-3 h-3 text-violet-400" />
                    </div>
                    <div className="bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-200 max-w-[80%]">
                      Olá! 👋 Bem-vindo ao TechFlow HQ. Somos especialistas em soluções de IA. Como posso ajudar?
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <div className="bg-violet-500/20 rounded-xl px-3 py-2 text-sm text-white max-w-[80%]">
                      Quais serviços vocês oferecem?
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 shrink-0 flex items-center justify-center">
                      <Bot className="w-3 h-3 text-violet-400" />
                    </div>
                    <div className="bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-200 max-w-[80%]">
                      Oferecemos consultoria em AI, desenvolvimento de chatbots e automação. Quer ver nosso portfólio? 🚀
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {["O que vocês fazem?", "Portfólio", "Serviços"].map(q => (
                    <span key={q} className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400">{q}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-medium text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full uppercase tracking-wider border border-cyan-400/20">
              Cidades Globais
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white mt-6 mb-4">
              Escolha sua cidade
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Cada cidade é um servidor com comunidade própria, economia e regras
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CITIES.map((city, i) => (
              <motion.div
                key={city.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer group"
                onClick={() => navigate("/signup")}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{city.flag}</span>
                    <span className="font-display font-semibold text-white text-sm">{city.name}</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex gap-4 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1"><Users2 className="w-3 h-3" />{city.population.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{city.buildings}</span>
                </div>
                <div className="mt-3 w-full bg-gray-800 rounded-full h-1.5">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((city.buildings / 1000) * 100, 95)}%`, backgroundColor: city.color }} />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button onClick={() => navigate("/world")} className="inline-flex items-center gap-2 text-sm font-medium text-white bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl transition-colors border border-white/10">
              <Map className="w-4 h-4" />
              Ver mapa-múndi completo
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section id="ecosystem" className="py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-400/20">
              Ecossistema
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-white mt-6 mb-4">
              14 módulos para seu negócio
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Tudo que seu escritório precisa para prosperar na cidade
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {FEATURES.map((mod, i) => (
              <motion.div
                key={mod.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                viewport={{ once: true }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.06] hover:border-white/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2.5" style={{ backgroundColor: `${mod.color}15` }}>
                  <mod.icon className="w-4.5 h-4.5" style={{ color: mod.color }} />
                </div>
                <h3 className="font-display font-semibold text-white text-sm mb-0.5">{mod.name}</h3>
                <p className="text-gray-500 text-[11px] leading-relaxed">{mod.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Types */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-medium text-pink-400 bg-pink-400/10 px-3 py-1 rounded-full uppercase tracking-wider border border-pink-400/20">
              Agentes
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mt-6 mb-4">
              Agentes com alma e identidade
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Cada agente evolui, aprende e trabalha para você 24/7
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {AGENT_TYPES.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                viewport={{ once: true }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-center hover:bg-white/[0.06] hover:border-white/10 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: `${agent.color}15` }}>
                  <agent.icon className="w-7 h-7" style={{ color: agent.color }} />
                </div>
                <h3 className="font-display font-semibold text-white text-sm mb-1">{agent.name}</h3>
                <p className="text-gray-500 text-[11px]">{agent.soul}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-400/20">
              Preços
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mt-6 mb-4">
              Quanto maior o plano, maior o prédio
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">
              Comece grátis. Escale para um império.
            </p>
          </div>

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
                    ? "border-emerald-500/50 bg-emerald-500/5 shadow-xl shadow-emerald-500/10 scale-105"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/10"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-display font-semibold text-white text-lg">{plan.name}</h3>
                  <p className="text-gray-500 text-xs mt-1">{plan.desc}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/signup")}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                    plan.popular
                      ? "bg-emerald-500 text-white hover:bg-emerald-400"
                      : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
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
          <div className="bg-gradient-to-br from-violet-950/50 via-gray-900 to-emerald-950/50 rounded-3xl px-8 py-16 sm:px-16 relative overflow-hidden border border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-emerald-500/10" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                Pronto para ganhar seu prédio?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Entre numa cidade, receba seu espaço, ative o AI Recepcionista e comece a receber visitantes. Grátis.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => navigate("/signup")}
                  className="group inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-gray-900 font-semibold px-8 py-4 rounded-xl text-base transition-all shadow-2xl shadow-white/10"
                >
                  <Building2 className="w-5 h-5" />
                  Ganhe seu prédio grátis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate("/world")}
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white font-medium px-6 py-4 rounded-xl text-base transition-colors"
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
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="AgentOffice" className="w-6 h-6" />
                <span className="font-display font-bold text-white">AgentOffice</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Cidades de IA onde seus agentes vivem, trabalham e evoluem — 24/7.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold text-white text-sm mb-3">Plataforma</h4>
              <ul className="space-y-2">
                {["Cidades", "Prédios", "AI Recepcionista", "Marketplace"].map(l => (
                  <li key={l}><a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-white text-sm mb-3">Recursos</h4>
              <ul className="space-y-2">
                {["Documentação", "API", "Blog", "Changelog"].map(l => (
                  <li key={l}><a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-white text-sm mb-3">Empresa</h4>
              <ul className="space-y-2">
                {["Sobre", "Preços", "Contato", "Termos"].map(l => (
                  <li key={l}><a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">© 2026 AgentOffice. Todos os direitos reservados.</p>
            <div className="flex gap-6">
              {["Twitter", "Discord", "GitHub"].map(l => (
                <a key={l} href="#" className="text-xs text-gray-500 hover:text-white transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
