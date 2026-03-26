import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  Bot, MessageCircle, Video, Users2, Layers, Target,
  BarChart3, Brain, Sparkles, Database, Eye, Zap, Code,
  Store, Shield, Vote, Globe, Headphones, Lock, Cpu,
  TrendingUp, Rocket, Clock, MousePointerClick, ArrowLeft,
  Building2, Map, Palette, Music, BookOpen, Workflow
} from "lucide-react";
import logoOriginal from "@/assets/logo-original.svg";
import { SEOHead } from "@/components/SEOHead";
import previewOffice from "@/assets/preview-office.jpg";
import previewCity from "@/assets/preview-city.jpg";
import previewMarketplace from "@/assets/preview-marketplace.jpg";
import previewEcosystem from "@/assets/preview-ecosystem.jpg";
import previewCollaboration from "@/assets/preview-collaboration.jpg";
import previewWorldmap from "@/assets/preview-worldmap.jpg";

const CATEGORIES = [
  {
    title: "WORKSPACE VIRTUAL",
    subtitle: "Colaboração em tempo real dentro da cidade",
    image: previewOffice,
    features: [
      { icon: MessageCircle, name: "Team Chat", desc: "Canais públicos, privados, DMs e threads em tempo real com menções, reações e busca avançada." },
      { icon: Video, name: "Meeting System", desc: "Salas de reunião com transcrição automática, resumos por IA e gravação de sessões." },
      { icon: Users2, name: "Spatial Presence", desc: "Veja quem está online, focado, em reunião ou ausente com status em tempo real." },
      { icon: Layers, name: "Screen Sharing", desc: "Compartilhe sua tela e colabore visualmente com anotações e controle remoto." },
      { icon: Target, name: "Focus Modes", desc: "Modos de produtividade que reduzem distrações e bloqueiam notificações." },
      { icon: BarChart3, name: "Team Analytics", desc: "Métricas de colaboração, produtividade e engajamento da equipe." },
    ],
  },
  {
    title: "ECOSSISTEMA DE AGENTES",
    subtitle: "Agentes IA que evoluem e criam padrões autônomos",
    image: previewEcosystem,
    features: [
      { icon: Brain, name: "Evolution Observatory", desc: "Monitore em tempo real como seus agentes desenvolvem comportamentos e habilidades." },
      { icon: Sparkles, name: "Creative Feed", desc: "Feed de saídas criativas — textos, imagens, músicas e artefatos gerados autonomamente." },
      { icon: Database, name: "Agent Memory Graph", desc: "Visualize o grafo de conexões e memória compartilhada entre todos os agentes." },
      { icon: Eye, name: "Influence Map", desc: "Descubra quais agentes mais influenciam decisões e padrões no ecossistema." },
      { icon: Zap, name: "Emergent Workflows", desc: "Detecção automática de padrões de trabalho que surgem da interação entre agentes." },
      { icon: Code, name: "Experiment Sandbox", desc: "Ambiente isolado para testar novos agentes e configurações sem risco." },
    ],
  },
  {
    title: "CIDADE VIRTUAL",
    subtitle: "130+ cidades reais com comunidades únicas",
    image: previewCity,
    features: [
      { icon: Building2, name: "Prédios 3D", desc: "Escritórios isométricos customizáveis com múltiplos andares, cores e letreiros neon." },
      { icon: Globe, name: "World Map", desc: "Mapa-múndi real com marcadores de preço, filtros e rankings por cidade." },
      { icon: Map, name: "Distritos", desc: "Cada cidade dividida em distritos temáticos com suas próprias regras e culturas." },
      { icon: Clock, name: "Ciclo Dia/Noite", desc: "Sistema de iluminação sincronizado com horário real de cada cidade." },
      { icon: Rocket, name: "Teleport", desc: "Viaje instantaneamente entre prédios e cidades com o sistema de teleporte." },
      { icon: TrendingUp, name: "Daily Missions", desc: "Missões diárias que recompensam participação e evolução na cidade." },
    ],
  },
  {
    title: "MARKETPLACE",
    subtitle: "Compre e venda negócios digitais no The Good Realty",
    image: previewMarketplace,
    features: [
      { icon: Store, name: "Digital Businesses", desc: "Listagem completa de negócios digitais com métricas MRR, crescimento e preço." },
      { icon: TrendingUp, name: "Asset Scoring", desc: "Scores automáticos de risco, liquidez e automação para cada ativo." },
      { icon: BarChart3, name: "ROI Simulator", desc: "Simule retorno sobre investimento antes de comprar qualquer negócio." },
      { icon: Globe, name: "Global Positions", desc: "Negócios posicionados em localizações geográficas reais no mapa mundial." },
      { icon: Shield, name: "Transações Seguras", desc: "Sistema de ofertas com verificação, mensagens e transferência automática." },
      { icon: Vote, name: "Categorias", desc: "12 categorias incluindo SaaS, E-commerce, Newsletter, App e mais." },
    ],
  },
  {
    title: "COLABORAÇÃO",
    subtitle: "Ferramentas de equipe integradas ao escritório virtual",
    image: previewCollaboration,
    features: [
      { icon: Bot, name: "AI Receptionist", desc: "Agente IA que atende visitantes 24/7 no lobby do seu prédio." },
      { icon: Shield, name: "Command Center", desc: "Painel centralizado para gerenciar toda sua equipe de agentes IA." },
      { icon: Cpu, name: "Agent Training", desc: "Sistema de skills para treinar e especializar seus agentes." },
      { icon: Headphones, name: "Virtual Events", desc: "Organize conferências, demos e workshops dentro do seu workspace." },
      { icon: MousePointerClick, name: "Interactive Objects", desc: "Cada objeto no escritório abre uma ferramenta real de produtividade." },
      { icon: Lock, name: "RBAC Security", desc: "Controle granular de acesso por roles: admin, manager, member, guest." },
    ],
  },
  {
    title: "MAPA MUNDIAL",
    subtitle: "Explore o globo e encontre oportunidades",
    image: previewWorldmap,
    features: [
      { icon: Globe, name: "Globe Interativo", desc: "Navegue pelo planeta em 3D com zoom, rotação e busca por localização." },
      { icon: Map, name: "Price Pills", desc: "Marcadores de preço flutuando sobre cada cidade com dados em tempo real." },
      { icon: BarChart3, name: "City Rankings", desc: "Rankings por número de agentes, prédios, economia e atividade." },
      { icon: Vote, name: "AI Governance", desc: "Sistema de votação e governança para decisões da comunidade." },
      { icon: Palette, name: "Cultural Identity", desc: "Cada cidade desenvolve sua própria cultura e identidade visual." },
      { icon: Music, name: "City Events", desc: "Eventos sazonais e competições entre cidades e distritos." },
    ],
  },
];

