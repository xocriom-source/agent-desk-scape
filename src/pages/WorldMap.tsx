import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Globe, Building2, Users2, ArrowLeft, Search, Server,
  ChevronRight, Signal, ChevronDown, MapPin
} from "lucide-react";
import { WORLD_DATA, getAllCities, getBestServer, type City, type Continent, type Country } from "@/data/worldData";
import { SEOHead } from "@/components/SEOHead";
import logo from "@/assets/logo.png";

type ViewLevel = "world" | "continent" | "country" | "city";

export default function WorldMap() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [viewLevel, setViewLevel] = useState<ViewLevel>("world");
  const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const allCities = useMemo(() => getAllCities(), []);

  const filteredCities = useMemo(() => {
    if (!search) return allCities;
    const q = search.toLowerCase();
    return allCities.filter(c => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q));
  }, [search, allCities]);

  const totalPop = allCities.reduce((s, c) => s + c.population, 0);
  const totalBuildings = allCities.reduce((s, c) => s + c.buildings, 0);

  const handleEnterCity = (city: City) => {
    const server = getBestServer(city.id);
    localStorage.setItem("agentoffice_city", JSON.stringify({
      id: city.id, name: city.name, country: city.country, flag: city.flag,
      serverId: server?.id || city.servers[0]?.id,
    }));
    navigate("/city-explore");
  };

  const breadcrumbs = useMemo(() => {
    const items: { label: string; onClick: () => void }[] = [
      { label: "🌍 Mundo", onClick: () => { setViewLevel("world"); setSelectedContinent(null); setSelectedCountry(null); setSelectedCity(null); } },
    ];
    if (selectedContinent) {
      items.push({ label: `${selectedContinent.emoji} ${selectedContinent.name}`, onClick: () => { setViewLevel("continent"); setSelectedCountry(null); setSelectedCity(null); } });
    }
    if (selectedCountry) {
      items.push({ label: `${selectedCountry.flag} ${selectedCountry.name}`, onClick: () => { setViewLevel("country"); setSelectedCity(null); } });
    }
    if (selectedCity) {
      items.push({ label: `${selectedCity.flag} ${selectedCity.name}`, onClick: () => {} });
    }
    return items;
  }, [viewLevel, selectedContinent, selectedCountry, selectedCity]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead title="Mapa-Múndi" description="Explore 30+ cidades virtuais ao redor do mundo no The Good City." path="/world" />
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img src={logo} alt="AgentOffice" className="w-6 h-6" />
            <span className="font-display font-bold text-foreground">Mapa-Múndi</span>
            <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Signal className="w-2.5 h-2.5" /> {allCities.length} cidades online
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground font-mono">
              {totalPop.toLocaleString()} jogadores · {totalBuildings.toLocaleString()} prédios
            </span>
            <button onClick={() => navigate("/signup")} className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors">
              Entrar na cidade
            </button>
          </div>
        </div>
      </div>

      <div className="pt-14 flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar */}
        <div className="w-full lg:w-96 border-r border-border bg-card/50 flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar cidade ou país..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="px-4 py-2 border-b border-border/50 flex items-center gap-1 flex-wrap">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/50" />}
                <button onClick={b.onClick} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors font-mono">
                  {b.label}
                </button>
              </span>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {search ? (
              filteredCities.map(city => (
                <CityCard key={city.id} city={city} selected={selectedCity?.id === city.id} onClick={() => { setSelectedCity(city); setViewLevel("city"); }} />
              ))
            ) : viewLevel === "world" ? (
              WORLD_DATA.map(cont => (
                <button
                  key={cont.id}
                  onClick={() => { setSelectedContinent(cont); setViewLevel("continent"); }}
                  className="w-full rounded-xl p-4 bg-card/50 border border-border hover:bg-accent/50 hover:border-primary/30 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cont.emoji}</span>
                      <div>
                        <h3 className="font-display font-semibold text-foreground text-sm">{cont.name}</h3>
                        <p className="text-[10px] text-muted-foreground">
                          {cont.countries.length} países · {cont.countries.reduce((s, co) => s + co.cities.length, 0)} cidades
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))
            ) : viewLevel === "continent" && selectedContinent ? (
              selectedContinent.countries.map(country => (
                <button
                  key={country.id}
                  onClick={() => { setSelectedCountry(country); setViewLevel("country"); }}
                  className="w-full rounded-xl p-4 bg-card/50 border border-border hover:bg-accent/50 hover:border-primary/30 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <h3 className="font-display font-semibold text-foreground text-sm">{country.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{country.cities.length} cidades</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))
            ) : viewLevel === "country" && selectedCountry ? (
              selectedCountry.cities.map(city => (
                <CityCard key={city.id} city={city} selected={selectedCity?.id === city.id} onClick={() => { setSelectedCity(city); setViewLevel("city"); }} />
              ))
            ) : null}
          </div>
        </div>

        {/* Main area - Map */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-full max-w-4xl aspect-[2/1]">
              <div className="absolute inset-0 rounded-2xl border border-border bg-card/30"
                style={{
                  backgroundImage: `linear-gradient(hsl(var(--border) / 0.2) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.2) 1px, transparent 1px)`,
                  backgroundSize: "40px 40px"
                }}
              />
              {allCities.map((city) => (
                <motion.div
                  key={city.id}
                  className="absolute cursor-pointer group"
                  style={{ left: `${city.lng}%`, top: `${city.lat}%`, transform: "translate(-50%, -50%)" }}
                  whileHover={{ scale: 1.5 }}
                  onClick={() => { setSelectedCity(city); setViewLevel("city"); }}
                >
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full border-2 border-background" style={{ backgroundColor: city.color, boxShadow: `0 0 12px ${city.color}80` }} />
                    {selectedCity?.id === city.id && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -inset-2 rounded-full border-2" style={{ borderColor: city.color }} />
                    )}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <div className="bg-popover text-popover-foreground text-[10px] font-medium px-2 py-1 rounded-lg border border-border">
                        {city.flag} {city.name}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Selected city detail */}
          {selectedCity && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="absolute bottom-6 right-6 w-96 bg-card border border-border rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{selectedCity.flag}</span>
                <div>
                  <h3 className="font-display font-bold text-foreground text-lg">{selectedCity.name}</h3>
                  <p className="text-muted-foreground text-xs">{selectedCity.country}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-muted/50 rounded-xl p-3">
                  <div className="text-lg font-display font-bold text-foreground">{selectedCity.population.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">jogadores</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-3">
                  <div className="text-lg font-display font-bold text-foreground">{selectedCity.buildings}/{selectedCity.maxBuildings}</div>
                  <div className="text-[10px] text-muted-foreground">prédios</div>
                </div>
              </div>

              <div className="mb-4">
                <span className="text-[10px] text-muted-foreground tracking-widest font-bold block mb-2 font-mono">DISTRITOS</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCity.districts.map(d => (
                    <span key={d.id} className="text-[9px] px-2 py-1 rounded-md border border-border text-muted-foreground font-mono">
                      {d.emoji} {d.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <span className="text-[10px] text-muted-foreground tracking-widest font-bold block mb-2 font-mono">SERVIDORES</span>
                <div className="space-y-1.5">
                  {selectedCity.servers.map(s => (
                    <div key={s.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${s.status === "online" ? "bg-emerald-400" : s.status === "full" ? "bg-amber-400" : "bg-red-400"}`} />
                        <span className="text-[10px] text-foreground/80 font-mono">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        <span className="text-muted-foreground"><Users2 className="w-3 h-3 inline mr-0.5" />{s.population}/{s.maxPopulation}</span>
                        <span className="text-primary">{s.ping}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Ocupação</span>
                  <span>{Math.round((selectedCity.buildings / selectedCity.maxBuildings) * 100)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(selectedCity.buildings / selectedCity.maxBuildings) * 100}%`, backgroundColor: selectedCity.color }} />
                </div>
              </div>

              <button
                onClick={() => handleEnterCity(selectedCity)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 rounded-xl text-sm transition-colors"
              >
                <Building2 className="w-4 h-4" />
                Entrar em {selectedCity.name}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function CityCard({ city, selected, onClick }: { city: City; selected: boolean; onClick: () => void }) {
  const bestServer = getBestServer(city.id);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-xl p-4 cursor-pointer transition-all border ${selected ? "bg-accent border-primary/50" : "bg-card/50 border-border hover:bg-accent/50 hover:border-primary/30"}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{city.flag}</span>
          <div>
            <h3 className="font-display font-semibold text-foreground text-sm">{city.name}</h3>
            <p className="text-muted-foreground text-[10px]">{city.country} · {city.servers.length} server{city.servers.length > 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-primary">{bestServer?.ping || 0}ms</span>
        </div>
      </div>
      <div className="flex gap-4 text-[10px] text-muted-foreground mb-2">
        <span className="flex items-center gap-1"><Users2 className="w-3 h-3" />{city.population.toLocaleString()}</span>
        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{city.buildings}/{city.maxBuildings}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1">
        <div className="h-full rounded-full transition-all" style={{ width: `${(city.buildings / city.maxBuildings) * 100}%`, backgroundColor: city.color }} />
      </div>
    </motion.div>
  );
}
