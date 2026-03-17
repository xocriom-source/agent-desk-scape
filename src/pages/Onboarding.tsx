import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Home, Landmark, Briefcase, ArrowRight,
  ArrowLeft, Globe, Check, Search, MapPin
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import logoOriginal from "@/assets/logo-original.svg";
import { OnboardingStepIndicator, STEP_XP } from "@/components/onboarding/OnboardingStepIndicator";
import { XPRewardPopup } from "@/components/onboarding/XPRewardPopup";

const BUILDING_OPTIONS = [
  {
    id: "corporate",
    icon: Building2,
    name: "Escritório Corporativo",
    desc: "Torre comercial com múltiplos andares. Ideal para equipes grandes com foco em produtividade e operações.",
    floors: "5-20 andares",
    agents: "Até 20 agentes",
    bestFor: "Operações, gestão de projetos, análise de dados",
    color: "hsl(var(--primary))",
    colorBg: "hsl(var(--primary) / 0.15)",
    colorLight: "hsl(var(--primary) / 0.08)",
    features: ["Salas de reunião", "Área de gestão", "Dashboard integrado"],
    defaultFloors: 5,
    defaultHeight: 10,
  },
  {
    id: "studio",
    icon: Home,
    name: "Studio Criativo",
    desc: "Espaço compacto e inspirador. Perfeito para freelancers, artistas e criadores de conteúdo.",
    floors: "1-3 andares",
    agents: "Até 6 agentes",
    bestFor: "Arte, música, escrita criativa, design",
    color: "hsl(330 80% 60%)",
    colorBg: "hsl(330 80% 60% / 0.15)",
    colorLight: "hsl(330 80% 60% / 0.08)",
    features: ["Estúdio de música", "Ateliê de arte", "Área de inspiração"],
    defaultFloors: 2,
    defaultHeight: 4,
  },
  {
    id: "research",
    icon: Landmark,
    name: "Centro de Pesquisa",
    desc: "Laboratórios equipados para análise e experimentação. Foco em inovação e descobertas.",
    floors: "3-10 andares",
    agents: "Até 12 agentes",
    bestFor: "Pesquisa, AI, ciência de dados, experimentação",
    color: "hsl(var(--accent))",
    colorBg: "hsl(var(--accent) / 0.15)",
    colorLight: "hsl(var(--accent) / 0.08)",
    features: ["Lab de IA", "Sala de análise", "Biblioteca digital"],
    defaultFloors: 4,
    defaultHeight: 8,
  },
  {
    id: "hub",
    icon: Briefcase,
    name: "Hub de Negócios",
    desc: "Coworking com áreas compartilhadas. Networking e colaboração com outros prédios da cidade.",
    floors: "2-8 andares",
    agents: "Até 15 agentes",
    bestFor: "Networking, vendas, marketing, parcerias",
    color: "hsl(45 80% 50%)",
    colorBg: "hsl(45 80% 50% / 0.15)",
    colorLight: "hsl(45 80% 50% / 0.08)",
    features: ["Marketplace integrado", "Sala de pitch", "Área de networking"],
    defaultFloors: 3,
    defaultHeight: 6,
  },
];

