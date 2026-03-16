import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, MapPin, List, Building2, DollarSign, TrendingUp,
  Send, ShoppingCart, ExternalLink, BarChart3, Tag, X, Users, Globe,
  Calendar, Briefcase, Heart, SlidersHorizontal, Plus
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
import Supercluster from "supercluster";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

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
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
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

// ─── City coords for List Your Business ─────────────
const CITY_COORDS: Record<string, { lat: number; lng: number; country: string; region: string }> = {
  "São Paulo": { lat: -23.5505, lng: -46.6333, country: "BR", region: "South America" },
  "Rio de Janeiro": { lat: -22.9068, lng: -43.1729, country: "BR", region: "South America" },
  "New York": { lat: 40.7128, lng: -74.006, country: "US", region: "North America" },
  "San Francisco": { lat: 37.7749, lng: -122.4194, country: "US", region: "North America" },
  "Austin": { lat: 30.2672, lng: -97.7431, country: "US", region: "North America" },
  "Toronto": { lat: 43.6532, lng: -79.3832, country: "CA", region: "North America" },
  "Mexico City": { lat: 19.4326, lng: -99.1332, country: "MX", region: "North America" },
  "London": { lat: 51.5074, lng: -0.1278, country: "UK", region: "Europe" },
  "Lisbon": { lat: 38.7223, lng: -9.1393, country: "PT", region: "Europe" },
  "Berlin": { lat: 52.52, lng: 13.405, country: "DE", region: "Europe" },
  "Paris": { lat: 48.8566, lng: 2.3522, country: "FR", region: "Europe" },
  "Tokyo": { lat: 35.6762, lng: 139.6503, country: "JP", region: "Asia" },
  "Singapore": { lat: 1.3521, lng: 103.8198, country: "SG", region: "Asia" },
  "Bangkok": { lat: 13.7563, lng: 100.5018, country: "TH", region: "Asia" },
  "Seoul": { lat: 37.5665, lng: 126.978, country: "KR", region: "Asia" },
  "Bangalore": { lat: 12.9716, lng: 77.5946, country: "IN", region: "Asia" },
  "Sydney": { lat: -33.8688, lng: 151.2093, country: "AU", region: "Oceania" },
  "Dubai": { lat: 25.2048, lng: 55.2708, country: "AE", region: "Middle East" },
};

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

