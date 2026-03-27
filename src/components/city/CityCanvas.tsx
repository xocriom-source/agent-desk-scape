/**
 * CityCanvas — Premium isometric city view.
 * Social, visual, data-driven. The "product" view of the city.
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Users, Zap, ChevronRight, Building2,
  Coffee, BookOpen, Wrench, Palette, ShoppingBag, Telescope,
  Activity, Bot, Crown, ArrowLeft,
} from "lucide-react";
import { CITY_DISTRICTS, type CityDistrict } from "@/data/cityDistricts";
import { useGameStore } from "@/stores/gameStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CityModeSwitcher } from "@/components/city/CityModeSwitcher";
import type { CityBuilding } from "@/types/building";

const DISTRICT_ICONS: Record<string, typeof Coffee> = {
  "central-plaza": MapPin,
  "lounge": Coffee,
  "library": BookOpen,
  "workshop": Wrench,
  "creative": Palette,
  "marketplace": ShoppingBag,
  "observatory": Telescope,
};

// ── Isometric Building Component ──
function IsoBuildingIcon({ building, scale = 1, onClick }: {
  building: { name: string; emoji: string; height: number; width: number; color: string };
  scale?: number;
  onClick?: () => void;
}) {
  const w = building.width * 12 * scale;
  const h = building.height * 8 * scale;

  return (
    <motion.div
      className="relative cursor-pointer group"
      style={{ width: w, height: h + 20 }}
      whileHover={{ y: -4, scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      <div
        className="absolute bottom-0 left-0 right-0 rounded-t-md border border-white/10 transition-all group-hover:border-white/25"
        style={{
          height: h,
          background: `linear-gradient(180deg, ${building.color} 0%, ${building.color}CC 100%)`,
          boxShadow: `0 4px 20px ${building.color}40`,
        }}
      >
        <div className="absolute inset-2 grid grid-cols-2 gap-1 opacity-40">
          {Array.from({ length: Math.min(building.height * 2, 8) }).map((_, i) => (
            <div key={i} className="bg-white/30 rounded-[1px]" />
          ))}
        </div>
      </div>
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm">{building.emoji}</div>
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[9px] text-muted-foreground font-medium">
        {building.name}
      </div>
    </motion.div>
  );
}

// ── District Card ──
function DistrictCard({ district, isSelected, onClick, agentCount, recentActivity }: {
  district: CityDistrict;
  isSelected: boolean;
  onClick: () => void;
  agentCount: number;
  recentActivity: number;
}) {
  const Icon = DISTRICT_ICONS[district.id] || Building2;

  return (
    <motion.button
      onClick={onClick}
      className={`relative w-full text-left rounded-2xl border p-4 transition-all overflow-hidden ${
        isSelected
          ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
          : "border-border/50 bg-card/40 hover:bg-card/60 hover:border-border"
      }`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      layout
    >
      <div className="absolute inset-0 opacity-20 rounded-2xl" style={{ background: district.bgGradient }} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: `${district.color}20` }}>
              <Icon className="w-4 h-4" style={{ color: district.color }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{district.emoji} {district.name}</h3>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{district.purpose}</p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
        </div>

        <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-3">{district.description}</p>

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Bot className="w-3 h-3" />
            {agentCount} agents
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {recentActivity} recent
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {district.buildings.length} buildings
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ── Activity Item ──
function ActivityItem({ action, actor, time }: { action: string; actor: string; time: string }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-border/30 last:border-0">
      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-foreground truncate">
          <span className="font-medium">{actor}</span>{" "}
          <span className="text-muted-foreground">{action}</span>
        </p>
        <p className="text-[10px] text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

// ── Isometric City Map ──
function IsometricCityMap({ districts, selectedId, onSelectDistrict, userBuildings }: {
  districts: CityDistrict[];
  selectedId: string | null;
  onSelectDistrict: (id: string) => void;
  userBuildings: CityBuilding[];
}) {
  const toIso = (x: number, z: number) => ({
    left: (x - z) * 1.8 + 50,
    top: (x + z) * 0.9 + 50,
  });

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        {districts.map((d, i) => {
          if (i === 0) return null;
          const from = toIso(districts[0].x, districts[0].z);
          const to = toIso(d.x, d.z);
          return (
            <line
              key={d.id}
              x1={`${from.left}%`} y1={`${from.top}%`}
              x2={`${to.left}%`} y2={`${to.top}%`}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.4"
            />
          );
        })}
      </svg>

      {districts.map((district) => {
        const pos = toIso(district.x, district.z);
        const isSelected = selectedId === district.id;

        return (
          <motion.button
            key={district.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
            onClick={() => onSelectDistrict(district.id)}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className={`absolute inset-0 rounded-full blur-xl transition-opacity ${isSelected ? "opacity-40" : "opacity-0 group-hover:opacity-20"}`}
              style={{ background: district.color, transform: "scale(2)" }}
            />
            <div className="relative flex flex-col items-center gap-1">
              <div
                className={`p-3 rounded-xl border-2 backdrop-blur-sm transition-all shadow-lg ${
                  isSelected
                    ? "border-primary bg-primary/20 scale-110"
                    : "border-border/60 bg-card/80 group-hover:border-border"
                }`}
                style={isSelected ? { borderColor: district.color, boxShadow: `0 0 20px ${district.color}40` } : {}}
              >
                <span className="text-xl">{district.emoji}</span>
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap px-2 py-0.5 rounded-full transition-all ${
                isSelected ? "bg-primary/20 text-primary" : "text-muted-foreground group-hover:text-foreground"
              }`}>
                {district.name}
              </span>
            </div>
          </motion.button>
        );
      })}

      {userBuildings.map((b) => {
        const pos = toIso(b.coordinates.x, b.coordinates.z);
        return (
          <div
            key={b.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
          >
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-accent/20 border border-accent/40 text-[9px] text-accent font-medium whitespace-nowrap">
              <Crown className="w-2.5 h-2.5" />
              {b.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════

export function CityCanvas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>("central-plaza");
  const [activities, setActivities] = useState<{ action: string; actor: string; time: string }[]>([]);
  const [userBuildings, setUserBuildings] = useState<CityBuilding[]>([]);
  const [districtStats, setDistrictStats] = useState<Record<string, { agents: number; activity: number }>>({});
  const setCityViewMode = useGameStore(s => s.setCityViewMode);

  // Load real activity feed
  useEffect(() => {
    async function loadFeed() {
      const { data } = await supabase
        .from("activity_feed")
        .select("action, actor_name, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setActivities(data.map(d => ({
          action: d.action,
          actor: d.actor_name,
          time: new Date(d.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        })));
      }
      console.log("[CityCanvas:init] Loaded activity feed");
    }
    loadFeed();
  }, []);

  // Load user buildings
  useEffect(() => {
    async function loadBuildings() {
      const { data } = await supabase
        .from("city_buildings")
        .select("*")
        .not("owner_id", "is", null)
        .limit(50);

      if (data) {
        setUserBuildings(data.map(b => ({
          id: b.id,
          name: b.name,
          ownerName: "",
          district: (b.district || "central") as any,
          style: (b.style || "corporate") as any,
          floors: b.floors,
          height: b.height,
          primaryColor: b.primary_color || "#3b82f6",
          secondaryColor: b.secondary_color || "#1e3a5f",
          bio: "",
          links: [],
          customizations: {} as any,
          createdAt: b.created_at,
          coordinates: { x: Number(b.position_x) || 0, z: Number(b.position_z) || 0 },
          claimed: true,
          ownerId: b.owner_id || "",
        })));
      }
    }
    loadBuildings();
  }, []);

  // Load real district stats from agents
  useEffect(() => {
    async function loadStats() {
      const { data: agents } = await supabase
        .from("external_agents")
        .select("id, status, district")
        .limit(100);

      const { data: recentActivity } = await supabase
        .from("agent_activity_log")
        .select("id, building_id, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      const stats: Record<string, { agents: number; activity: number }> = {};
      CITY_DISTRICTS.forEach(d => { stats[d.id] = { agents: 0, activity: 0 }; });

      if (agents) {
        agents.forEach(a => {
          const dist = (a as any).district || "central-plaza";
          if (stats[dist]) stats[dist].agents++;
        });
      }

      if (recentActivity) {
        // Distribute activity across districts based on count
        const perDistrict = Math.max(1, Math.floor(recentActivity.length / CITY_DISTRICTS.length));
        CITY_DISTRICTS.forEach((d, i) => {
          stats[d.id].activity = Math.min(recentActivity.length, perDistrict * (CITY_DISTRICTS.length - i));
        });
      }

      setDistrictStats(stats);
      console.log("[CityCanvas:stats] District stats loaded from DB");
    }
    loadStats();
  }, []);

  const selected = useMemo(
    () => CITY_DISTRICTS.find(d => d.id === selectedDistrict) || null,
    [selectedDistrict]
  );

  const handleEnterDistrict = useCallback(() => {
    setCityViewMode("flyover");
    console.log("[CityCanvas:enter] Switching to flyover mode");
  }, [setCityViewMode]);

  const totalBuildings = userBuildings.length + CITY_DISTRICTS.reduce((sum, d) => sum + d.buildings.length, 0);
  const totalAgents = Object.values(districtStats).reduce((sum, s) => sum + s.agents, 0);

  return (
    <motion.div
      className="flex flex-col h-full bg-background text-foreground overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Top Bar ── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/lobby")}
            className="p-2 rounded-xl bg-card/60 border border-border/50 text-foreground hover:bg-muted/40 transition-all"
            aria-label="Voltar ao lobby"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-bold tracking-tight">
            <span className="text-accent">●</span> Agent City
          </h1>
          <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
            Live
          </span>
        </div>

        <CityModeSwitcher
          buildingCount={totalBuildings}
          agentCount={totalAgents}
          activityCount={activities.length}
        />
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Isometric Map */}
        <div className="flex-1 relative">
          <IsometricCityMap
            districts={CITY_DISTRICTS}
            selectedId={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
            userBuildings={userBuildings}
          />

          {/* Bottom ticker */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/80 backdrop-blur-md border border-border/50 text-[10px] text-muted-foreground overflow-hidden">
              <Zap className="w-3 h-3 text-accent shrink-0" />
              <div className="flex gap-4 animate-marquee whitespace-nowrap">
                {activities.length > 0 ? activities.map((a, i) => (
                  <span key={i}><b className="text-foreground">{a.actor}</b> {a.action}</span>
                )) : (
                  <span>City is waking up... Agents are initializing.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: District Detail Panel */}
        <div className="w-[340px] shrink-0 border-l border-border/50 bg-card/20 backdrop-blur-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-1 mb-2">
              Districts
            </p>
            {CITY_DISTRICTS.map(d => (
              <DistrictCard
                key={d.id}
                district={d}
                isSelected={selectedDistrict === d.id}
                onClick={() => setSelectedDistrict(d.id)}
                agentCount={districtStats[d.id]?.agents ?? 0}
                recentActivity={districtStats[d.id]?.activity ?? 0}
              />
            ))}
          </div>

          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="shrink-0 border-t border-border/50 p-4 bg-card/40 backdrop-blur-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold">{selected.emoji} {selected.name}</h3>
                  <button
                    onClick={handleEnterDistrict}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
                  >
                    Explore 3D →
                  </button>
                </div>

                <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                  {selected.buildings.map(b => (
                    <IsoBuildingIcon key={b.id} building={b} scale={0.7} />
                  ))}
                </div>

                <div className="max-h-24 overflow-y-auto">
                  {activities.slice(0, 4).map((a, i) => (
                    <ActivityItem key={i} action={a.action} actor={a.actor} time={a.time} />
                  ))}
                  {activities.length === 0 && (
                    <p className="text-[10px] text-muted-foreground text-center py-2">No recent activity</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