const CITIES = [
  { name: "São Paulo", country: "Brasil", region: "south-america", lat: -23.55, lng: -46.63 },
  { name: "Rio de Janeiro", country: "Brasil", region: "south-america", lat: -22.91, lng: -43.17 },
  { name: "Belo Horizonte", country: "Brasil", region: "south-america", lat: -19.92, lng: -43.94 },
  { name: "Curitiba", country: "Brasil", region: "south-america", lat: -25.43, lng: -49.27 },
  { name: "Porto Alegre", country: "Brasil", region: "south-america", lat: -30.03, lng: -51.23 },
  { name: "Brasília", country: "Brasil", region: "south-america", lat: -15.79, lng: -47.88 },
  { name: "Salvador", country: "Brasil", region: "south-america", lat: -12.97, lng: -38.51 },
  { name: "Recife", country: "Brasil", region: "south-america", lat: -8.05, lng: -34.87 },
  { name: "Fortaleza", country: "Brasil", region: "south-america", lat: -3.72, lng: -38.53 },
  { name: "Florianópolis", country: "Brasil", region: "south-america", lat: -27.59, lng: -48.55 },
  { name: "Buenos Aires", country: "Argentina", region: "south-america", lat: -34.60, lng: -58.38 },
  { name: "Santiago", country: "Chile", region: "south-america", lat: -33.45, lng: -70.67 },
  { name: "Bogotá", country: "Colômbia", region: "south-america", lat: 4.71, lng: -74.07 },
  { name: "Lima", country: "Peru", region: "south-america", lat: -12.05, lng: -77.04 },
  { name: "Cidade do México", country: "México", region: "north-america", lat: 19.43, lng: -99.13 },
  { name: "Nova York", country: "EUA", region: "north-america", lat: 40.71, lng: -74.01 },
  { name: "São Francisco", country: "EUA", region: "north-america", lat: 37.77, lng: -122.42 },
  { name: "Miami", country: "EUA", region: "north-america", lat: 25.76, lng: -80.19 },
  { name: "Toronto", country: "Canadá", region: "north-america", lat: 43.65, lng: -79.38 },
  { name: "Londres", country: "Reino Unido", region: "europe", lat: 51.51, lng: -0.13 },
  { name: "Paris", country: "França", region: "europe", lat: 48.86, lng: 2.35 },
  { name: "Berlim", country: "Alemanha", region: "europe", lat: 52.52, lng: 13.41 },
  { name: "Lisboa", country: "Portugal", region: "europe", lat: 38.72, lng: -9.14 },
  { name: "Tóquio", country: "Japão", region: "asia", lat: 35.68, lng: 139.69 },
  { name: "Seul", country: "Coreia do Sul", region: "asia", lat: 37.57, lng: 126.98 },
  { name: "Singapura", country: "Singapura", region: "asia", lat: 1.35, lng: 103.82 },
  { name: "Dubai", country: "EAU", region: "asia", lat: 25.20, lng: 55.27 },
  { name: "Sydney", country: "Austrália", region: "oceania", lat: -33.87, lng: 151.21 },
  { name: "Lagos", country: "Nigéria", region: "africa", lat: 6.52, lng: 3.38 },
  { name: "Nairóbi", country: "Quênia", region: "africa", lat: -1.29, lng: 36.82 },
];

