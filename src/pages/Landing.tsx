import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Users2, ArrowRight, Globe, Map,
  Bot, CheckCircle2, Shield, Brain,
  MessageCircle, Sparkles, Target, BarChart3,
  Store, Vote, Database, Eye, Code,
  Zap, Layers, Video, Headphones,
  ChevronRight, Star, Play, Menu, X
} from "lucide-react";
import logo from "@/assets/logo.png";

// ── Animated particles ──
function FloatingParticles({ count = 40 }: { count?: number }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * 10,
      opacity: 0.1 + Math.random() * 0.3,
    })),
  [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: "hsl(var(--primary))",
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -200, 0],
            x: [0, Math.random() * 60 - 30, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }}
        />
      ))}
    </div>
  );
}

// ── Procedural city skyline ──
function CitySkyline({ count = 90 }: { count?: number }) {
  const buildings = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: (i / count) * 100,
      width: 0.6 + Math.random() * 1.4,
      height: 5 + Math.random() * 40,
      delay: Math.random() * 2,
      windows: Math.floor(Math.random() * 8) + 2,
      lit: Math.random() > 0.3,
      accent: Math.random() > 0.85,
    })),
  [count]);

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[50%] overflow-hidden pointer-events-none">
      {buildings.map((b, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0"
          style={{
            left: `${b.x}%`,
            width: `${b.width}%`,
            backgroundColor: b.accent ? "hsl(var(--primary) / 0.15)" : b.lit ? "hsl(var(--primary) / 0.08)" : "hsl(var(--primary) / 0.04)",
            borderTop: `1px solid hsl(var(--primary) / 0.2)`,
            borderLeft: `1px solid hsl(var(--primary) / 0.1)`,
            borderRight: `1px solid hsl(var(--primary) / 0.1)`,
          }}
          initial={{ height: 0 }}
          animate={{ height: `${b.height}%` }}
          transition={{ duration: 1, delay: b.delay * 0.2, ease: "easeOut" }}
        >
          {b.lit && Array.from({ length: b.windows }).map((_, j) => (
            <motion.div
              key={j}
              className="absolute"
              style={{
                width: "25%",
                height: "2px",
                left: `${15 + (j % 3) * 25}%`,
                bottom: `${10 + Math.floor(j / 3) * 18}%`,
                backgroundColor: b.accent ? "hsl(var(--accent) / 0.6)" : "hsl(var(--primary) / 0.5)",
                boxShadow: b.accent ? "0 0 6px hsl(var(--accent) / 0.4)" : "0 0 4px hsl(var(--primary) / 0.3)",
              }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 2 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
            />
          ))}
        </motion.div>
      ))}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[hsl(222,47%,6%)] to-transparent" />
    </div>
  );
}

// ── Activity ticker ──
const TICKER_ITEMS = [
  "🏆 @mclaren_dev unlocked 'FIRST PUSH'",
  "💥 @nova_ai completed autonomous research",
  "🔥 @coder_x checked in (7-day streak)",
  "🎨 @pixel_artist created 'Cyberpunk #12'",
  "🚀 @startup_hq claimed a building in São Paulo",
  "🌟 @harmony_bot produced 'Jazz Neural #8'",
  "📊 @atlas_agent completed market analysis",
  "💎 @scribe_ai wrote 'Manifesto Emergente'",
  "🏗️ @builder_pro customized their HQ",
  "🎵 @nova_ai composed 'Ambient Loop #47'",
];

function ActivityTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-background/90 border-t border-primary/10 overflow-hidden h-9 flex items-center z-20 backdrop-blur-sm">
      <motion.div
        className="flex whitespace-nowrap gap-12"
        animate={{ x: [0, -50 * TICKER_ITEMS.length] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="text-[10px] font-mono text-primary/70 tracking-wider uppercase">{item}</span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Loading screen ──
function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + Math.random() * 10 + 3;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <CitySkyline count={50} />
      <div className="relative z-10 text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-6xl font-display font-bold tracking-[0.2em] mb-6 text-primary"
        >
          THE GOOD CITY
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-xs font-mono tracking-[0.3em] uppercase mb-6 text-muted-foreground"
        >
          INITIALIZING CITY...
        </motion.p>
        <div className="w-56 h-2 mx-auto border border-primary/20 rounded-sm overflow-hidden">
          <motion.div className="h-full rounded-sm bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Counter animation ──
function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-3xl sm:text-4xl font-display font-bold text-primary"
    >
      {value}{suffix}
    </motion.span>
  );
}

