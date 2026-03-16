import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, MapPin, List, Building2, DollarSign, TrendingUp, Send, ShoppingCart, ExternalLink, BarChart3, Tag, X, Users, Globe, Calendar, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────
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
  country?: string;
  profit?: number;
  growth_rate?: number;
  founded_at?: string;
  team_size?: number;
  business_model?: string;
  category_data?: Record<string, any>;
  mapX?: number;
  mapY?: number;
  buildingName?: string;
}

// ─── Categories ─────────────────────────────────────
const CATEGORIES = [
  { value: "all", label: "All", icon: "🏙️" },
  { value: "saas", label: "SaaS", icon: "💻" },
  { value: "marketplace", label: "Marketplace", icon: "🏪" },
  { value: "mobile_app", label: "Mobile App", icon: "📱" },
  { value: "shopify_app", label: "Shopify App", icon: "🛍️" },
  { value: "content", label: "Content", icon: "📝" },
  { value: "ecommerce", label: "Ecommerce", icon: "🛒" },
  { value: "agency", label: "Agency", icon: "🏢" },
  { value: "crypto", label: "Crypto", icon: "🪙" },
  { value: "ai", label: "AI", icon: "🤖" },
  { value: "digital", label: "Digital", icon: "🌐" },
  { value: "newsletter", label: "Newsletter", icon: "📧" },
  { value: "other", label: "Other", icon: "📦" },
];

const CAT_COLORS: Record<string, string> = {
  saas: "#3b82f6", marketplace: "#06b6d4", mobile_app: "#8b5cf6",
  shopify_app: "#22c55e", content: "#f59e0b", ecommerce: "#10b981",
  agency: "#a855f7", crypto: "#f97316", ai: "#ec4899",
  digital: "#6366f1", newsletter: "#14b8a6", other: "#6b7280",
};

// Category-specific field schemas
const CATEGORY_FIELDS: Record<string, { key: string; label: string; format?: string }[]> = {
  saas: [
    { key: "mrr", label: "MRR", format: "currency" },
    { key: "arr", label: "ARR", format: "currency" },
    { key: "subscribers", label: "Subscribers", format: "number" },
    { key: "churn", label: "Churn Rate", format: "percent" },
    { key: "ltv", label: "LTV", format: "currency" },
    { key: "cac", label: "CAC", format: "currency" },
    { key: "arpu", label: "ARPU", format: "currency" },
  ],
  ecommerce: [
    { key: "aov", label: "Avg Order Value", format: "currency" },
    { key: "orders_per_month", label: "Orders/Month", format: "number" },
    { key: "conversion_rate", label: "Conversion Rate", format: "percent" },
    { key: "return_customers", label: "Return Customers", format: "percent" },
    { key: "traffic_sources", label: "Traffic Sources" },
  ],
  newsletter: [
    { key: "subscribers", label: "Subscribers", format: "number" },
    { key: "open_rate", label: "Open Rate", format: "percent" },
    { key: "ctr", label: "CTR", format: "percent" },
    { key: "revenue_per_send", label: "Rev/Send", format: "currency" },
    { key: "platform", label: "Platform" },
  ],
  ai: [
    { key: "active_users", label: "Active Users", format: "number" },
    { key: "api_usage", label: "API Usage", format: "number" },
    { key: "infra_cost", label: "Infra Cost", format: "currency" },
    { key: "model_used", label: "Model Used" },
    { key: "tokens_consumed", label: "Tokens/Month", format: "number" },
  ],
  crypto: [
    { key: "tvl", label: "TVL", format: "currency" },
    { key: "daily_volume", label: "Daily Volume", format: "currency" },
    { key: "chains", label: "Chains" },
  ],
  agency: [
    { key: "clients", label: "Recurring Clients", format: "number" },
    { key: "avg_contract", label: "Avg Contract", format: "currency" },
    { key: "retention", label: "Retention", format: "percent" },
  ],
};

