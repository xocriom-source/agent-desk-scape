import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, MapPin, List, Building2, DollarSign, TrendingUp,
  Send, ShoppingCart, ExternalLink, BarChart3, Tag, X, Users, Globe,
  Calendar, Briefcase, Heart, Eye, ChevronDown, SlidersHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

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
  buildingName?: string;
  lat: number;
  lng: number;
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

const CATEGORY_FIELDS: Record<string, { key: string; label: string; format?: string }[]> = {
  saas: [
    { key: "arr", label: "ARR", format: "currency" },
    { key: "subscribers", label: "Subscribers", format: "number" },
    { key: "churn", label: "Churn", format: "percent" },
    { key: "ltv", label: "LTV", format: "currency" },
  ],
  ecommerce: [
    { key: "aov", label: "AOV", format: "currency" },
    { key: "orders_per_month", label: "Orders/mo", format: "number" },
    { key: "conversion_rate", label: "Conv. Rate", format: "percent" },
  ],
  newsletter: [
    { key: "subscribers", label: "Subscribers", format: "number" },
    { key: "open_rate", label: "Open Rate", format: "percent" },
    { key: "ctr", label: "CTR", format: "percent" },
  ],
  ai: [
    { key: "active_users", label: "Active Users", format: "number" },
    { key: "api_usage", label: "API Calls", format: "number" },
    { key: "model_used", label: "Model" },
  ],
  crypto: [
    { key: "tvl", label: "TVL", format: "currency" },
    { key: "daily_volume", label: "Volume", format: "currency" },
  ],
  agency: [
    { key: "clients", label: "Clients", format: "number" },
    { key: "retention", label: "Retention", format: "percent" },
  ],
};

const BUILDING_NAMES = [
  "AI Tower", "SaaS Hub", "Creator Studio", "Commerce Building",
  "Innovation Center", "Digital Plaza", "Tech Spire", "Venture Tower",
  "Growth Labs", "Pixel Building", "Cloud Campus", "Data Fortress",
];

// City center coordinates (virtual city mapped onto a real-world location for map tiles)
const CITY_CENTER = { lat: -23.5505, lng: -46.6333 }; // São Paulo
const SPREAD = 0.025;

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

function hashFloat(str: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return (Math.abs(h) % 10000) / 10000;
}

function calcScores(b: Business) {
  const growth = Math.min(100, Math.max(0, (b.growth_percent || 0) * 2.5));
  const risk = Math.max(10, Math.min(90, 100 - (b.team_size || 1) * 5 - (b.mrr > 50000 ? 30 : 0) - (b.growth_percent > 10 ? 20 : 0)));
  const liquidity = b.sale_price && b.mrr ? Math.min(100, (b.mrr * 12 / b.sale_price) * 100) : 50;
  const automation = b.category === "saas" || b.category === "ai" ? 80 : b.category === "agency" ? 30 : 55;
  return { growth: Math.round(growth), risk: Math.round(risk), liquidity: Math.round(liquidity), automation };
}

function calcROI(b: Business) {
  const annual = b.mrr * 12;
  const profit = b.profit || annual * 0.3;
  const price = b.sale_price || annual * 3;
  return { roi: ((profit / price) * 100).toFixed(1), payback: (price / profit).toFixed(1), valuation: formatCurrency(price) };
}