const STYLE_COLORS: Record<string, { primary: string; secondary: string }> = {
  corporate: { primary: "#3b82f6", secondary: "#1e3a5f" },
  studio: { primary: "#ec4899", secondary: "#831843" },
  research: { primary: "#8b5cf6", secondary: "#4c1d95" },
  hub: { primary: "#f59e0b", secondary: "#78350f" },
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewSpace = searchParams.get("mode") === "new";
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [buildingName, setBuildingName] = useState("");
  const [selectedCity, setSelectedCity] = useState<typeof CITIES[0] | null>(null);
  const [citySearch, setCitySearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [showXPPopup, setShowXPPopup] = useState(false);
  const [popupXP, setPopupXP] = useState(0);

  const awardXP = useCallback((stepIndex: number) => {
    const xp = STEP_XP[stepIndex] || 0;
    setPopupXP(xp);
    setShowXPPopup(true);
    setEarnedXP(prev => prev + xp);
    setTimeout(() => setShowXPPopup(false), 1500);
  }, []);

  const filteredCities = useMemo(() => {
    if (!citySearch) return CITIES;
    const q = citySearch.toLowerCase();
    return CITIES.filter(c => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q));
  }, [citySearch]);

  const handleFinish = async () => {
    const building = BUILDING_OPTIONS.find(b => b.id === selectedBuilding);
    if (!building || !user) return;

    setSaving(true);
    const spaceName = buildingName.trim() || building.name;
    const city = selectedCity || CITIES[0];
    const buildingType = selectedBuilding || "corporate";
    const colors = STYLE_COLORS[buildingType];

    const buildingPayload = {
      name: spaceName,
      owner_id: user.id,
      style: buildingType,
      district: "central",
      floors: building.defaultFloors,
      height: building.defaultHeight,
      position_x: Math.round((Math.random() * 180 - 90) * 100) / 100,
      position_z: Math.round((Math.random() * 180 - 90) * 100) / 100,
      primary_color: colors.primary,
      secondary_color: colors.secondary,
      city: city.name,
      country: city.country,
      region: city.region,
      latitude: city.lat,
      longitude: city.lng,
      metadata: { created_via: "onboarding", created_at_flow: true },
    };

    try {
      let savedBuildingId: string | null = null;

      if (isNewSpace) {
        const { data: createdBuilding, error: createError } = await supabase
          .from("city_buildings")
          .insert(buildingPayload)
          .select("id, name, city")
          .single();

        if (createError) throw createError;
        savedBuildingId = createdBuilding.id;
      } else {
        const { data: existingBuildings, error: existingError } = await supabase
          .from("city_buildings")
          .select("id")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (existingError) throw existingError;

        if (existingBuildings && existingBuildings.length > 0) {
          const { data: updatedBuilding, error: updateError } = await supabase
            .from("city_buildings")
            .update(buildingPayload)
            .eq("id", existingBuildings[0].id)
            .eq("owner_id", user.id)
            .select("id, name, city")
            .single();

          if (updateError) throw updateError;
          savedBuildingId = updatedBuilding.id;
        } else {
          const { data: createdBuilding, error: createError } = await supabase
            .from("city_buildings")
            .insert(buildingPayload)
            .select("id, name, city")
            .single();

          if (createError) throw createError;
          savedBuildingId = createdBuilding.id;
        }

        try {
          await updateProfile({ company_name: spaceName, city: city.name });
        } catch {
          // Non-blocking profile sync
        }
      }

      if (!savedBuildingId) {
        throw new Error("Space não retornou um ID válido.");
      }

      localStorage.setItem("currentSpaceId", savedBuildingId);
      localStorage.setItem("buildingName", spaceName);
      localStorage.setItem("buildingType", buildingType);

      toast.success(isNewSpace ? "Espaço criado com sucesso" : "Espaço configurado com sucesso", {
        description: `${spaceName} • ${city.name}`,
      });

      navigate("/lobby");
    } catch (error) {
      const description = error instanceof Error ? error.message : "Não foi possível salvar seu espaço.";
      toast.error("Erro ao salvar espaço", { description });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={logoOriginal} alt="" className="w-8 h-8" />
          <span className="font-display font-bold text-xl text-primary">THE GOOD CITY</span>
        </div>

        {/* Gamified Progress */}
        <OnboardingStepIndicator currentStep={step} totalXP={earnedXP} />
        <XPRewardPopup xp={popupXP} show={showXPPopup} />

        {/* Step 1: Building Type */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold mb-2">
                {isNewSpace ? "Crie um novo espaço" : "Escolha o tipo do seu prédio"}
              </h1>
              <p className="text-muted-foreground">Cada tipo tem vantagens únicas. Você pode mudar depois.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {BUILDING_OPTIONS.map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBuilding(b.id)}
                  className={`rounded-2xl p-5 border-2 cursor-pointer transition-all ${
                    selectedBuilding === b.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card/50 hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: b.colorBg }}>
                      <b.icon className="w-5 h-5" style={{ color: b.color }} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{b.name}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">{b.desc}</p>
                    </div>
                    {selectedBuilding === b.id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 text-[10px] mb-3">
                    <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md">{b.floors}</span>
                    <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-md">{b.agents}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {b.features.map(f => (
                      <span key={f} className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: b.colorLight, color: b.color }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => { if (selectedBuilding) { awardXP(0); setStep(2); } }}
                disabled={!selectedBuilding}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Name */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold mb-2">Dê um nome ao seu prédio</h1>
              <p className="text-muted-foreground">Este será o nome visível para outros jogadores na cidade.</p>
            </div>

            <div className="max-w-md mx-auto mb-8">
              {(() => {
                const b = BUILDING_OPTIONS.find(x => x.id === selectedBuilding)!;
                return (
                  <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: b.colorBg }}>
                        <b.icon className="w-6 h-6" style={{ color: b.color }} />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground">{b.name}</h3>
                        <p className="text-xs text-muted-foreground">{b.bestFor}</p>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Ex: MeuNegócio HQ, Creative Labs..."
                      value={buildingName}
                      onChange={e => setBuildingName(e.target.value)}
                      className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 text-sm transition-all"
                      autoFocus
                    />
                  </div>
                );
              })()}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  <Globe className="w-4 h-4" /> Escolher cidade <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: City Selection */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold mb-2">Escolha sua cidade</h1>
              <p className="text-muted-foreground">Seu prédio será posicionado nesta cidade no mapa global.</p>
            </div>

            <div className="max-w-2xl mx-auto">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar cidade ou país..."
                  value={citySearch}
                  onChange={e => setCitySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 text-sm"
                  autoFocus
                />
              </div>

              {/* City grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1 mb-8">
                {filteredCities.map(city => (
                  <div
                    key={`${city.name}-${city.country}`}
                    onClick={() => setSelectedCity(city)}
                    className={`rounded-xl p-3 border-2 cursor-pointer transition-all ${
                      selectedCity?.name === city.name && selectedCity?.country === city.country
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card/50 hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{city.name}</p>
                        <p className="text-[10px] text-muted-foreground">{city.country}</p>
                      </div>
                      {selectedCity?.name === city.name && selectedCity?.country === city.country && (
                        <Check className="w-4 h-4 text-primary ml-auto shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={handleFinish}
                  disabled={!selectedCity || saving}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {isNewSpace ? "Criar espaço" : "Finalizar"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