const BUILDING_NAMES = [
  "AI Tower", "SaaS Hub", "Creator Studio", "Commerce Building",
  "Innovation Center", "Digital Plaza", "Tech Spire", "Venture Tower",
  "Growth Labs", "Pixel Building", "Cloud Campus", "Data Fortress",
];

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function formatFieldValue(value: any, format?: string) {
  if (value == null || value === "") return "—";
  if (format === "currency") return formatCurrency(Number(value));
  if (format === "percent") return `${value}%`;
  if (format === "number") return Number(value).toLocaleString();
  return String(value);
}

function hashPos(str: string, seed: number, max: number): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h) % max;
}

// ─── Demo data ──────────────────────────────────────
const DEMO_BUSINESSES: Business[] = [
  { id: "d1", name: "CloudMetrics", category: "saas", description: "Real-time analytics platform for SaaS companies with AI-powered insights.", mrr: 45000, growth_percent: 12, sale_price: 1800000, revenue_multiple: 3.3, founder_name: "Ana Costa", status: "listed", building_id: "b1", owner_id: "", product_url: null, buildingName: "AI Tower", country: "BR", team_size: 12, business_model: "subscription", founded_at: "2022", category_data: { arr: 540000, subscribers: 2400, churn: 3.2, ltv: 8500, cac: 320, arpu: 18.75 } },
  { id: "d2", name: "ShopFlex", category: "ecommerce", description: "Sustainable fashion store with 50k followers and own brand.", mrr: 85000, growth_percent: 8, sale_price: 2500000, revenue_multiple: 2.5, founder_name: "Lucas Mendes", status: "listed", building_id: "b2", owner_id: "", product_url: null, buildingName: "Commerce Building", country: "BR", team_size: 8, business_model: "ecommerce", category_data: { aov: 145, orders_per_month: 4200, conversion_rate: 3.8, return_customers: 42 } },
  { id: "d3", name: "PixelForge", category: "agency", description: "Design & branding agency with 40 recurring clients.", mrr: 120000, growth_percent: 5, sale_price: 3600000, revenue_multiple: 2.5, founder_name: "Marina Silva", status: "listed", building_id: "b3", owner_id: "", product_url: null, buildingName: "Creator Studio", country: "PT", team_size: 22, business_model: "service", category_data: { clients: 40, avg_contract: 3000, retention: 92 } },
  { id: "d4", name: "DevToolKit", category: "saas", description: "Developer tools suite with 10k active users.", mrr: 28000, growth_percent: 22, sale_price: 1200000, revenue_multiple: 3.6, founder_name: "Pedro Alves", status: "listed", building_id: "b4", owner_id: "", product_url: null, buildingName: "Tech Spire", country: "US", team_size: 5, business_model: "freemium", category_data: { arr: 336000, subscribers: 10200, churn: 5.1, ltv: 4200, cac: 180, arpu: 2.75 } },
  { id: "d5", name: "AI Lead Engine", category: "ai", description: "AI tool that generates leads automatically using machine learning.", mrr: 14200, growth_percent: 18, sale_price: 180000, revenue_multiple: 4.4, founder_name: "Julia Rocha", status: "listed", building_id: "b5", owner_id: "", product_url: null, buildingName: "AI Tower", country: "US", team_size: 3, business_model: "usage_based", category_data: { active_users: 1850, api_usage: 520000, infra_cost: 2400, model_used: "GPT-4o", tokens_consumed: 12000000 } },
  { id: "d6", name: "FreelanceHub", category: "marketplace", description: "Tech freelancer marketplace with AI matching.", mrr: 62000, growth_percent: 15, sale_price: 2200000, revenue_multiple: 3.0, founder_name: "Carlos Neto", status: "listed", building_id: "b6", owner_id: "", product_url: null, buildingName: "Digital Plaza", country: "BR", team_size: 15, business_model: "commission" },
  { id: "d7", name: "CryptoVault", category: "crypto", description: "DeFi portfolio tracker with multi-chain support.", mrr: 38000, growth_percent: 28, sale_price: 1500000, revenue_multiple: 3.3, founder_name: "Diego Ramos", status: "listed", building_id: "b7", owner_id: "", product_url: null, buildingName: "Data Fortress", country: "SG", team_size: 6, business_model: "freemium", category_data: { tvl: 45000000, daily_volume: 1200000, chains: "ETH, SOL, ARB" } },
  { id: "d8", name: "NewsletterPro", category: "newsletter", description: "Premium newsletter platform for indie creators.", mrr: 12000, growth_percent: 40, sale_price: 600000, revenue_multiple: 4.2, founder_name: "Camila Duarte", status: "listed", building_id: "b8", owner_id: "", product_url: null, buildingName: "Growth Labs", country: "BR", team_size: 2, business_model: "subscription", category_data: { subscribers: 48000, open_rate: 52, ctr: 8.4, revenue_per_send: 340, platform: "Beehiiv" } },
  { id: "d9", name: "AppLaunch", category: "mobile_app", description: "Mobile fitness app with 200k downloads and subscription model.", mrr: 55000, growth_percent: 18, sale_price: 2000000, revenue_multiple: 3.0, founder_name: "Thiago Lima", status: "listed", building_id: "b9", owner_id: "", product_url: null, buildingName: "Innovation Center", country: "US", team_size: 9, business_model: "subscription" },
  { id: "d10", name: "ShopifyBoost", category: "shopify_app", description: "Conversion optimization app for Shopify stores.", mrr: 32000, growth_percent: 25, sale_price: 1100000, revenue_multiple: 2.9, founder_name: "Fernanda Reis", status: "listed", building_id: "b10", owner_id: "", product_url: null, buildingName: "Venture Tower", country: "CA", team_size: 4, business_model: "subscription" },
  { id: "d11", name: "ContentMill", category: "content", description: "AI content generation platform for marketers.", mrr: 20000, growth_percent: 30, sale_price: 900000, revenue_multiple: 3.8, founder_name: "Rafael Souza", status: "listed", building_id: "b11", owner_id: "", product_url: null, buildingName: "Pixel Building", country: "BR", team_size: 6, business_model: "credits" },
  { id: "d12", name: "DigitalPay", category: "digital", description: "Digital payment gateway for Latin America.", mrr: 95000, growth_percent: 10, sale_price: 4000000, revenue_multiple: 3.5, founder_name: "Isabela Cruz", status: "listed", building_id: "b12", owner_id: "", product_url: null, buildingName: "Cloud Campus", country: "BR", team_size: 30, business_model: "transaction_fee" },
];