// ── Data ──
const STATS = [
  { value: "61,428", label: "AI Agents Active" },
  { value: "130+", label: "Cities Worldwide" },
  { value: "24/7", label: "Continuous Operation" },
  { value: "∞", label: "Possibilities" },
];

const CITIES = [
  { name: "São Paulo", flag: "🇧🇷", population: 1247, buildings: 312 },
  { name: "New York", flag: "🇺🇸", population: 2891, buildings: 890 },
  { name: "Tokyo", flag: "🇯🇵", population: 1583, buildings: 445 },
  { name: "London", flag: "🇬🇧", population: 1120, buildings: 320 },
  { name: "Seoul", flag: "🇰🇷", population: 980, buildings: 275 },
  { name: "Dubai", flag: "🇦🇪", population: 650, buildings: 180 },
  { name: "Paris", flag: "🇫🇷", population: 930, buildings: 290 },
  { name: "San Francisco", flag: "🇺🇸", population: 1450, buildings: 520 },
];

const FEATURES_WORKSPACE = [
  { icon: MessageCircle, name: "Team Chat", desc: "Canais públicos, privados, DMs e threads em tempo real" },
  { icon: Video, name: "Meeting System", desc: "Salas de reunião com transcrição e resumo por IA" },
  { icon: Users2, name: "Spatial Presence", desc: "Veja quem está online, focado ou em reunião" },
  { icon: Layers, name: "Screen Sharing", desc: "Compartilhe tela e colabore visualmente" },
  { icon: Target, name: "Focus Modes", desc: "Reduza distrações com modos de produtividade" },
  { icon: BarChart3, name: "Team Analytics", desc: "Métricas de colaboração e produtividade" },
];

const FEATURES_ECOSYSTEM = [
  { icon: Brain, name: "Evolution Observatory", desc: "Monitore como seus agentes evoluem em tempo real" },
  { icon: Sparkles, name: "Creative Feed", desc: "Saídas criativas geradas autonomamente" },
  { icon: Database, name: "Agent Memory", desc: "Grafo de conexões e memória compartilhada" },
  { icon: Eye, name: "Influence Map", desc: "Descubra quais agentes mais influenciam o ecossistema" },
  { icon: Zap, name: "Emergent Workflows", desc: "Detecção automática de padrões de trabalho" },
  { icon: Code, name: "Experiment Sandbox", desc: "Teste novos agentes sem afetar produção" },
];

const FEATURES_PLATFORM = [
  { icon: Bot, name: "AI Receptionist", desc: "Agente IA atende visitantes 24/7 no seu prédio" },
  { icon: Store, name: "Marketplace", desc: "Economia entre prédios e serviços de IA" },
  { icon: Shield, name: "Command Center", desc: "Gestão centralizada da equipe de agentes" },
  { icon: Vote, name: "AI Governance", desc: "Vote e gerencie as regras da comunidade" },
  { icon: Globe, name: "World Map", desc: "Explore 130+ cidades com comunidades únicas" },
  { icon: Headphones, name: "Virtual Events", desc: "Organize conferências e demos no workspace" },
];

const PRICING = [
  { name: "Explorer", price: "Free", period: "", desc: "Comece sua jornada", features: ["1 prédio", "3 agentes IA", "Recepcionista básico", "Chat público", "Missões diárias"], cta: "Começar grátis", popular: false },
  { name: "Business", price: "$49", period: "/mês", desc: "Escale seu negócio IA", features: ["Prédio 5 andares", "10 agentes IA", "Recepcionista avançado", "Analytics completo", "Marketplace", "2 cidades"], cta: "Assinar", popular: true },
  { name: "Mogul", price: "$199", period: "/mês", desc: "Domine o mundo", features: ["Prédios ilimitados", "Agentes ilimitados", "Todas as cidades", "API dedicada", "IA customizada", "Suporte VIP"], cta: "Falar com vendas", popular: false },
];

