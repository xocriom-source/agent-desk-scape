import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, TrendingUp, DollarSign, Building2, Filter, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessDetailPanel } from "@/components/marketplace/BusinessDetailPanel";
import { supabase } from "@/integrations/supabase/client";

interface Business {
  id: string;
  name: string;
  category: string;
  description: string | null;
  mrr: number;
  growth_percent: number;
  sale_price: number | null;
  revenue_multiple: number;
  founder_name: string;
  status: string;
  building_id: string | null;
  owner_id: string;
  product_url: string | null;
}

const CATEGORIES = [
  { value: "all", label: "Todas" },
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "agency", label: "Agência" },
  { value: "tool", label: "Ferramenta" },
  { value: "startup", label: "Startup" },
  { value: "marketplace", label: "Marketplace" },
];

const CATEGORY_ICONS: Record<string, string> = {
  saas: "💻", ecommerce: "🛒", agency: "🏢", tool: "🔧", startup: "🚀", marketplace: "🏪",
};

const CATEGORY_COLORS: Record<string, string> = {
  saas: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ecommerce: "bg-green-500/20 text-green-400 border-green-500/30",
  agency: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  tool: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  startup: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  marketplace: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}k`;
  return `R$ ${n.toFixed(0)}`;
}

const DEMO_BUSINESSES: Business[] = [
  { id: "demo-1", name: "CloudMetrics", category: "saas", description: "Plataforma de analytics para SaaS com dashboard em tempo real.", mrr: 45000, growth_percent: 12, sale_price: 1800000, revenue_multiple: 3.3, founder_name: "Ana Costa", status: "listed", building_id: "b-1", owner_id: "", product_url: null },
  { id: "demo-2", name: "ShopFlex", category: "ecommerce", description: "Loja de moda sustentável com marca própria e 50k seguidores.", mrr: 85000, growth_percent: 8, sale_price: 2500000, revenue_multiple: 2.5, founder_name: "Lucas Mendes", status: "listed", building_id: "b-2", owner_id: "", product_url: null },
  { id: "demo-3", name: "PixelForge Studio", category: "agency", description: "Agência de design e branding com 40 clientes recorrentes.", mrr: 120000, growth_percent: 5, sale_price: 3600000, revenue_multiple: 2.5, founder_name: "Marina Silva", status: "listed", building_id: "b-3", owner_id: "", product_url: null },
  { id: "demo-4", name: "DevToolKit", category: "tool", description: "Suite de ferramentas para desenvolvedores com 10k usuários ativos.", mrr: 28000, growth_percent: 22, sale_price: 1200000, revenue_multiple: 3.6, founder_name: "Pedro Alves", status: "listed", building_id: "b-4", owner_id: "", product_url: null },
  { id: "demo-5", name: "EduFlow", category: "startup", description: "Plataforma de cursos com IA personalizada. Seed round fechado.", mrr: 15000, growth_percent: 35, sale_price: 800000, revenue_multiple: 4.4, founder_name: "Julia Rocha", status: "listed", building_id: "b-5", owner_id: "", product_url: null },
  { id: "demo-6", name: "FreelanceHub", category: "marketplace", description: "Marketplace de freelancers tech com matching por IA.", mrr: 62000, growth_percent: 15, sale_price: 2200000, revenue_multiple: 3.0, founder_name: "Carlos Neto", status: "listed", building_id: "b-6", owner_id: "", product_url: null },
];

export default function DigitalMarketplace() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>(DEMO_BUSINESSES);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("mrr");
  const [selected, setSelected] = useState<Business | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("digital_businesses")
        .select("*")
        .eq("status", "listed")
        .order("mrr", { ascending: false });
      if (data && data.length > 0) setBusinesses(data as unknown as Business[]);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = businesses;
    if (category !== "all") list = list.filter(b => b.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || b.founder_name.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q));
    }
    return list.sort((a, b) => {
      if (sortBy === "mrr") return b.mrr - a.mrr;
      if (sortBy === "growth") return b.growth_percent - a.growth_percent;
      if (sortBy === "price") return (b.sale_price || 0) - (a.sale_price || 0);
      if (sortBy === "multiple") return b.revenue_multiple - a.revenue_multiple;
      return 0;
    });
  }, [businesses, category, search, sortBy]);

  const totalMRR = businesses.reduce((s, b) => s + b.mrr, 0);
  const avgGrowth = businesses.length ? businesses.reduce((s, b) => s + b.growth_percent, 0) / businesses.length : 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-display font-bold text-lg">🏙️ Digital Business Marketplace</h1>
              <p className="text-xs text-muted-foreground">Descubra, avalie e adquira negócios digitais</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <StatPill icon={Building2} label="Listados" value={businesses.length.toString()} />
            <StatPill icon={DollarSign} label="MRR Total" value={formatCurrency(totalMRR)} />
            <StatPill icon={TrendingUp} label="Cresc. Médio" value={`${avgGrowth.toFixed(1)}%`} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar negócio ou fundador..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mrr">Maior MRR</SelectItem>
              <SelectItem value="growth">Maior Crescimento</SelectItem>
              <SelectItem value="price">Maior Preço</SelectItem>
              <SelectItem value="multiple">Maior Múltiplo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(biz => (
            <button
              key={biz.id}
              onClick={() => setSelected(biz)}
              className="group text-left bg-card/60 border border-border/40 rounded-2xl p-4 hover:border-primary/40 hover:bg-card/80 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">{CATEGORY_ICONS[biz.category] || "🏢"}</span>
                  <h3 className="font-display font-bold text-foreground truncate">{biz.name}</h3>
                </div>
                <Badge className={`text-[10px] border ${CATEGORY_COLORS[biz.category] || "bg-muted"}`}>
                  {CATEGORIES.find(c => c.value === biz.category)?.label || biz.category}
                </Badge>
              </div>

              {biz.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{biz.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-muted/20 rounded-lg px-2.5 py-1.5">
                  <span className="text-[9px] text-muted-foreground block">MRR</span>
                  <span className="text-sm font-bold text-emerald-400">{formatCurrency(biz.mrr)}</span>
                </div>
                <div className="bg-muted/20 rounded-lg px-2.5 py-1.5">
                  <span className="text-[9px] text-muted-foreground block">Crescimento</span>
                  <span className={`text-sm font-bold ${biz.growth_percent > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {biz.growth_percent > 0 ? "+" : ""}{biz.growth_percent}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">👤 {biz.founder_name}</span>
                {biz.sale_price && (
                  <span className="text-sm font-bold text-foreground">{formatCurrency(biz.sale_price)}</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum negócio encontrado com esses filtros.</p>
          </div>
        )}
      </div>

      <BusinessDetailPanel business={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function StatPill({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="hidden md:flex items-center gap-2 bg-muted/20 rounded-full px-3 py-1.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-xs font-bold text-foreground">{value}</span>
    </div>
  );
}
