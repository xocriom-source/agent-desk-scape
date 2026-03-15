import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Briefcase, Code, Palette, Megaphone, PenTool,
  Globe, Zap, Users, Star, ArrowRight, Filter, TrendingUp,
  MessageSquare, Clock, DollarSign, Sparkles, Building2
} from "lucide-react";

interface Service {
  id: string;
  title: string;
  owner: string;
  ownerBuilding: string;
  category: string;
  description: string;
  priceRange: string;
  tags: string[];
  rating: number;
  totalJobs: number;
  availability: string;
}

interface FreelancerProfile {
  id: string;
  name: string;
  building: string;
  district: string;
  skills: string[];
  bio: string;
  hourlyRate: string;
  rating: number;
  totalJobs: number;
  availability: string;
  emoji: string;
}

const CATEGORIES = [
  { id: "all", label: "Todos", icon: Sparkles },
  { id: "dev", label: "Desenvolvimento", icon: Code },
  { id: "design", label: "Design", icon: Palette },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "content", label: "Conteúdo", icon: PenTool },
  { id: "consulting", label: "Consultoria", icon: Briefcase },
  { id: "ai", label: "AI/ML", icon: Zap },
];

const MOCK_SERVICES: Service[] = [
  { id: "s1", title: "Desenvolvimento Full-Stack React/Node", owner: "André Silva", ownerBuilding: "TechFlow HQ", category: "dev", description: "Apps web completos com React, TypeScript, Node.js e banco de dados.", priceRange: "R$ 150-300/h", tags: ["React", "TypeScript", "Node.js"], rating: 4.9, totalJobs: 47, availability: "available" },
  { id: "s2", title: "UI/UX Design para Apps", owner: "Maria Santos", ownerBuilding: "Creative Labs", category: "design", description: "Design de interfaces modernas, protótipos Figma e design systems.", priceRange: "R$ 120-250/h", tags: ["Figma", "UI/UX", "Design System"], rating: 4.8, totalJobs: 62, availability: "available" },
  { id: "s3", title: "Growth Marketing Digital", owner: "Julia Costa", ownerBuilding: "Digital Agency", category: "marketing", description: "Estratégias de crescimento, ads, SEO e automação de marketing.", priceRange: "R$ 200-400/h", tags: ["SEO", "Ads", "Growth"], rating: 4.7, totalJobs: 35, availability: "busy" },
  { id: "s4", title: "Desenvolvimento de AI/ML", owner: "Pedro Mendes", ownerBuilding: "CloudBase", category: "ai", description: "Modelos de ML, chatbots, automação com IA e integração de APIs.", priceRange: "R$ 250-500/h", tags: ["Python", "ML", "LLM"], rating: 4.9, totalJobs: 28, availability: "available" },
  { id: "s5", title: "Produção de Conteúdo", owner: "Ana Ferreira", ownerBuilding: "PixelForge", category: "content", description: "Copywriting, blogs, scripts para vídeos e social media.", priceRange: "R$ 80-180/h", tags: ["Copy", "Blog", "Social"], rating: 4.6, totalJobs: 53, availability: "available" },
  { id: "s6", title: "Consultoria de Produto", owner: "Carlos Lima", ownerBuilding: "NovaStar Inc", category: "consulting", description: "Product-market fit, roadmap, métricas e estratégia de produto.", priceRange: "R$ 300-600/h", tags: ["Product", "Strategy", "PMF"], rating: 4.8, totalJobs: 19, availability: "available" },
  { id: "s7", title: "Desenvolvimento Mobile Flutter", owner: "Lucas Oliveira", ownerBuilding: "Startup Garage", category: "dev", description: "Apps iOS e Android com Flutter, integração de APIs e publicação.", priceRange: "R$ 130-280/h", tags: ["Flutter", "iOS", "Android"], rating: 4.7, totalJobs: 31, availability: "available" },
  { id: "s8", title: "Branding e Identidade Visual", owner: "Beatriz Rocha", ownerBuilding: "DataVault", category: "design", description: "Logotipos, brand guidelines, paletas e materiais de marca.", priceRange: "R$ 100-220/h", tags: ["Brand", "Logo", "Identity"], rating: 4.5, totalJobs: 44, availability: "busy" },
];