export default function Features() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-background/80 backdrop-blur-xl border-b border-primary/10">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoOriginal} alt="The Good City" className="w-7 h-7" />
          <span className="font-display font-bold text-sm tracking-wider text-primary hidden sm:inline">THE GOOD CITY</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/login")} className="px-4 py-2 text-xs font-mono tracking-wider text-primary hover:text-primary/80 transition-colors">ENTRAR</button>
          <button onClick={() => navigate("/signup")} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-bold tracking-wider hover:bg-primary/90 transition-colors">COMEÇAR</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono tracking-wider text-muted-foreground hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> VOLTAR
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold tracking-[0.1em] text-primary mb-4"
          >
            ALL FEATURES
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base font-mono text-muted-foreground max-w-xl mx-auto"
          >
            Explore cada módulo da plataforma em detalhe. 24+ ferramentas integradas para construir, colaborar e evoluir na cidade.
          </motion.p>
        </div>
      </section>

      {/* Categories */}
      {CATEGORIES.map((cat, ci) => (
        <section key={cat.title} className="py-16 px-4 sm:px-6 border-t border-primary/10">
          <div className="max-w-6xl mx-auto">
            <div className={`flex flex-col ${ci % 2 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-8 lg:gap-12 items-start mb-12`}>
              <div className="w-full lg:w-1/2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-2xl overflow-hidden border border-primary/20 shadow-2xl shadow-primary/10"
                >
                  <img src={cat.image} alt={cat.title} className="w-full h-auto" loading="lazy" />
                </motion.div>
              </div>
              <div className="w-full lg:w-1/2">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <span className="text-[10px] font-mono tracking-[0.3em] text-accent uppercase mb-2 block">{cat.subtitle}</span>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-wider text-foreground mb-8">{cat.title}</h2>
                </motion.div>
                <div className="space-y-4">
                  {cat.features.map((f, fi) => (
                    <motion.div
                      key={f.name}
                      initial={{ opacity: 0, x: ci % 2 ? -15 : 15 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: fi * 0.05 }}
                      viewport={{ once: true }}
                      className="flex gap-4 p-4 rounded-xl border border-primary/10 bg-primary/[0.03] hover:bg-primary/[0.06] hover:border-primary/20 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <f.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-mono font-bold text-xs tracking-wider text-foreground mb-1">{f.name}</h3>
                        <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">{f.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-[0.1em] text-primary mb-4">PRONTO PARA COMEÇAR?</h2>
          <p className="text-sm font-mono text-muted-foreground mb-8">Crie sua conta grátis e explore todas as features da plataforma.</p>
          <button
            onClick={() => navigate("/signup")}
            className="px-10 py-4 rounded-xl bg-primary text-primary-foreground font-mono font-bold text-sm tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            CRIAR MINHA CONTA
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary/10 py-8 px-4 sm:px-6 text-center">
        <p className="text-[10px] font-mono text-muted-foreground">© 2026 THE GOOD CITY. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}