// ─── Demo data ──────────────────────────────────────
const DEMO_BUSINESSES: Business[] = [
  { id: "d1", name: "CloudMetrics", category: "saas", description: "Real-time analytics platform for SaaS companies with AI-powered insights.", mrr: 45000, growth_percent: 12, sale_price: 1800000, revenue_multiple: 3.3, founder_name: "Ana Costa", status: "listed", building_id: "b1", owner_id: "", product_url: null, buildingName: "AI Tower", country: "BR", team_size: 12, business_model: "subscription", founded_at: "2022", category_data: { arr: 540000, subscribers: 2400, churn: 3.2, ltv: 8500, cac: 320 }, lat: 0, lng: 0 },
  { id: "d2", name: "ShopFlex", category: "ecommerce", description: "Sustainable fashion store with 50k followers and own brand.", mrr: 85000, growth_percent: 8, sale_price: 2500000, revenue_multiple: 2.5, founder_name: "Lucas Mendes", status: "listed", building_id: "b2", owner_id: "", product_url: null, buildingName: "Commerce Building", country: "BR", team_size: 8, business_model: "ecommerce", category_data: { aov: 145, orders_per_month: 4200, conversion_rate: 3.8 }, lat: 0, lng: 0 },
  { id: "d3", name: "PixelForge", category: "agency", description: "Design & branding agency with 40 recurring clients.", mrr: 120000, growth_percent: 5, sale_price: 3600000, revenue_multiple: 2.5, founder_name: "Marina Silva", status: "listed", building_id: "b3", owner_id: "", product_url: null, buildingName: "Creator Studio", country: "PT", team_size: 22, business_model: "service", category_data: { clients: 40, retention: 92 }, lat: 0, lng: 0 },
  { id: "d4", name: "DevToolKit", category: "saas", description: "Developer tools suite with 10k active users.", mrr: 28000, growth_percent: 22, sale_price: 1200000, revenue_multiple: 3.6, founder_name: "Pedro Alves", status: "listed", building_id: "b4", owner_id: "", product_url: null, buildingName: "Tech Spire", country: "US", team_size: 5, business_model: "freemium", category_data: { arr: 336000, subscribers: 10200, churn: 5.1, ltv: 4200 }, lat: 0, lng: 0 },
  { id: "d5", name: "AI Lead Engine", category: "ai", description: "AI tool that generates leads automatically using machine learning.", mrr: 14200, growth_percent: 18, sale_price: 180000, revenue_multiple: 4.4, founder_name: "Julia Rocha", status: "listed", building_id: "b5", owner_id: "", product_url: null, buildingName: "AI Tower", country: "US", team_size: 3, business_model: "usage_based", category_data: { active_users: 1850, api_usage: 520000, model_used: "GPT-4o" }, lat: 0, lng: 0 },
  { id: "d6", name: "FreelanceHub", category: "marketplace", description: "Tech freelancer marketplace with AI matching.", mrr: 62000, growth_percent: 15, sale_price: 2200000, revenue_multiple: 3.0, founder_name: "Carlos Neto", status: "listed", building_id: "b6", owner_id: "", product_url: null, buildingName: "Digital Plaza", country: "BR", team_size: 15, business_model: "commission", lat: 0, lng: 0 },
  { id: "d7", name: "CryptoVault", category: "crypto", description: "DeFi portfolio tracker with multi-chain support.", mrr: 38000, growth_percent: 28, sale_price: 1500000, revenue_multiple: 3.3, founder_name: "Diego Ramos", status: "listed", building_id: "b7", owner_id: "", product_url: null, buildingName: "Data Fortress", country: "SG", team_size: 6, business_model: "freemium", category_data: { tvl: 45000000, daily_volume: 1200000 }, lat: 0, lng: 0 },
  { id: "d8", name: "NewsletterPro", category: "newsletter", description: "Premium newsletter platform for indie creators.", mrr: 12000, growth_percent: 40, sale_price: 600000, revenue_multiple: 4.2, founder_name: "Camila Duarte", status: "listed", building_id: "b8", owner_id: "", product_url: null, buildingName: "Growth Labs", country: "BR", team_size: 2, business_model: "subscription", category_data: { subscribers: 48000, open_rate: 52, ctr: 8.4, platform: "Beehiiv" }, lat: 0, lng: 0 },
  { id: "d9", name: "AppLaunch", category: "mobile_app", description: "Mobile fitness app with 200k downloads.", mrr: 55000, growth_percent: 18, sale_price: 2000000, revenue_multiple: 3.0, founder_name: "Thiago Lima", status: "listed", building_id: "b9", owner_id: "", product_url: null, buildingName: "Innovation Center", country: "US", team_size: 9, business_model: "subscription", lat: 0, lng: 0 },
  { id: "d10", name: "ShopifyBoost", category: "shopify_app", description: "Conversion optimization app for Shopify stores.", mrr: 32000, growth_percent: 25, sale_price: 1100000, revenue_multiple: 2.9, founder_name: "Fernanda Reis", status: "listed", building_id: "b10", owner_id: "", product_url: null, buildingName: "Venture Tower", country: "CA", team_size: 4, business_model: "subscription", lat: 0, lng: 0 },
  { id: "d11", name: "ContentMill", category: "content", description: "AI content generation platform for marketers.", mrr: 20000, growth_percent: 30, sale_price: 900000, revenue_multiple: 3.8, founder_name: "Rafael Souza", status: "listed", building_id: "b11", owner_id: "", product_url: null, buildingName: "Pixel Building", country: "BR", team_size: 6, business_model: "credits", lat: 0, lng: 0 },
  { id: "d12", name: "DigitalPay", category: "digital", description: "Digital payment gateway for Latin America.", mrr: 95000, growth_percent: 10, sale_price: 4000000, revenue_multiple: 3.5, founder_name: "Isabela Cruz", status: "listed", building_id: "b12", owner_id: "", product_url: null, buildingName: "Cloud Campus", country: "BR", team_size: 30, business_model: "transaction_fee", lat: 0, lng: 0 },
].map((b, i) => ({
  ...b,
  lat: CITY_CENTER.lat + (hashFloat(b.id + "lat", 31 + i) - 0.5) * SPREAD * 2,
  lng: CITY_CENTER.lng + (hashFloat(b.id + "lng", 67 + i) - 0.5) * SPREAD * 2,
}));