const MOCK_FREELANCERS: FreelancerProfile[] = [
  { id: "f1", name: "André Silva", building: "TechFlow HQ", district: "Tech", skills: ["React", "TypeScript", "Node.js", "PostgreSQL"], bio: "Full-stack dev com 8 anos de experiência", hourlyRate: "R$ 200/h", rating: 4.9, totalJobs: 47, availability: "available", emoji: "👨‍💻" },
  { id: "f2", name: "Maria Santos", building: "Creative Labs", district: "Creator", skills: ["Figma", "UI/UX", "Framer", "Illustrator"], bio: "Designer focada em experiências digitais", hourlyRate: "R$ 180/h", rating: 4.8, totalJobs: 62, availability: "available", emoji: "🎨" },
  { id: "f3", name: "Carlos Lima", building: "NovaStar Inc", district: "Startup", skills: ["Product", "Strategy", "Analytics", "Leadership"], bio: "Product Manager e consultor de startups", hourlyRate: "R$ 350/h", rating: 4.8, totalJobs: 19, availability: "available", emoji: "🚀" },
  { id: "f4", name: "Pedro Mendes", building: "CloudBase", district: "Tech", skills: ["Python", "ML", "LLM", "AWS"], bio: "Engenheiro de ML e arquiteto de IA", hourlyRate: "R$ 400/h", rating: 4.9, totalJobs: 28, availability: "available", emoji: "🤖" },
  { id: "f5", name: "Julia Costa", building: "Digital Agency", district: "Agency", skills: ["SEO", "Google Ads", "Growth", "Analytics"], bio: "Growth marketer com cases de scale-up", hourlyRate: "R$ 250/h", rating: 4.7, totalJobs: 35, availability: "busy", emoji: "📈" },
  { id: "f6", name: "Ana Ferreira", building: "PixelForge", district: "Creator", skills: ["Copywriting", "Blog", "Social Media", "Video"], bio: "Criadora de conteúdo e copywriter", hourlyRate: "R$ 120/h", rating: 4.6, totalJobs: 53, availability: "available", emoji: "✍️" },
];