// ─── Global demo businesses across real cities ──────
const DEMO_BUSINESSES: Business[] = [
  { id: "d1", name: "CloudMetrics", category: "saas", description: "Real-time analytics platform for SaaS companies with AI-powered insights.", mrr: 45000, growth_percent: 12, sale_price: 1800000, revenue_multiple: 3.3, founder_name: "Ana Costa", status: "listed", building_id: "b1", owner_id: "", product_url: null, buildingName: "AI Tower", country: "BR", city: "São Paulo", region: "South America", team_size: 12, business_model: "subscription", founded_at: "2022", category_data: { arr: 540000, subscribers: 2400, churn: 3.2, ltv: 8500 }, lat: -23.5505, lng: -46.6333 },
  { id: "d2", name: "ShopFlex", category: "ecommerce", description: "Sustainable fashion store with 50k followers and own brand.", mrr: 85000, growth_percent: 8, sale_price: 2500000, revenue_multiple: 2.5, founder_name: "Lucas Mendes", status: "listed", building_id: "b2", owner_id: "", product_url: null, buildingName: "Commerce Tower", country: "BR", city: "Rio de Janeiro", region: "South America", team_size: 8, business_model: "ecommerce", category_data: { aov: 145, orders_per_month: 4200, conversion_rate: 3.8 }, lat: -22.9068, lng: -43.1729 },
  { id: "d3", name: "PixelForge", category: "agency", description: "Design & branding agency with 40 recurring clients.", mrr: 120000, growth_percent: 5, sale_price: 3600000, revenue_multiple: 2.5, founder_name: "Marina Silva", status: "listed", building_id: "b3", owner_id: "", product_url: null, buildingName: "Creator Studio", country: "PT", city: "Lisbon", region: "Europe", team_size: 22, business_model: "service", category_data: { clients: 40, retention: 92 }, lat: 38.7223, lng: -9.1393 },
  { id: "d4", name: "DevToolKit", category: "saas", description: "Developer tools suite with 10k active users.", mrr: 28000, growth_percent: 22, sale_price: 1200000, revenue_multiple: 3.6, founder_name: "Pedro Alves", status: "listed", building_id: "b4", owner_id: "", product_url: null, buildingName: "Tech Spire", country: "US", city: "San Francisco", region: "North America", team_size: 5, business_model: "freemium", category_data: { arr: 336000, subscribers: 10200, churn: 5.1, ltv: 4200 }, lat: 37.7749, lng: -122.4194 },
  { id: "d5", name: "AI Lead Engine", category: "ai", description: "AI tool that generates leads automatically using machine learning.", mrr: 14200, growth_percent: 18, sale_price: 180000, revenue_multiple: 4.4, founder_name: "Julia Rocha", status: "listed", building_id: "b5", owner_id: "", product_url: null, buildingName: "AI Hub", country: "US", city: "New York", region: "North America", team_size: 3, business_model: "usage_based", category_data: { active_users: 1850, api_usage: 520000, model_used: "GPT-4o" }, lat: 40.7128, lng: -74.006 },
  { id: "d6", name: "FreelanceHub", category: "marketplace", description: "Tech freelancer marketplace with AI matching.", mrr: 62000, growth_percent: 15, sale_price: 2200000, revenue_multiple: 3.0, founder_name: "Carlos Neto", status: "listed", building_id: "b6", owner_id: "", product_url: null, buildingName: "Digital Plaza", country: "UK", city: "London", region: "Europe", team_size: 15, business_model: "commission", lat: 51.5074, lng: -0.1278 },
  { id: "d7", name: "CryptoVault", category: "crypto", description: "DeFi portfolio tracker with multi-chain support.", mrr: 38000, growth_percent: 28, sale_price: 1500000, revenue_multiple: 3.3, founder_name: "Diego Ramos", status: "listed", building_id: "b7", owner_id: "", product_url: null, buildingName: "Data Fortress", country: "SG", city: "Singapore", region: "Asia", team_size: 6, business_model: "freemium", category_data: { tvl: 45000000, daily_volume: 1200000 }, lat: 1.3521, lng: 103.8198 },
  { id: "d8", name: "NewsletterPro", category: "newsletter", description: "Premium newsletter platform for indie creators.", mrr: 12000, growth_percent: 40, sale_price: 600000, revenue_multiple: 4.2, founder_name: "Camila Duarte", status: "listed", building_id: "b8", owner_id: "", product_url: null, buildingName: "Growth Labs", country: "DE", city: "Berlin", region: "Europe", team_size: 2, business_model: "subscription", category_data: { subscribers: 48000, open_rate: 52, ctr: 8.4 }, lat: 52.52, lng: 13.405 },
  { id: "d9", name: "AppLaunch", category: "mobile_app", description: "Mobile fitness app with 200k downloads.", mrr: 55000, growth_percent: 18, sale_price: 2000000, revenue_multiple: 3.0, founder_name: "Thiago Lima", status: "listed", building_id: "b9", owner_id: "", product_url: null, buildingName: "Innovation Center", country: "US", city: "Austin", region: "North America", team_size: 9, business_model: "subscription", lat: 30.2672, lng: -97.7431 },
  { id: "d10", name: "ShopifyBoost", category: "shopify_app", description: "Conversion optimization app for Shopify stores.", mrr: 32000, growth_percent: 25, sale_price: 1100000, revenue_multiple: 2.9, founder_name: "Fernanda Reis", status: "listed", building_id: "b10", owner_id: "", product_url: null, buildingName: "Venture Tower", country: "CA", city: "Toronto", region: "North America", team_size: 4, business_model: "subscription", lat: 43.6532, lng: -79.3832 },
  { id: "d11", name: "ContentMill", category: "content", description: "AI content generation platform for marketers.", mrr: 20000, growth_percent: 30, sale_price: 900000, revenue_multiple: 3.8, founder_name: "Rafael Souza", status: "listed", building_id: "b11", owner_id: "", product_url: null, buildingName: "Pixel Building", country: "JP", city: "Tokyo", region: "Asia", team_size: 6, business_model: "credits", lat: 35.6762, lng: 139.6503 },
  { id: "d12", name: "DigitalPay", category: "digital", description: "Digital payment gateway for Latin America.", mrr: 95000, growth_percent: 10, sale_price: 4000000, revenue_multiple: 3.5, founder_name: "Isabela Cruz", status: "listed", building_id: "b12", owner_id: "", product_url: null, buildingName: "Cloud Campus", country: "MX", city: "Mexico City", region: "North America", team_size: 30, business_model: "transaction_fee", lat: 19.4326, lng: -99.1332 },
  { id: "d13", name: "DataStream", category: "saas", description: "Real-time data pipeline tool for enterprise.", mrr: 72000, growth_percent: 14, sale_price: 2800000, revenue_multiple: 3.2, founder_name: "Raj Patel", status: "listed", building_id: "b13", owner_id: "", product_url: null, buildingName: "Data Tower", country: "IN", city: "Bangalore", region: "Asia", team_size: 18, business_model: "subscription", category_data: { arr: 864000, subscribers: 580, churn: 2.1, ltv: 14000 }, lat: 12.9716, lng: 77.5946 },
  { id: "d14", name: "AdOptimize", category: "ai", description: "AI-powered ad optimization for e-commerce brands.", mrr: 41000, growth_percent: 35, sale_price: 1600000, revenue_multiple: 3.3, founder_name: "Sophie Chen", status: "listed", building_id: "b14", owner_id: "", product_url: null, buildingName: "AI Campus", country: "AU", city: "Sydney", region: "Oceania", team_size: 7, business_model: "performance", category_data: { active_users: 3200, api_usage: 1800000, model_used: "Claude 3.5" }, lat: -33.8688, lng: 151.2093 },
  { id: "d15", name: "NomadDesk", category: "marketplace", description: "Co-working space booking platform for digital nomads.", mrr: 29000, growth_percent: 20, sale_price: 950000, revenue_multiple: 2.7, founder_name: "Erik Johansson", status: "listed", building_id: "b15", owner_id: "", product_url: null, buildingName: "Nomad Hub", country: "TH", city: "Bangkok", region: "Asia", team_size: 5, business_model: "commission", lat: 13.7563, lng: 100.5018 },
  { id: "d16", name: "GreenCart", category: "ecommerce", description: "Organic grocery delivery platform.", mrr: 110000, growth_percent: 6, sale_price: 3200000, revenue_multiple: 2.4, founder_name: "Pierre Dubois", status: "listed", building_id: "b16", owner_id: "", product_url: null, buildingName: "Commerce Center", country: "FR", city: "Paris", region: "Europe", team_size: 25, business_model: "ecommerce", category_data: { aov: 68, orders_per_month: 15000, conversion_rate: 4.2 }, lat: 48.8566, lng: 2.3522 },
  { id: "d17", name: "CodeReview AI", category: "ai", description: "Automated code review with AI suggestions.", mrr: 19000, growth_percent: 45, sale_price: 750000, revenue_multiple: 3.3, founder_name: "Kim Soo-jin", status: "listed", building_id: "b17", owner_id: "", product_url: null, buildingName: "Dev Tower", country: "KR", city: "Seoul", region: "Asia", team_size: 4, business_model: "subscription", category_data: { active_users: 5200, api_usage: 890000, model_used: "Gemini Pro" }, lat: 37.5665, lng: 126.978 },
  { id: "d18", name: "TravelStack", category: "saas", description: "Travel agency management SaaS.", mrr: 36000, growth_percent: 11, sale_price: 1400000, revenue_multiple: 3.2, founder_name: "Ahmed Hassan", status: "listed", building_id: "b18", owner_id: "", product_url: null, buildingName: "Travel Hub", country: "AE", city: "Dubai", region: "Middle East", team_size: 10, business_model: "subscription", category_data: { arr: 432000, subscribers: 340, churn: 4.5, ltv: 9800 }, lat: 25.2048, lng: 55.2708 },
];

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

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
  const [showListBiz, setShowListBiz] = useState(false);
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
          buildingName: b.buildingName || `Building ${i + 1}`,
          category_data: typeof b.category_data === "object" ? b.category_data : {},
          lat: b.lat || b.latitude || DEMO_BUSINESSES[i % DEMO_BUSINESSES.length]?.lat || 0,
          lng: b.lng || b.longitude || DEMO_BUSINESSES[i % DEMO_BUSINESSES.length]?.lng || 0,
        } as Business));
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
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.founder_name.toLowerCase().includes(q) ||
        (b.city || "").toLowerCase().includes(q) ||
        (b.country || "").toLowerCase().includes(q)
      );
    }
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

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(b => {
      const r = b.region || "Other";
      counts[r] = (counts[r] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* ─── Top Bar ─── */}
      <header className="h-11 border-b border-green-800/40 bg-gradient-to-r from-green-900/95 to-green-800/90 backdrop-blur-xl flex items-center px-3 gap-2 shrink-0 z-30">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-green-300 hover:text-white h-7 w-7">
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>
        <Building2 className="w-4 h-4 text-green-400" />
        <h1 className="font-bold text-xs tracking-tight hidden sm:block text-white">The Good Realty — Global Business Marketplace</h1>
        <Badge variant="outline" className="text-[8px] border-green-500/30 text-green-300 gap-0.5 px-1.5 py-0">
          <Tag className="w-2 h-2" /> {totalForSale} PROPERTIES
        </Badge>
        <div className="hidden lg:flex items-center gap-1 ml-2">
          {Object.entries(regionCounts).slice(0, 4).map(([region, count]) => (
            <span key={region} className="text-[8px] bg-muted/20 text-muted-foreground px-1.5 py-0.5 rounded-full">
              {region} ({count})
            </span>
          ))}
        </div>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => setShowListBiz(true)} className="h-6 text-[9px] text-green-300 hover:text-white gap-1 px-2">
          <Plus className="w-3 h-3" /> List Business
        </Button>
        <span className="text-[9px] text-green-300/70 font-mono hidden md:block">
          Total: {formatCurrency(totalValue)}
        </span>
        <div className="flex items-center gap-0.5 bg-muted/20 rounded-lg p-0.5">
          <button onClick={() => setViewMode("map")} className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${viewMode === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            <Globe className="w-3 h-3 inline mr-0.5" />Map
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
          <div className="p-2.5 space-y-2 border-b border-border/20">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input placeholder="Search startups, cities, founders..." className="pl-8 h-7 text-[11px] bg-muted/10 border-border/30" value={search} onChange={e => setSearch(e.target.value)} />
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

          <div className="px-3 py-1.5 border-b border-border/10 flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground font-medium">{filtered.length} businesses worldwide</span>
            {category !== "all" && (
              <button onClick={() => setCategory("all")} className="text-[9px] text-primary hover:underline">Clear</button>
            )}
          </div>

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
            <WorldMap
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

          {/* Detail Panel */}
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

      {/* Offer Dialog */}
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

      {/* List Your Business Dialog */}
      <ListBusinessDialog open={showListBiz} onOpenChange={setShowListBiz} onSuccess={(biz) => {
        setBusinesses(prev => [biz, ...prev]);
        toast.success("🎉 Business listed!", { description: `${biz.name} is now live on the marketplace.` });
      }} />
    </div>
  );
}