// ─── Map Style (free dark tiles) ────────────────────
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// ─── Main Component ─────────────────────────────────
export default function DigitalMarketplace() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>(DEMO_BUSINESSES);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<Business | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [popupBiz, setPopupBiz] = useState<Business | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [showOffer, setShowOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sortBy, setSortBy] = useState("mrr");
  const [showFilters, setShowFilters] = useState(false);

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
          lat: CITY_CENTER.lat + (hashFloat(b.id + "lat", 31 + i) - 0.5) * SPREAD * 2,
          lng: CITY_CENTER.lng + (hashFloat(b.id + "lng", 67 + i) - 0.5) * SPREAD * 2,
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
    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === "price") return (b.sale_price || 0) - (a.sale_price || 0);
      if (sortBy === "growth") return (b.growth_percent || 0) - (a.growth_percent || 0);
      return b.mrr - a.mrr;
    });
    return list;
  }, [businesses, category, search, sortBy]);

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

  const handleSelect = useCallback((biz: Business) => {
    setSelected(biz);
    setPopupBiz(null);
  }, []);

  const totalForSale = filtered.length;
  const totalValue = filtered.reduce((s, b) => s + (b.sale_price || 0), 0);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* ─── Top Bar ─── */}
      <header className="h-11 border-b border-border/30 bg-card/90 backdrop-blur-xl flex items-center px-3 gap-2 shrink-0 z-30">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground h-7 w-7">
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>
        <span className="text-base">🏙️</span>
        <h1 className="font-bold text-xs tracking-tight hidden sm:block">Digital Business Marketplace</h1>
        <Badge variant="outline" className="text-[8px] border-amber-500/30 text-amber-400 gap-0.5 px-1.5 py-0">
          <Tag className="w-2 h-2" /> {totalForSale} FOR SALE
        </Badge>
        <div className="flex-1" />
        <span className="text-[9px] text-muted-foreground font-mono hidden md:block">
          {formatCurrency(totalValue)} total value
        </span>
        <div className="flex items-center gap-0.5 bg-muted/20 rounded-lg p-0.5">
          <button onClick={() => setViewMode("map")} className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${viewMode === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <MapPin className="w-3 h-3 inline mr-0.5" />Map
          </button>
          <button onClick={() => setViewMode("list")} className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <List className="w-3 h-3 inline mr-0.5" />List
          </button>
        </div>
      </header>

      {/* ─── Main Split: Sidebar + Map ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT SIDEBAR ── */}
        <div className="w-[340px] border-r border-border/30 bg-card/80 flex flex-col shrink-0 z-10">
          {/* Search + Filters */}
          <div className="p-2.5 space-y-2 border-b border-border/20">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input placeholder="Search startups, founders..." className="pl-8 h-7 text-[11px] bg-muted/10 border-border/30" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-1.5">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-6 text-[9px] bg-muted/10 border-border/30 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mrr">Sort: MRR</SelectItem>
                  <SelectItem value="price">Sort: Price</SelectItem>
                  <SelectItem value="growth">Sort: Growth</SelectItem>
                </SelectContent>
              </Select>
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${showFilters ? "bg-primary text-primary-foreground" : "bg-muted/10 text-muted-foreground hover:text-foreground"}`}>
                <SlidersHorizontal className="w-2.5 h-2.5" /> Filters
              </button>
            </div>
            {/* Category pills */}
            {showFilters && (
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setCategory(c.value)}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-medium transition-all ${category === c.value ? "bg-primary text-primary-foreground" : "bg-muted/10 text-muted-foreground hover:bg-muted/20"}`}
                  >
                    <span>{c.icon}</span>{c.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="px-3 py-1.5 border-b border-border/10 flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground font-medium">{filtered.length} results</span>
            {category !== "all" && (
              <button onClick={() => setCategory("all")} className="text-[9px] text-primary hover:underline">Clear filter</button>
            )}
          </div>

          {/* Scrollable listings */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map(biz => (
              <PropertyCard
                key={biz.id}
                biz={biz}
                isSelected={selected?.id === biz.id}
                onSelect={() => handleSelect(biz)}
                onHover={setHoveredId}
              />
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center">
                <Building2 className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No businesses found</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: MAP / GRID ── */}
        <div className="flex-1 relative">
          {viewMode === "map" ? (
            <ZillowMap
              businesses={filtered}
              selected={selected}
              hoveredId={hoveredId}
              popupBiz={popupBiz}
              onSelect={handleSelect}
              onHover={setHoveredId}
              onPopup={setPopupBiz}
            />
          ) : (
            <GridView businesses={filtered} onSelect={handleSelect} />
          )}

          {/* ── Detail Panel (slides from right like Zillow) ── */}
          {selected && (
            <DetailPanel
              business={selected}
              onClose={() => setSelected(null)}
              onVisit={() => navigate(`/building/${selected.building_id || selected.id}`)}
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

// ─── Zillow-style Property Card (Sidebar) ───────────
function PropertyCard({ biz, isSelected, onSelect, onHover }: {
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
      className={`w-full text-left p-3 border-b border-border/10 transition-all duration-150 hover:bg-accent/5 ${isSelected ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
    >
      {/* "Photo" placeholder — building preview */}
      <div className="w-full h-24 rounded-lg mb-2 relative overflow-hidden flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)` }}>
        <span className="text-3xl">🏢</span>
        {/* Price badge (like Zillow) */}
        <div className="absolute bottom-2 left-2">
          <span className="text-sm font-bold bg-background/90 backdrop-blur-sm px-2 py-0.5 rounded-md shadow-sm">
            {biz.sale_price ? formatCurrency(biz.sale_price) : "Contact"}
          </span>
        </div>
        {/* FOR SALE badge */}
        <div className="absolute top-2 left-2">
          <span className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-amber-500 text-black">FOR SALE</span>
        </div>
        {/* Favorite */}
        <button className="absolute top-2 right-2 p-1 rounded-full bg-background/60 hover:bg-background/90 transition-colors" onClick={e => { e.stopPropagation(); toast.info("❤️ Added to favorites!"); }}>
          <Heart className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      <h3 className="text-[12px] font-bold text-foreground truncate">{biz.name}</h3>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${color}20`, color }}>{catLabel}</span>
        <span className="text-[9px] text-muted-foreground/60">·</span>
        <span className="text-[9px] text-muted-foreground/60">{biz.buildingName}</span>
      </div>

      {/* Metrics row (like Zillow's beds/baths/sqft) */}
      <div className="flex items-center gap-3 mt-1.5 text-[10px]">
        <span className="text-muted-foreground">MRR <span className="text-emerald-400 font-bold">{formatCurrency(biz.mrr)}</span></span>
        <span className="text-muted-foreground/30">·</span>
        <span className="text-muted-foreground">Growth <span className={`font-bold ${biz.growth_percent > 0 ? "text-emerald-400" : "text-red-400"}`}>{biz.growth_percent > 0 ? "+" : ""}{biz.growth_percent}%</span></span>
        <span className="text-muted-foreground/30">·</span>
        <span className="text-muted-foreground">{biz.revenue_multiple}x</span>
      </div>
    </button>
  );
}

// ─── Zillow-style Map (react-map-gl + maplibre) ─────
function ZillowMap({ businesses, selected, hoveredId, popupBiz, onSelect, onHover, onPopup }: {
  businesses: Business[];
  selected: Business | null;
  hoveredId: string | null;
  popupBiz: Business | null;
  onSelect: (b: Business) => void;
  onHover: (id: string | null) => void;
  onPopup: (b: Business | null) => void;
}) {
  return (
    <Map
      initialViewState={{
        latitude: CITY_CENTER.lat,
        longitude: CITY_CENTER.lng,
        zoom: 14,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      attributionControl={false}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {businesses.map(biz => {
        const color = CAT_COLORS[biz.category] || "#6b7280";
        const isActive = selected?.id === biz.id || hoveredId === biz.id;

        return (
          <Marker
            key={biz.id}
            latitude={biz.lat}
            longitude={biz.lng}
            anchor="bottom"
            onClick={e => { e.originalEvent.stopPropagation(); onSelect(biz); }}
          >
            <div
              onMouseEnter={() => { onHover(biz.id); onPopup(biz); }}
              onMouseLeave={() => { onHover(null); onPopup(null); }}
              className={`cursor-pointer transition-transform duration-200 ${isActive ? "scale-125 z-20" : "z-10 hover:scale-110"}`}
            >
              {/* Price pill marker (Zillow-style) */}
              <div
                className="px-2 py-1 rounded-full text-[10px] font-bold shadow-lg whitespace-nowrap border"
                style={{
                  background: isActive ? color : "hsl(var(--card))",
                  color: isActive ? "#fff" : "hsl(var(--foreground))",
                  borderColor: isActive ? color : "hsl(var(--border) / 0.3)",
                  boxShadow: isActive ? `0 4px 14px ${color}50` : "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                {biz.sale_price ? formatCurrency(biz.sale_price) : "🏢"}
              </div>
              {/* Triangle pointer */}
              <div className="w-0 h-0 mx-auto" style={{
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: `5px solid ${isActive ? color : "hsl(var(--card))"}`,
              }} />
            </div>
          </Marker>
        );
      })}

      {/* Popup on hover */}
      {popupBiz && !selected && (
        <Popup
          latitude={popupBiz.lat}
          longitude={popupBiz.lng}
          closeButton={false}
          closeOnClick={false}
          anchor="bottom"
          offset={30}
          className="zillow-popup"
        >
          <div className="p-2 min-w-[180px]" style={{ background: "hsl(var(--card))", borderRadius: 8 }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🏢</span>
              <div>
                <p className="text-[11px] font-bold text-foreground">{popupBiz.name}</p>
                <p className="text-[9px] text-muted-foreground">{popupBiz.buildingName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[9px]">
              <span className="text-emerald-400 font-semibold">MRR {formatCurrency(popupBiz.mrr)}</span>
              <span className="text-muted-foreground/30">·</span>
              <span className="font-bold text-foreground">{popupBiz.sale_price ? formatCurrency(popupBiz.sale_price) : "—"}</span>
            </div>
          </div>
        </Popup>
      )}
    </Map>
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

// ─── Detail Panel (Zillow-style slide from right) ───
function DetailPanel({ business, onClose, onVisit, onOffer, onBuy }: {
  business: Business;
  onClose: () => void;
  onVisit: () => void;
  onOffer: () => void;
  onBuy: () => void;
}) {
  const color = CAT_COLORS[business.category] || "#6b7280";
  const catLabel = CATEGORIES.find(c => c.value === business.category)?.label || business.category;
  const scores = calcScores(business);
  const roi = calcROI(business);
  const catFields = CATEGORY_FIELDS[business.category] || [];

  return (
    <div className="absolute top-0 right-0 bottom-0 w-[380px] z-20 animate-in slide-in-from-right duration-300">
      <div className="h-full bg-card/98 backdrop-blur-xl border-l border-border/30 flex flex-col overflow-hidden shadow-2xl shadow-black/30">
        {/* Header image area */}
        <div className="h-32 relative flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${color}20, ${color}08)` }}>
          <span className="text-5xl">🏢</span>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-background/60 hover:bg-background/90 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-amber-500 text-black">FOR SALE</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${color}30`, color }}>{catLabel}</span>
          </div>
          {/* Price overlay */}
          <div className="absolute bottom-3 left-3">
            <span className="text-xl font-bold bg-background/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm">
              {business.sale_price ? formatCurrency(business.sale_price) : "Contact"}
            </span>
          </div>
          <button className="absolute bottom-3 right-3 p-1.5 rounded-full bg-background/60 hover:bg-background/90" onClick={() => toast.info("❤️ Added to favorites!")}>
            <Heart className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name + info */}
          <div>
            <h2 className="font-bold text-lg leading-tight">{business.name}</h2>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
              <MapPin className="w-3 h-3" /> {business.buildingName || "City Building"}
              <span className="text-muted-foreground/30">·</span>
              by {business.founder_name}
            </div>
          </div>

          {business.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">{business.description}</p>
          )}

          {/* Universal info */}
          <div className="flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground/70">
            {business.country && <span className="flex items-center gap-0.5 bg-muted/10 px-2 py-0.5 rounded-full"><Globe className="w-2.5 h-2.5" />{business.country}</span>}
            {business.team_size && <span className="flex items-center gap-0.5 bg-muted/10 px-2 py-0.5 rounded-full"><Users className="w-2.5 h-2.5" />{business.team_size} people</span>}
            {business.founded_at && <span className="flex items-center gap-0.5 bg-muted/10 px-2 py-0.5 rounded-full"><Calendar className="w-2.5 h-2.5" />{business.founded_at}</span>}
            {business.business_model && <span className="flex items-center gap-0.5 bg-muted/10 px-2 py-0.5 rounded-full"><Briefcase className="w-2.5 h-2.5" />{business.business_model}</span>}
          </div>

          {/* Core metrics */}
          <div>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Metrics</h3>
            <div className="grid grid-cols-2 gap-2">
              <MetricBox label="Revenue (30d)" value={formatCurrency(business.mrr)} accent="#10b981" />
              <MetricBox label="Growth" value={`${business.growth_percent > 0 ? "+" : ""}${business.growth_percent}%`} accent={business.growth_percent > 0 ? "#10b981" : "#ef4444"} />
              <MetricBox label="Annual Revenue" value={formatCurrency(business.mrr * 12)} accent="#3b82f6" />
              <MetricBox label="Revenue Multiple" value={`${business.revenue_multiple}x`} accent="#f59e0b" />
            </div>
          </div>

          {/* Category-specific metrics */}
          {catFields.length > 0 && business.category_data && Object.keys(business.category_data).length > 0 && (
            <div>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{catLabel} Details</h3>
              <div className="grid grid-cols-2 gap-2">
                {catFields.map(f => (
                  <MetricBox key={f.key} label={f.label} value={formatFieldValue(business.category_data?.[f.key], f.format)} accent={color} />
                ))}
              </div>
            </div>
          )}

          {/* Asset Scores */}
          <div>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Asset Scores</h3>
            <div className="space-y-1.5">
              <ScoreBar label="Growth Score" value={scores.growth} color="#10b981" />
              <ScoreBar label="Risk Score" value={scores.risk} color="#ef4444" />
              <ScoreBar label="Liquidity Score" value={scores.liquidity} color="#3b82f6" />
              <ScoreBar label="Automation Score" value={scores.automation} color="#8b5cf6" />
            </div>
          </div>

          {/* ROI Simulation */}
          <div>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">💰 Purchase Simulation</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/10 rounded-lg p-2 text-center">
                <span className="text-[8px] text-muted-foreground block">Est. ROI</span>
                <span className="text-sm font-bold text-emerald-400">{roi.roi}%</span>
              </div>
              <div className="bg-muted/10 rounded-lg p-2 text-center">
                <span className="text-[8px] text-muted-foreground block">Payback</span>
                <span className="text-sm font-bold">{roi.payback} yrs</span>
              </div>
              <div className="bg-muted/10 rounded-lg p-2 text-center">
                <span className="text-[8px] text-muted-foreground block">Valuation</span>
                <span className="text-sm font-bold">{roi.valuation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3 space-y-1.5 border-t border-border/20 shrink-0">
          <Button onClick={onVisit} variant="outline" size="sm" className="w-full h-8 text-[10px] justify-start gap-2 border-border/30">
            <ExternalLink className="w-3.5 h-3.5" /> VISIT BUILDING
          </Button>
          <Button onClick={onOffer} variant="outline" size="sm" className="w-full h-8 text-[10px] justify-start gap-2 border-border/30">
            <Send className="w-3.5 h-3.5" /> MAKE OFFER
          </Button>
          <Button onClick={onBuy} size="sm" className="w-full h-8 text-[10px] justify-start gap-2 font-bold uppercase tracking-wider" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
            <ShoppingCart className="w-3.5 h-3.5" /> BUY BUSINESS — {business.sale_price ? formatCurrency(business.sale_price) : "Contact"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-muted/10 rounded-lg px-2.5 py-2">
      <span className="text-[8px] text-muted-foreground block mb-0.5">{label}</span>
      <span className="text-[12px] font-bold" style={{ color: accent }}>{value}</span>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] text-muted-foreground">{label}</span>
        <span className="text-[9px] font-bold" style={{ color }}>{value}/100</span>
      </div>
      <div className="h-1.5 bg-muted/20 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}