// ─── Scores ─────────────────────────────────────────
function calcScores(b: Business) {
  const growth = Math.min(100, Math.max(0, (b.growth_percent || 0) * 2.5));
  const risk = Math.max(0, 100 - (b.team_size || 1) * 5 - (b.mrr > 50000 ? 30 : 0) - (b.growth_percent > 10 ? 20 : 0));
  const liquidity = b.sale_price && b.mrr ? Math.min(100, (b.mrr * 12 / b.sale_price) * 100) : 50;
  const automation = b.category === "saas" || b.category === "ai" ? 80 : b.category === "agency" ? 30 : 55;
  return { growth: Math.round(growth), risk: Math.round(Math.max(10, Math.min(90, risk))), liquidity: Math.round(liquidity), automation };
}

function calcROI(b: Business) {
  const annual = b.mrr * 12;
  const profit = b.profit || annual * 0.3;
  const price = b.sale_price || annual * 3;
  const roi = ((profit / price) * 100);
  const payback = price / profit;
  return { roi: roi.toFixed(1), payback: payback.toFixed(1), valuation: formatCurrency(price) };
}

// ─── Main Component ─────────────────────────────────
export default function DigitalMarketplace() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>(DEMO_BUSINESSES);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<Business | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showOffer, setShowOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("digital_businesses")
        .select("*")
        .eq("status", "listed")
        .order("mrr", { ascending: false });
      if (data && data.length > 0) {
        const mapped = (data as unknown as Business[]).map((b, i) => ({
          ...b,
          buildingName: BUILDING_NAMES[i % BUILDING_NAMES.length],
          category_data: typeof b.category_data === "object" ? b.category_data : {},
        }));
        setBusinesses(mapped);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = businesses;
    if (category !== "all") list = list.filter(b => b.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b => b.name.toLowerCase().includes(q) || b.founder_name.toLowerCase().includes(q));
    }
    return list;
  }, [businesses, category, search]);

  const businessesWithPos = useMemo(() => {
    return filtered.map((b, i) => ({
      ...b,
      mapX: 8 + hashPos(b.id + "x", 31 + i, 82),
      mapY: 8 + hashPos(b.id + "y", 67 + i, 78),
    }));
  }, [filtered]);

  const handleSendOffer = useCallback(async () => {
    if (!selected || !offerAmount || Number(offerAmount) <= 0) {
      toast.error("Enter a valid offer amount.");
      return;
    }
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Log in to send offers."); setSending(false); return; }
      const { error } = await supabase.from("business_offers").insert({
        business_id: selected.id,
        from_user_id: user.id,
        offer_amount: Number(offerAmount),
        message: offerMessage || null,
      });
      if (error) throw error;
      toast.success("✅ Offer sent!", { description: `${formatCurrency(Number(offerAmount))} for ${selected.name}` });
      setShowOffer(false);
      setOfferAmount("");
      setOfferMessage("");
    } catch (e: any) {
      toast.error("Error sending offer", { description: e.message });
    } finally {
      setSending(false);
    }
  }, [selected, offerAmount, offerMessage]);

  const totalForSale = filtered.length;
  const totalValue = filtered.reduce((s, b) => s + (b.sale_price || 0), 0);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* ─── Top Bar ─── */}
      <div className="h-12 border-b border-border/30 bg-card/90 backdrop-blur-xl flex items-center px-4 gap-3 shrink-0 z-20">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-lg">🏙️</span>
        <h1 className="font-bold text-sm tracking-tight">Dynasty 8 — Digital Business Marketplace</h1>
        <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400 gap-1 ml-1">
          <Tag className="w-2.5 h-2.5" /> FOR SALE
        </Badge>
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground font-mono hidden sm:block">
          {totalForSale} listings · {formatCurrency(totalValue)} total
        </span>
        <div className="flex items-center gap-0.5 bg-muted/20 rounded-lg p-0.5">
          <button onClick={() => setViewMode("map")} className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${viewMode === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <MapPin className="w-3 h-3 inline mr-1" />Map
          </button>
          <button onClick={() => setViewMode("list")} className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <List className="w-3 h-3 inline mr-1" />List
          </button>
        </div>
      </div>

      {/* ─── Category Filter Strip ─── */}
      <div className="h-9 border-b border-border/20 bg-card/60 flex items-center px-4 gap-1 overflow-x-auto shrink-0">
        {CATEGORIES.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium whitespace-nowrap transition-all ${category === c.value ? "bg-primary text-primary-foreground" : "bg-muted/10 text-muted-foreground hover:bg-muted/20 hover:text-foreground"}`}
          >
            <span>{c.icon}</span>{c.label}
          </button>
        ))}
      </div>

      {/* ─── Main Split View (Sidebar + Canvas) ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT: Sidebar — Scrollable Asset Cards ── */}
        <div className="w-80 border-r border-border/30 bg-card/80 flex flex-col shrink-0">
          <div className="p-2.5 border-b border-border/20">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input placeholder="Search startups..." className="pl-8 h-7 text-[11px] bg-muted/10 border-border/30" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {businessesWithPos.map(biz => (
              <SidebarCard
                key={biz.id}
                biz={biz}
                isSelected={selected?.id === biz.id}
                onSelect={() => setSelected(biz)}
                onHover={setHoveredId}
              />
            ))}
            {businessesWithPos.length === 0 && (
              <div className="p-8 text-center">
                <Building2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No businesses for sale</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Canvas (Map or Grid) ── */}
        <div className="flex-1 flex flex-col relative">
          <div className="flex-1 relative">
            {viewMode === "map" ? (
              <CityMapView
                businesses={businessesWithPos}
                selected={selected}
                hoveredId={hoveredId}
                onSelect={setSelected}
                onHover={setHoveredId}
              />
            ) : (
              <GridView businesses={businessesWithPos} onSelect={setSelected} />
            )}
          </div>

          {/* ── BOTTOM: Detail Footer Panel ── */}
          {selected && (
            <DetailFooter
              business={selected}
              onClose={() => setSelected(null)}
              onVisit={() => navigate(`/building/${selected.building_id || selected.id}`)}
              onMetrics={() => toast.info("📊 Full metrics dashboard coming soon!")}
              onOffer={() => setShowOffer(true)}
              onBuy={() => toast.info("🏢 Direct purchase coming soon!", { description: "Use 'Make Offer' to negotiate." })}
            />
          )}
        </div>
      </div>

      {/* ─── Offer Dialog ─── */}
      <Dialog open={showOffer} onOpenChange={setShowOffer}>
        <DialogContent className="bg-card border-border/30">
          <DialogHeader>
            <DialogTitle>Make Offer — {selected?.name}</DialogTitle>
            <DialogDescription>Send a proposal to {selected?.founder_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium mb-1 block">Offer Amount ($)</label>
              <Input type="number" placeholder="e.g. 500000" value={offerAmount} onChange={e => setOfferAmount(e.target.value)} className="bg-muted/10" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Message (optional)</label>
              <Textarea placeholder="Describe your proposal..." value={offerMessage} onChange={e => setOfferMessage(e.target.value)} rows={3} className="bg-muted/10" />
            </div>
            <Button onClick={handleSendOffer} disabled={sending} className="w-full">
              {sending ? "Sending..." : "Send Offer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sidebar Card ───────────────────────────────────
function SidebarCard({ biz, isSelected, onSelect, onHover }: {
  biz: Business;
  isSelected: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
}) {
  const color = CAT_COLORS[biz.category] || "#6b7280";
  const catLabel = CATEGORIES.find(c => c.value === biz.category)?.label || biz.category;

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => onHover(biz.id)}
      onMouseLeave={() => onHover(null)}
      className={`w-full text-left p-3 border-b border-border/10 transition-all duration-150 hover:bg-primary/5 ${isSelected ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        {/* Building preview */}
        <div className="w-12 h-14 rounded-lg flex flex-col items-center justify-center text-lg shrink-0 relative" style={{ background: `${color}15` }}>
          🏢
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
            <Tag className="w-2.5 h-2.5 text-black" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[12px] font-semibold text-foreground truncate">{biz.name}</h3>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium inline-block mt-0.5" style={{ background: `${color}20`, color }}>
            {catLabel}
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[9px] text-muted-foreground">MRR <span className="text-emerald-400 font-bold">{formatCurrency(biz.mrr)}</span></span>
            {biz.sale_price && <span className="text-[9px] text-muted-foreground">Price <span className="text-foreground font-bold">{formatCurrency(biz.sale_price)}</span></span>}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-2 h-2 text-muted-foreground/50" />
            <span className="text-[8px] text-muted-foreground/50">{biz.buildingName || "City Building"}</span>
          </div>
        </div>
        <span className="text-[8px] font-bold px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 uppercase tracking-wider shrink-0 mt-1">BUY</span>
      </div>
    </button>
  );
}

// ─── City Map View ──────────────────────────────────
function CityMapView({ businesses, selected, hoveredId, onSelect, onHover }: {
  businesses: (Business & { mapX: number; mapY: number })[];
  selected: Business | null;
  hoveredId: string | null;
  onSelect: (b: Business) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <div className="w-full h-full relative overflow-hidden bg-background">
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Roads */}
      <div className="absolute left-[20%] top-0 bottom-0 w-[2px] bg-border/10" />
      <div className="absolute left-[50%] top-0 bottom-0 w-[2px] bg-border/10" />
      <div className="absolute left-[80%] top-0 bottom-0 w-[2px] bg-border/10" />
      <div className="absolute top-[25%] left-0 right-0 h-[2px] bg-border/10" />
      <div className="absolute top-[55%] left-0 right-0 h-[2px] bg-border/10" />
      <div className="absolute top-[80%] left-0 right-0 h-[2px] bg-border/10" />

      {/* District labels */}
      <span className="absolute top-4 left-4 text-[10px] font-medium text-muted-foreground/30 uppercase tracking-widest">Tech District</span>
      <span className="absolute top-4 right-4 text-[10px] font-medium text-muted-foreground/30 uppercase tracking-widest">Creative Quarter</span>
      <span className="absolute bottom-4 left-4 text-[10px] font-medium text-muted-foreground/30 uppercase tracking-widest">Startup Valley</span>
      <span className="absolute bottom-4 right-4 text-[10px] font-medium text-muted-foreground/30 uppercase tracking-widest">Commerce Hub</span>

      {/* FOR SALE markers */}
      {businesses.map(biz => {
        const isSelected2 = selected?.id === biz.id;
        const isHovered = hoveredId === biz.id;
        const color = CAT_COLORS[biz.category] || "#6b7280";
        const active = isSelected2 || isHovered;

        return (
          <button
            key={biz.id}
            onClick={() => onSelect(biz)}
            onMouseEnter={() => onHover(biz.id)}
            onMouseLeave={() => onHover(null)}
            className="absolute transition-all duration-200 group"
            style={{ left: `${biz.mapX}%`, top: `${biz.mapY}%`, transform: "translate(-50%, -50%)" }}
          >
            {active && <div className="absolute inset-0 -m-4 rounded-full animate-ping opacity-20" style={{ background: color }} />}
            <div className="relative">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm shadow-lg transition-transform duration-200 ${active ? "scale-125 z-10" : ""}`}
                style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)`, boxShadow: active ? `0 0 24px ${color}60` : `0 2px 8px ${color}30` }}
              >
                🏢
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-amber-500 text-black">FOR SALE</span>
                </div>
              </div>
            </div>
            <div className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap transition-opacity duration-150 ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
              <div className="bg-card/95 backdrop-blur-sm border border-border/30 rounded-xl px-3 py-2 shadow-xl min-w-[140px]">
                <p className="text-[11px] font-bold text-foreground">{biz.name}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{biz.buildingName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-emerald-400 font-semibold">MRR {formatCurrency(biz.mrr)}</span>
                  <span className="text-[9px] text-foreground font-bold">{biz.sale_price ? formatCurrency(biz.sale_price) : "—"}</span>
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {businesses.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Building2 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground/50 text-sm ml-3">No businesses for sale</p>
        </div>
      )}
    </div>
  );
}

// ─── Grid View ──────────────────────────────────────
function GridView({ businesses, onSelect }: { businesses: Business[]; onSelect: (b: Business) => void }) {
  return (
    <div className="w-full h-full overflow-y-auto p-4 bg-background">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {businesses.map(biz => {
          const color = CAT_COLORS[biz.category] || "#6b7280";
          return (
            <button key={biz.id} onClick={() => onSelect(biz)} className="text-left bg-card border border-border/20 rounded-xl p-4 hover:border-primary/30 transition-all hover:shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg relative" style={{ background: `${color}20` }}>
                  🏢
                  <div className="absolute -top-1.5 -right-1.5">
                    <span className="text-[6px] font-black uppercase px-1 py-0.5 rounded-sm bg-amber-500 text-black">SALE</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate">{biz.name}</h3>
                  <span className="text-[10px]" style={{ color }}>{CATEGORIES.find(c => c.value === biz.category)?.label}</span>
                </div>
                {biz.sale_price && <span className="text-sm font-bold">{formatCurrency(biz.sale_price)}</span>}
              </div>
              {biz.description && <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">{biz.description}</p>}
              <div className="flex gap-2">
                <MiniStat label="MRR" value={formatCurrency(biz.mrr)} color="#10b981" />
                <MiniStat label="Growth" value={`${biz.growth_percent > 0 ? "+" : ""}${biz.growth_percent}%`} color={biz.growth_percent > 0 ? "#10b981" : "#ef4444"} />
                <MiniStat label="Multiple" value={`${biz.revenue_multiple}x`} color="#f59e0b" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex-1 bg-muted/10 rounded-lg px-2 py-1.5 text-center">
      <span className="text-[8px] text-muted-foreground block">{label}</span>
      <span className="text-[11px] font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Detail Footer Panel (Dynasty 8 style) ──────────
function DetailFooter({ business, onClose, onVisit, onMetrics, onOffer, onBuy }: {
  business: Business;
  onClose: () => void;
  onVisit: () => void;
  onMetrics: () => void;
  onOffer: () => void;
  onBuy: () => void;
}) {
  const color = CAT_COLORS[business.category] || "#6b7280";
  const catLabel = CATEGORIES.find(c => c.value === business.category)?.label || business.category;
  const scores = calcScores(business);
  const roi = calcROI(business);
  const catFields = CATEGORY_FIELDS[business.category] || [];

  return (
    <div className="border-t border-border/30 bg-card/95 backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300">
      {/* Close button */}
      <button onClick={onClose} className="absolute top-2 right-3 z-10 p-1 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors">
        <X className="w-4 h-4" />
      </button>

      <div className="p-4 flex gap-5 overflow-x-auto">
        {/* ── Col 1: Identity ── */}
        <div className="min-w-[200px] shrink-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-amber-500 text-black">FOR SALE</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${color}20`, color }}>{catLabel}</span>
          </div>
          <h2 className="font-bold text-base leading-tight">{business.name}</h2>
          <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
            <MapPin className="w-3 h-3" /> {business.buildingName || "City Building"}
            <span className="text-muted-foreground/30">·</span>
            by {business.founder_name}
          </div>
          {business.description && (
            <p className="text-[10px] text-muted-foreground/70 mt-1.5 line-clamp-2 leading-relaxed">{business.description}</p>
          )}
          {/* Universal info */}
          <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground/60">
            {business.country && <span className="flex items-center gap-0.5"><Globe className="w-2.5 h-2.5" />{business.country}</span>}
            {business.team_size && <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{business.team_size} people</span>}
            {business.founded_at && <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{business.founded_at}</span>}
            {business.business_model && <span className="flex items-center gap-0.5"><Briefcase className="w-2.5 h-2.5" />{business.business_model}</span>}
          </div>
        </div>

        {/* ── Col 2: Core Metrics ── */}
        <div className="min-w-[160px] shrink-0">
          <span className="text-[8px] text-muted-foreground uppercase tracking-wider block mb-1.5">Core Metrics</span>
          <div className="grid grid-cols-2 gap-1.5">
            <MetricBox label="Revenue (30d)" value={formatCurrency(business.mrr)} accent="#10b981" />
            <MetricBox label="Growth" value={`${business.growth_percent > 0 ? "+" : ""}${business.growth_percent}%`} accent={business.growth_percent > 0 ? "#10b981" : "#ef4444"} />
            <MetricBox label="Annual Rev" value={formatCurrency(business.mrr * 12)} accent="#3b82f6" />
            <MetricBox label="Multiple" value={`${business.revenue_multiple}x`} accent="#f59e0b" />
          </div>
        </div>

        {/* ── Col 3: Category-Specific ── */}
        {catFields.length > 0 && business.category_data && (
          <div className="min-w-[160px] shrink-0">
            <span className="text-[8px] text-muted-foreground uppercase tracking-wider block mb-1.5">{catLabel} Metrics</span>
            <div className="grid grid-cols-2 gap-1.5">
              {catFields.slice(0, 4).map(f => (
                <MetricBox key={f.key} label={f.label} value={formatFieldValue(business.category_data?.[f.key], f.format)} accent={color} />
              ))}
            </div>
          </div>
        )}

        {/* ── Col 4: Scores ── */}
        <div className="min-w-[130px] shrink-0">
          <span className="text-[8px] text-muted-foreground uppercase tracking-wider block mb-1.5">Asset Scores</span>
          <div className="space-y-1">
            <ScoreBar label="Growth" value={scores.growth} color="#10b981" />
            <ScoreBar label="Risk" value={scores.risk} color="#ef4444" />
            <ScoreBar label="Liquidity" value={scores.liquidity} color="#3b82f6" />
            <ScoreBar label="Automation" value={scores.automation} color="#8b5cf6" />
          </div>
        </div>

        {/* ── Col 5: ROI Simulation ── */}
        <div className="min-w-[120px] shrink-0">
          <span className="text-[8px] text-muted-foreground uppercase tracking-wider block mb-1.5">Purchase Simulation</span>
          <div className="space-y-1.5">
            <div className="bg-muted/10 rounded-lg px-2.5 py-1.5">
              <span className="text-[8px] text-muted-foreground block">Est. ROI</span>
              <span className="text-sm font-bold text-emerald-400">{roi.roi}%</span>
            </div>
            <div className="bg-muted/10 rounded-lg px-2.5 py-1.5">
              <span className="text-[8px] text-muted-foreground block">Payback</span>
              <span className="text-sm font-bold">{roi.payback} yrs</span>
            </div>
            <div className="bg-muted/10 rounded-lg px-2.5 py-1.5">
              <span className="text-[8px] text-muted-foreground block">Valuation</span>
              <span className="text-sm font-bold">{roi.valuation}</span>
            </div>
          </div>
        </div>

        {/* ── Col 6: Price + Actions ── */}
        <div className="min-w-[160px] shrink-0 flex flex-col justify-between">
          {business.sale_price && (
            <div className="rounded-xl p-2.5 text-center mb-2" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
              <span className="text-[9px] text-muted-foreground block">Asking Price</span>
              <span className="text-xl font-bold">{formatCurrency(business.sale_price)}</span>
            </div>
          )}
          <div className="space-y-1">
            <Button onClick={onVisit} variant="outline" size="sm" className="w-full h-7 text-[10px] justify-start gap-1.5 border-border/30">
              <ExternalLink className="w-3 h-3" /> VISIT BUILDING
            </Button>
            <Button onClick={onMetrics} variant="outline" size="sm" className="w-full h-7 text-[10px] justify-start gap-1.5 border-border/30">
              <BarChart3 className="w-3 h-3" /> VIEW METRICS
            </Button>
            <Button onClick={onOffer} variant="outline" size="sm" className="w-full h-7 text-[10px] justify-start gap-1.5 border-border/30">
              <Send className="w-3 h-3" /> MAKE OFFER
            </Button>
            <Button onClick={onBuy} size="sm" className="w-full h-7 text-[10px] justify-start gap-1.5 font-bold uppercase tracking-wider" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
              <ShoppingCart className="w-3 h-3" /> BUY — {business.sale_price ? formatCurrency(business.sale_price) : "Contact"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-muted/10 rounded-lg px-2 py-1.5">
      <span className="text-[7px] text-muted-foreground block">{label}</span>
      <span className="text-[11px] font-bold" style={{ color: accent }}>{value}</span>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[8px] text-muted-foreground">{label}</span>
        <span className="text-[8px] font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}