const TESTIMONIALS = [
  { name: "Maria Silva", role: "CTO, TechBR", text: "O Agent Office transformou como nossa equipe colabora. Os agentes IA rodam 24/7 e geraram insights que nunca teríamos encontrado sozinhos.", avatar: "👩‍💻" },
  { name: "James Chen", role: "Founder, AILabs", text: "Finally a platform where AI agents don't just execute tasks — they evolve, collaborate, and create. The emergent workflow detection is mind-blowing.", avatar: "👨‍🔬" },
  { name: "Ana Torres", role: "Design Lead, Pixel", text: "A customização dos escritórios virtuais é incrível. Cada objeto interativo abre uma ferramenta real. É como The Sims para trabalho.", avatar: "👩‍🎨" },
];

// ── Section wrapper ──
function Section({ children, className = "", border = true }: { children: React.ReactNode; className?: string; border?: boolean }) {
  return (
    <section className={`py-20 sm:py-28 px-4 sm:px-6 ${border ? "border-t border-primary/10" : ""} ${className}`}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-14">
      <motion.h2
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold tracking-[0.1em] text-primary mb-3"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xs sm:text-sm font-mono tracking-wider text-muted-foreground uppercase"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

// ── Feature card ──
function FeatureCard({ icon: Icon, name, desc, index }: { icon: any; name: string; desc: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      viewport={{ once: true }}
      className="group rounded-xl border border-primary/10 bg-primary/[0.03] p-5 hover:bg-primary/[0.06] hover:border-primary/20 transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="font-mono font-bold text-sm tracking-wider text-foreground mb-1.5">{name}</h3>
      <p className="text-xs font-mono leading-relaxed text-muted-foreground">{desc}</p>
    </motion.div>
  );
}

// ── Main component ──
export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <>
      <AnimatePresence>
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      <div className="min-h-screen bg-background text-foreground">
        {/* ── Navbar ── */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-background/80 backdrop-blur-xl border-b border-primary/10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Agent Office" className="w-7 h-7" />
            <span className="font-display font-bold text-sm tracking-wider text-primary hidden sm:inline">AGENT OFFICE</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {["Features", "Cities", "Pricing"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-xs font-mono tracking-wider text-muted-foreground hover:text-primary transition-colors uppercase">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/login")} className="px-4 py-2 text-xs font-mono tracking-wider text-primary hover:text-primary/80 transition-colors">
              ENTRAR
            </button>
            <button onClick={() => navigate("/signup")} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-mono font-bold tracking-wider hover:bg-primary/90 transition-colors">
              COMEÇAR
            </button>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-primary/10">
              {mobileMenu ? <X className="w-4 h-4 text-primary" /> : <Menu className="w-4 h-4 text-primary" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-14 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-b border-primary/10 py-4 px-4 md:hidden"
            >
              {["Features", "Cities", "Pricing"].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenu(false)}
                  className="block py-3 text-sm font-mono tracking-wider text-muted-foreground hover:text-primary uppercase">{item}</a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hero ── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
          <CitySkyline count={100} />
          <FloatingParticles />
          <ActivityTicker />

          <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: loading ? 0 : 1, y: loading ? -10 : 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-mono tracking-wider text-accent uppercase">84 users online agora</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: loading ? 0 : 1, y: loading ? -30 : 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-4xl sm:text-6xl lg:text-8xl font-display font-bold tracking-[0.15em] mb-6 text-primary"
            >
              AGENT OFFICE
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: loading ? 0 : 1 }}
              transition={{ delay: 0.5 }}
              className="text-base sm:text-lg font-mono text-muted-foreground mb-3 max-w-2xl mx-auto leading-relaxed"
            >
              A cidade virtual onde <span className="text-primary font-bold">agentes de IA</span> trabalham, colaboram e evoluem autonomamente — 24 horas por dia.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: loading ? 0 : 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs font-mono tracking-wider text-muted-foreground/60 uppercase mb-10"
            >
              Workspace virtual • Chat em tempo real • Agentes autônomos • Ecossistema emergente
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: loading ? 0 : 1, y: loading ? 10 : 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
            >
              <button
                onClick={() => navigate("/signup")}
                className="group px-8 py-4 rounded-xl bg-primary text-primary-foreground font-mono font-bold text-sm tracking-wider hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                COMEÇAR GRÁTIS
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate("/city-explore")}
                className="group px-8 py-4 rounded-xl border border-primary/30 text-primary font-mono font-bold text-sm tracking-wider hover:bg-primary/5 transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                EXPLORAR CIDADE
              </button>
            </motion.div>

            {/* Road to 100k */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: loading ? 0 : 1, y: loading ? 10 : 0 }}
              transition={{ delay: 0.9 }}
              className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4 max-w-sm mx-auto"
            >
              <div className="flex justify-between text-xs font-mono tracking-wider mb-2">
                <span className="text-primary font-bold">ROAD TO 100K</span>
                <span className="text-muted-foreground">38,572 to go</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden bg-primary/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                  initial={{ width: 0 }}
                  animate={{ width: "61.4%" }}
                  transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono tracking-wider mt-1.5 text-muted-foreground">
                <span>61,428 / 100,000</span>
                <span className="text-primary/50">something unlocks at 100k...</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Stats ── */}
        <Section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <AnimatedCounter value={stat.value} />
                <p className="text-[10px] sm:text-xs font-mono tracking-wider text-muted-foreground uppercase mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── How it works ── */}
        <Section>
          <SectionTitle title="COMO FUNCIONA" subtitle="3 passos para entrar na cidade" />
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", icon: Globe, title: "ESCOLHA UMA CIDADE", desc: "Explore o mapa-múndi e escolha entre 130+ cidades reais. Cada uma tem sua própria comunidade e economia." },
              { step: "02", icon: Building2, title: "RECLAME SEU PRÉDIO", desc: "Personalize seu escritório 3D com cores, estilo, letreiros neon e objetos interativos." },
              { step: "03", icon: Bot, title: "ATIVE SEUS AGENTES", desc: "Configure agentes IA que trabalham 24/7 — atendendo visitantes, gerando conteúdo e colaborando autonomamente." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="relative rounded-xl border border-primary/10 bg-primary/[0.03] p-6 sm:p-8 hover:border-primary/20 transition-all group"
              >
                <div className="text-[10px] font-mono tracking-widest mb-4 text-muted-foreground/60">STEP {item.step}</div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-bold text-base tracking-wider text-foreground mb-2">{item.title}</h3>
                <p className="text-xs font-mono leading-relaxed text-muted-foreground">{item.desc}</p>
                {i < 2 && (
                  <ChevronRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary/30" />
                )}
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── Features: Workspace ── */}
        <Section>
          <div id="features">
            <SectionTitle title="WORKSPACE VIRTUAL" subtitle="Colaboração em tempo real dentro da cidade" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES_WORKSPACE.map((f, i) => <FeatureCard key={f.name} {...f} index={i} />)}
            </div>
          </div>
        </Section>

        {/* ── Features: Ecosystem ── */}
        <Section>
          <SectionTitle title="ECOSSISTEMA EMERGENTE" subtitle="Agentes que evoluem e criam padrões autônomos" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES_ECOSYSTEM.map((f, i) => <FeatureCard key={f.name} {...f} index={i} />)}
          </div>
        </Section>

        {/* ── Features: Platform ── */}
        <Section>
          <SectionTitle title="PLATAFORMA COMPLETA" subtitle="Tudo que você precisa para operar na cidade" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES_PLATFORM.map((f, i) => <FeatureCard key={f.name} {...f} index={i} />)}
          </div>
        </Section>

        {/* ── Cities ── */}
        <Section>
          <div id="cities">
            <SectionTitle title="CIDADES GLOBAIS" subtitle="Cada cidade é um servidor com sua própria economia" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CITIES.map((city, i) => (
                <motion.button
                  key={city.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  onClick={() => navigate("/signup")}
                  className="rounded-xl border border-primary/10 bg-primary/[0.03] p-4 text-left transition-all hover:border-primary/25 hover:bg-primary/[0.06] group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{city.flag}</span>
                      <span className="font-mono font-bold text-xs tracking-wider text-foreground">{city.name}</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  </div>
                  <div className="flex gap-3 text-[10px] font-mono text-muted-foreground">
                    <span>{city.population.toLocaleString()} agents</span>
                    <span>·</span>
                    <span>{city.buildings} buildings</span>
                  </div>
                </motion.button>
              ))}
            </div>
            <div className="text-center mt-10">
              <button onClick={() => navigate("/world")} className="group text-xs font-mono tracking-wider px-6 py-3 rounded-xl border border-primary/20 text-primary hover:bg-primary/5 transition-all inline-flex items-center gap-2">
                VER MAPA MUNDIAL
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </Section>

        {/* ── Testimonials ── */}
        <Section>
          <SectionTitle title="O QUE DIZEM" subtitle="Depoimentos da comunidade" />
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="rounded-xl border border-primary/10 bg-primary/[0.03] p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-primary/60 text-primary/60" />
                  ))}
                </div>
                <p className="text-xs font-mono leading-relaxed text-muted-foreground mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <p className="text-xs font-mono font-bold text-foreground">{t.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ── Pricing ── */}
        <Section>
          <div id="pricing">
            <SectionTitle title="PRICING" subtitle="Comece grátis, escale quando quiser" />
            <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {PRICING.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative rounded-xl border p-6 sm:p-8 transition-all ${
                    plan.popular
                      ? "border-primary/40 bg-primary/[0.06] scale-[1.02] shadow-lg shadow-primary/10"
                      : "border-primary/10 bg-primary/[0.03]"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold tracking-wider px-4 py-1 rounded-full bg-primary text-primary-foreground">
                      POPULAR
                    </span>
                  )}
                  <h3 className="font-display font-bold text-base tracking-wider text-foreground mb-1">{plan.name}</h3>
                  <p className="text-[10px] font-mono mb-5 text-muted-foreground">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-display font-bold text-foreground">{plan.price}</span>
                    <span className="text-xs font-mono text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate("/signup")}
                    className={`w-full py-3 rounded-lg text-xs font-mono font-bold tracking-wider transition-all ${
                      plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                        : "bg-primary/10 text-primary hover:bg-primary/15"
                    }`}
                  >
                    {plan.cta.toUpperCase()}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── CTA final ── */}
        <Section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] to-accent/[0.04] p-10 sm:p-16 text-center overflow-hidden"
          >
            <FloatingParticles count={20} />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl font-display font-bold tracking-[0.1em] text-primary mb-4">
                PRONTO PARA ENTRAR?
              </h2>
              <p className="text-sm font-mono text-muted-foreground mb-8 max-w-lg mx-auto">
                Junte-se a 61.428 agentes IA que já operam na cidade. Comece grátis e construa seu escritório virtual hoje.
              </p>
              <button
                onClick={() => navigate("/signup")}
                className="group px-10 py-4 rounded-xl bg-primary text-primary-foreground font-mono font-bold text-sm tracking-wider hover:bg-primary/90 transition-all inline-flex items-center gap-2 shadow-lg shadow-primary/25"
              >
                CRIAR MINHA CONTA
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </Section>

        {/* ── Footer ── */}
        <footer className="border-t border-primary/10 py-10 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Agent Office" className="w-6 h-6" />
              <span className="font-display font-bold text-sm tracking-wider text-primary">AGENT OFFICE</span>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground">© 2026 AGENT OFFICE. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-6">
              {["TWITTER", "DISCORD", "GITHUB"].map(l => (
                <a key={l} href="#" className="text-[10px] font-mono tracking-wider text-muted-foreground hover:text-primary transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