// ─── List Your Business Form ────────────────────────
function ListBusinessDialog({ open, onOpenChange, onSuccess }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: (b: Business) => void;
}) {
  const [name, setName] = useState("");
  const [cat, setCat] = useState("saas");
  const [desc, setDesc] = useState("");
  const [mrr, setMrr] = useState("");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("São Paulo");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name || !mrr) { toast.error("Name and MRR are required"); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Log in to list a business."); setSaving(false); return; }
      const coords = CITY_COORDS[city] || CITY_COORDS["São Paulo"];
      const mrrNum = Number(mrr);
      const priceNum = Number(price) || mrrNum * 36;
      const { data, error } = await supabase.from("digital_businesses").insert({
        name,
        category: cat,
        description: desc || null,
        mrr: mrrNum,
        sale_price: priceNum,
        revenue_multiple: Number((priceNum / (mrrNum * 12)).toFixed(1)),
        founder_name: user.email?.split("@")[0] || "Founder",
        owner_id: user.id,
        city,
        country: coords.country,
        region: coords.region,
        latitude: coords.lat,
        longitude: coords.lng,
        status: "listed",
      }).select().single();
      if (error) throw error;
      const biz: Business = {
        ...(data as any),
        lat: coords.lat,
        lng: coords.lng,
        buildingName: `${name} HQ`,
        category_data: {},
      };
      onSuccess(biz);
      onOpenChange(false);
      setName(""); setDesc(""); setMrr(""); setPrice("");
    } catch (e: any) {
      toast.error("Error listing business", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="w-4 h-4 text-green-400" /> List Your Business</DialogTitle>
          <DialogDescription>Add your digital business to the global marketplace</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-medium mb-1 block">Business Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. My SaaS App" className="bg-muted/10" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium mb-1 block">Category</label>
              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="bg-muted/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter(c => c.value !== "all").map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">City</label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="bg-muted/10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(CITY_COORDS).map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium mb-1 block">Monthly Revenue (MRR) *</label>
              <Input type="number" value={mrr} onChange={e => setMrr(e.target.value)} placeholder="e.g. 5000" className="bg-muted/10" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Sale Price ($)</label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Auto: MRR × 36" className="bg-muted/10" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Description</label>
            <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe your business..." rows={3} className="bg-muted/10" />
          </div>
          <Button onClick={handleSubmit} disabled={saving} className="w-full bg-green-700 hover:bg-green-600 text-white">
            {saving ? "Publishing..." : "🚀 List on Marketplace"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Property Card (Sidebar) ────────────────────────
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
      <div className="w-full h-20 rounded-lg mb-2 relative overflow-hidden flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)` }}>
        <span className="text-3xl">🏢</span>
        <div className="absolute bottom-1.5 left-1.5">
          <span className="text-xs font-bold bg-background/90 backdrop-blur-sm px-1.5 py-0.5 rounded-md shadow-sm">
            {biz.sale_price ? formatCurrency(biz.sale_price) : "Contact"}
          </span>
        </div>
        <div className="absolute top-1.5 left-1.5">
          <span className="text-[6px] font-black uppercase tracking-wider px-1 py-0.5 rounded-sm bg-amber-500 text-black">FOR SALE</span>
        </div>
        <button className="absolute top-1.5 right-1.5 p-1 rounded-full bg-background/60 hover:bg-background/90 transition-colors" onClick={e => { e.stopPropagation(); toast.info("❤️ Added to favorites!"); }}>
          <Heart className="w-2.5 h-2.5 text-muted-foreground" />
        </button>
      </div>

      <h3 className="text-[11px] font-bold text-foreground truncate">{biz.name}</h3>
      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${color}20`, color }}>{catLabel}</span>
        {biz.city && biz.country && (
          <span className="text-[8px] text-muted-foreground/60 flex items-center gap-0.5">
            <MapPin className="w-2 h-2" />{biz.city}, {biz.country}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1 text-[9px]">
        <span className="text-muted-foreground">MRR <span className="text-emerald-400 font-bold">{formatCurrency(biz.mrr)}</span></span>
        <span className="text-muted-foreground/30">·</span>
        <span className="text-muted-foreground">
          <span className={`font-bold ${biz.growth_percent > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {biz.growth_percent > 0 ? "+" : ""}{biz.growth_percent}%
          </span>
        </span>
        <span className="text-muted-foreground/30">·</span>
        <span className="text-muted-foreground">{biz.revenue_multiple}x</span>
      </div>
    </button>
  );
}

// ─── World Map with Clustering ──────────────────────
function WorldMap({ businesses, selected, hoveredId, popupBiz, onSelect, onHover, onPopup }: {
  businesses: Business[];
  selected: Business | null;
  hoveredId: string | null;
  popupBiz: Business | null;
  onSelect: (b: Business) => void;
  onHover: (id: string | null) => void;
  onPopup: (b: Business | null) => void;
}) {
  const [viewState, setViewState] = useState({
    latitude: 20,
    longitude: 0,
    zoom: 2,
  });

  const superclusterRef = useRef<Supercluster | null>(null);

  // Build GeoJSON points
  const points = useMemo(() => 
    businesses.map((biz, i) => ({
      type: "Feature" as const,
      properties: { index: i, cluster: false, id: biz.id },
      geometry: { type: "Point" as const, coordinates: [biz.lng, biz.lat] },
    })),
  [businesses]);

  // Cluster computation
  const clusters = useMemo(() => {
    const sc = new Supercluster({ radius: 60, maxZoom: 14 });
    sc.load(points);
    superclusterRef.current = sc;
    const bounds: [number, number, number, number] = [-180, -85, 180, 85];
    return sc.getClusters(bounds, Math.floor(viewState.zoom));
  }, [points, viewState.zoom]);

  return (
    <Map
      {...viewState}
      onMove={e => setViewState(e.viewState)}
      style={{ width: "100%", height: "100%" }}
      mapStyle={MAP_STYLE}
      attributionControl={false}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const props = cluster.properties;

        // Cluster marker
        if (props.cluster) {
          const count = props.point_count;
          const size = 28 + Math.min(count, 50) * 0.5;
          return (
            <Marker key={`cluster-${props.cluster_id}`} latitude={lat} longitude={lng} anchor="center">
              <div
                onClick={() => {
                  const sc = superclusterRef.current;
                  if (sc) {
                    const z = sc.getClusterExpansionZoom(props.cluster_id);
                    setViewState({ latitude: lat, longitude: lng, zoom: z });
                  }
                }}
                className="cursor-pointer flex items-center justify-center rounded-full bg-green-700 border-2 border-green-400 text-white font-bold shadow-lg hover:scale-110 transition-transform"
                style={{ width: size, height: size, fontSize: Math.max(10, 14 - count * 0.1) }}
              >
                {count}
              </div>
            </Marker>
          );
        }

        // Individual marker
        const biz = businesses[props.index];
        if (!biz) return null;
        const isSelected2 = selected?.id === biz.id;
        const isHovered = hoveredId === biz.id;
        const isActive = isSelected2 || isHovered;

        return (
          <Marker
            key={biz.id}
            latitude={lat}
            longitude={lng}
            anchor="bottom"
            onClick={e => { e.originalEvent.stopPropagation(); onSelect(biz); }}
          >
            <div
              onMouseEnter={() => { onHover(biz.id); onPopup(biz); }}
              onMouseLeave={() => { onHover(null); onPopup(null); }}
              className={`cursor-pointer transition-all duration-200 ${isActive ? "scale-125 z-30" : "z-10 hover:scale-110"}`}
              style={{ filter: isActive ? "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" : "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
            >
              <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
                <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 40 16 40C16 40 32 28 32 16C32 7.16 24.84 0 16 0Z"
                  fill={isSelected2 ? "#D4A017" : isHovered ? "#4a9e4a" : "#2d7a2d"}
                  stroke={isSelected2 ? "#FFD700" : "#1a5c1a"} strokeWidth="1.5" />
                <circle cx="16" cy="15" r="9" fill="white" />
                <path d="M16 8L9 14V22H13V17H19V22H23V14L16 8Z"
                  fill={isSelected2 ? "#D4A017" : "#2d7a2d"} />
              </svg>
              {isActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full">
                  <div className="px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-md"
                    style={{ background: isSelected2 ? "#D4A017" : "#2d7a2d", color: "#fff" }}>
                    {biz.sale_price ? formatCurrency(biz.sale_price) : biz.name}
                  </div>
                </div>
              )}
            </div>
          </Marker>
        );
      })}

      {popupBiz && !selected && (
        <Popup latitude={popupBiz.lat} longitude={popupBiz.lng} closeButton={false} closeOnClick={false} anchor="bottom" offset={45} className="dynasty8-popup">
          <div className="p-3 min-w-[220px] rounded-lg bg-white text-gray-900">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center text-lg border border-green-200">🏢</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{popupBiz.name}</p>
                <p className="text-[9px] text-gray-500">{popupBiz.buildingName}</p>
              </div>
            </div>
            {popupBiz.city && (
              <p className="text-[9px] text-gray-500 flex items-center gap-1 mb-1.5">
                <MapPin className="w-2.5 h-2.5 text-green-600" />{popupBiz.city}, {popupBiz.country}
              </p>
            )}
            <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
              <span className="text-[10px] text-gray-500">MRR <span className="font-bold text-green-600">{formatCurrency(popupBiz.mrr)}</span></span>
              <span className="text-sm font-black text-gray-900">{popupBiz.sale_price ? formatCurrency(popupBiz.sale_price) : "—"}</span>
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
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg relative" style={{ background: `${color}20` }}>
                  🏢
                  <div className="absolute -top-1.5 -right-1.5">
                    <span className="text-[6px] font-black uppercase px-1 py-0.5 rounded-sm bg-amber-500 text-black">SALE</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate">{biz.name}</h3>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px]" style={{ color }}>{CATEGORIES.find(c => c.value === biz.category)?.label}</span>
                    {biz.city && <span className="text-[8px] text-muted-foreground/50">· {biz.city}, {biz.country}</span>}
                  </div>
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

// ─── Mini 3D Building Preview ───────────────────────
function MiniBuilding3D({ color, style }: { color: string; style: string }) {
  const col = new THREE.Color(color || "#3b82f6");
  const h = style === "corporate" ? 3 : style === "startup" ? 2 : style === "tech" ? 2.5 : 2.8;
  const w = style === "futuristic" ? 1.2 : 1.5;
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, w]} />
        <meshStandardMaterial color={col} roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, h + 0.1, 0]}>
        <boxGeometry args={[w + 0.2, 0.2, w + 0.2]} />
        <meshStandardMaterial color={col} roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Windows */}
      {[0, 1, 2].map(floor => (
        <group key={floor}>
          {[-1, 1].map(side => (
            <mesh key={side} position={[side * (w / 2 + 0.005), 0.6 + floor * 0.9, 0]}>
              <planeGeometry args={[0.005, 0.3]} />
              <meshStandardMaterial emissive={new THREE.Color("#FFE8A0")} emissiveIntensity={1.2} color="black" />
            </mesh>
          ))}
        </group>
      ))}
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Building3DPreview({ color, style }: { color: string; style: string }) {
  return (
    <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-950 border border-border/20">
      <Canvas camera={{ position: [3, 3, 3], fov: 40 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} />
        <pointLight position={[-2, 4, 2]} intensity={0.3} color="#FFE8A0" />
        <MiniBuilding3D color={color} style={style} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  );
}

// ─── Detail Panel ───────────────────────────────────
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
        {/* Header */}
        <div className="h-28 relative flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${color}20, ${color}08)` }}>
          <span className="text-4xl">🏢</span>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-background/60 hover:bg-background/90 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-amber-500 text-black">FOR SALE</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${color}30`, color }}>{catLabel}</span>
          </div>
          <div className="absolute bottom-3 left-3">
            <span className="text-lg font-bold bg-background/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm">
              {business.sale_price ? formatCurrency(business.sale_price) : "Contact"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div>
            <h2 className="font-bold text-lg leading-tight">{business.name}</h2>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{business.buildingName}</span>
              {business.city && <span>· {business.city}, {business.country}</span>}
              <span>· by {business.founder_name}</span>
            </div>
          </div>

          {business.description && <p className="text-[11px] text-muted-foreground leading-relaxed">{business.description}</p>}

          {/* 3D Building Preview */}
          <div>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">🏗️ Building Preview</h3>
            <Building3DPreview color={color} style={business.category === "saas" ? "tech" : business.category === "agency" ? "corporate" : "startup"} />
          </div>

          {/* Location + Universal info */}
          <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-muted-foreground/70">
            {business.country && <span className="flex items-center gap-0.5 bg-muted/10 px-2 py-0.5 rounded-full"><Globe className="w-2.5 h-2.5" />{business.country}</span>}
            {business.city && <span className="flex items-center gap-0.5 bg-muted/10 px-2 py-0.5 rounded-full"><MapPin className="w-2.5 h-2.5" />{business.city}</span>}
            {business.team_size && <span className="flex items-center gap-0.5 bg-muted/10 px-2 py-0.5 rounded-full"><Users className="w-2.5 h-2.5" />{business.team_size}</span>}
            {business.founded_at && <span className="flex items-center gap-0.5 bg-muted/10 px-2 py-0.5 rounded-full"><Calendar className="w-2.5 h-2.5" />{business.founded_at}</span>}
            {business.business_model && <span className="flex items-center gap-0.5 bg-muted/10 px-2 py-0.5 rounded-full"><Briefcase className="w-2.5 h-2.5" />{business.business_model}</span>}
          </div>

          {/* Core metrics */}
          <div>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Key Metrics</h3>
            <div className="grid grid-cols-2 gap-1.5">
              <MetricBox label="Revenue (30d)" value={formatCurrency(business.mrr)} accent="#10b981" />
              <MetricBox label="Growth" value={`${business.growth_percent > 0 ? "+" : ""}${business.growth_percent}%`} accent={business.growth_percent > 0 ? "#10b981" : "#ef4444"} />
              <MetricBox label="Annual Rev" value={formatCurrency(business.mrr * 12)} accent="#3b82f6" />
              <MetricBox label="Multiple" value={`${business.revenue_multiple}x`} accent="#f59e0b" />
            </div>
          </div>

          {/* Category-specific */}
          {catFields.length > 0 && business.category_data && Object.keys(business.category_data).length > 0 && (
            <div>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{catLabel} Details</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {catFields.map(f => (
                  <MetricBox key={f.key} label={f.label} value={formatFieldValue(business.category_data?.[f.key], f.format)} accent={color} />
                ))}
              </div>
            </div>
          )}

          {/* Scores */}
          <div>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Asset Scores</h3>
            <div className="space-y-1">
              <ScoreBar label="Growth" value={scores.growth} color="#10b981" />
              <ScoreBar label="Risk" value={scores.risk} color="#ef4444" />
              <ScoreBar label="Liquidity" value={scores.liquidity} color="#3b82f6" />
              <ScoreBar label="Automation" value={scores.automation} color="#8b5cf6" />
            </div>
          </div>

          {/* ROI */}
          <div>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">💰 Purchase Simulation</h3>
            <div className="grid grid-cols-3 gap-1.5">
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

        {/* Actions */}
        <div className="p-3 space-y-1.5 border-t border-border/20 shrink-0 bg-gradient-to-t from-green-950/30 to-transparent">
          <Button onClick={onVisit} size="sm" className="w-full h-9 text-[11px] justify-center gap-2 font-bold uppercase tracking-wider bg-green-700 hover:bg-green-600 text-white border-0">
            <Building2 className="w-3.5 h-3.5" /> VISIT BUILDING IN 3D CITY
          </Button>
          <div className="flex gap-1.5">
            <Button onClick={onOffer} variant="outline" size="sm" className="flex-1 h-8 text-[10px] gap-1.5 border-green-700/40 text-green-400 hover:bg-green-900/30">
              <Send className="w-3 h-3" /> MAKE OFFER
            </Button>
            <Button onClick={onBuy} size="sm" className="flex-1 h-8 text-[10px] gap-1.5 font-bold uppercase bg-amber-600 hover:bg-amber-500 text-black border-0">
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
    <div className="bg-muted/10 rounded-lg px-2.5 py-1.5">
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