type TabType = "services" | "freelancers" | "proposals";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CityMarketplace({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<TabType>("services");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const filteredServices = useMemo(() => {
    let items = MOCK_SERVICES;
    if (category !== "all") items = items.filter(s => s.category === category);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(s => s.title.toLowerCase().includes(q) || s.tags.some(t => t.toLowerCase().includes(q)));
    }
    return items;
  }, [category, search]);

  const filteredFreelancers = useMemo(() => {
    if (!search) return MOCK_FREELANCERS;
    const q = search.toLowerCase();
    return MOCK_FREELANCERS.filter(f => f.name.toLowerCase().includes(q) || f.skills.some(s => s.toLowerCase().includes(q)));
  }, [search]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-4xl max-h-[88vh] overflow-hidden rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 border-b border-gray-800">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white font-mono tracking-wider">MARKETPLACE</h1>
                  <p className="text-[10px] text-gray-500 font-mono tracking-wider">Serviços, freelancers e colaborações</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                {([
                  { id: "services" as const, label: "Serviços", icon: Briefcase, count: MOCK_SERVICES.length },
                  { id: "freelancers" as const, label: "Freelancers", icon: Users, count: MOCK_FREELANCERS.length },
                  { id: "proposals" as const, label: "Propostas", icon: MessageSquare, count: 0 },
                ]).map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold tracking-wider rounded-lg border transition-all font-mono ${
                      tab === t.id
                        ? "bg-amber-400/10 text-amber-400 border-amber-400/50"
                        : "text-gray-500 border-gray-800 hover:border-gray-600"
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                    {t.count > 0 && <span className="text-[9px] bg-gray-800 px-1.5 py-0.5 rounded-full">{t.count}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Search + Filters */}
            <div className="px-6 py-3 border-b border-gray-800/50 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder={tab === "services" ? "Buscar serviços, tecnologias..." : "Buscar freelancers, skills..."}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 font-mono"
                />
              </div>
              {tab === "services" && (
                <div className="flex gap-1 overflow-x-auto">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg border whitespace-nowrap transition-all font-mono ${
                        category === c.id
                          ? "bg-amber-400/10 text-amber-400 border-amber-400/50"
                          : "text-gray-500 border-gray-800 hover:border-gray-600"
                      }`}
                    >
                      <c.icon className="w-3 h-3" />
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[55vh] p-6">
              {tab === "services" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredServices.map(service => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 hover:border-gray-700 transition-all cursor-pointer group"
                      onClick={() => setSelectedService(service)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-bold text-white font-mono leading-tight pr-2">{service.title}</h3>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold font-mono whitespace-nowrap ${
                          service.availability === "available" ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
                        }`}>
                          {service.availability === "available" ? "DISPONÍVEL" : "OCUPADO"}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mb-3 line-clamp-2">{service.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {service.tags.map(tag => (
                          <span key={tag} className="text-[9px] px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 font-mono">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{service.ownerBuilding}</span>
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{service.rating}</span>
                          <span>{service.totalJobs} jobs</span>
                        </div>
                        <span className="text-[10px] text-amber-400 font-bold font-mono">{service.priceRange}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {tab === "freelancers" && (
                <div className="space-y-3">
                  {filteredFreelancers.map(f => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900/50 p-4 hover:border-gray-700 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0">
                        {f.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-white font-mono">{f.name}</h3>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                            f.availability === "available" ? "bg-emerald-400/10 text-emerald-400" : "bg-amber-400/10 text-amber-400"
                          }`}>
                            {f.availability === "available" ? "●" : "◐"}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono mb-1.5">
                          {f.building} · {f.district} District
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {f.skills.map(s => (
                            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-amber-400 mb-1">
                          <Star className="w-3 h-3" />
                          <span className="text-sm font-bold font-mono">{f.rating}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono">{f.totalJobs} jobs</p>
                        <p className="text-[10px] text-amber-400 font-bold font-mono mt-1">{f.hourlyRate}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {tab === "proposals" && (
                <div className="text-center py-16">
                  <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-sm font-bold text-gray-400 font-mono mb-2">NENHUMA PROPOSTA AINDA</h3>
                  <p className="text-[11px] text-gray-600 font-mono max-w-sm mx-auto">
                    Explore serviços e freelancers para enviar sua primeira proposta de colaboração.
                  </p>
                  <button
                    onClick={() => setTab("services")}
                    className="mt-4 px-4 py-2 text-xs font-bold text-amber-400 border border-amber-400/30 rounded-lg hover:bg-amber-400/10 transition-all font-mono"
                  >
                    Explorar Serviços →
                  </button>
                </div>
              )}
            </div>

            {/* Footer stats */}
            <div className="px-6 py-3 border-t border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[10px] text-gray-500 font-mono">
                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{MOCK_SERVICES.length} serviços</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{MOCK_FREELANCERS.length} freelancers</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400" />Marketplace ativo</span>
              </div>
              <button className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all font-mono tracking-wider">
                + PUBLICAR SERVIÇO
              </button>
            </div>

            {/* Service detail modal */}
            <AnimatePresence>
              {selectedService && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/80 flex items-center justify-center p-6"
                  onClick={() => setSelectedService(null)}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-950 p-6"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-lg font-black text-white font-mono">{selectedService.title}</h2>
                      <button onClick={() => setSelectedService(null)} className="p-1 text-gray-500 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">{selectedService.description}</p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-900 rounded-xl p-3">
                        <div className="text-[10px] text-gray-500 font-mono mb-1">PREÇO</div>
                        <div className="text-sm font-bold text-amber-400 font-mono">{selectedService.priceRange}</div>
                      </div>
                      <div className="bg-gray-900 rounded-xl p-3">
                        <div className="text-[10px] text-gray-500 font-mono mb-1">AVALIAÇÃO</div>
                        <div className="text-sm font-bold text-white font-mono flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400" />{selectedService.rating} ({selectedService.totalJobs} jobs)
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-[10px] text-gray-500 font-mono mb-2">PROFISSIONAL</div>
                      <div className="flex items-center gap-3 bg-gray-900 rounded-xl p-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-lg">🏢</div>
                        <div>
                          <div className="text-sm font-bold text-white font-mono">{selectedService.owner}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{selectedService.ownerBuilding}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-6">
                      {selectedService.tags.map(t => (
                        <span key={t} className="text-[10px] px-2 py-1 rounded-lg bg-gray-800 text-gray-300 font-mono">{t}</span>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 py-3 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all font-mono tracking-wider flex items-center justify-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Enviar Proposta
                      </button>
                      <button className="px-4 py-3 text-xs font-bold text-gray-400 border border-gray-700 rounded-xl hover:border-gray-500 transition-all font-mono">
                        Visitar Prédio
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
