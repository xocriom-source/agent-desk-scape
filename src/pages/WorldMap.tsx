import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Globe, Building2, Users2, ArrowLeft, Search, Server,
  ChevronRight, Zap, MapPin, Signal, ArrowRight
} from "lucide-react";
import logo from "@/assets/logo.png";

interface CityData {
  id: string;
  name: string;
  country: string;
  flag: string;
  region: string;
  server: string;
  population: number;
  buildings: number;
  maxBuildings: number;
  lat: number;
  lng: number;
  color: string;
  status: "online" | "full" | "maintenance";
  ping: number;
}

const CITIES: CityData[] = [
  { id: "sp", name: "São Paulo", country: "Brasil", flag: "🇧🇷", region: "América do Sul", server: "sa-east-1", population: 1247, buildings: 312, maxBuildings: 1000, lat: 38, lng: 28, color: "hsl(142 70% 45%)", status: "online", ping: 12 },
  { id: "ny", name: "New York", country: "EUA", flag: "🇺🇸", region: "América do Norte", server: "us-east-1", population: 2891, buildings: 890, maxBuildings: 2000, lat: 30, lng: 26, color: "hsl(220 70% 50%)", status: "online", ping: 45 },
  { id: "tk", name: "Tokyo", country: "Japão", flag: "🇯🇵", region: "Ásia", server: "ap-northeast-1", population: 1583, buildings: 445, maxBuildings: 1500, lat: 32, lng: 78, color: "hsl(350 70% 50%)", status: "online", ping: 180 },
  { id: "ld", name: "London", country: "Reino Unido", flag: "🇬🇧", region: "Europa", server: "eu-west-2", population: 1120, buildings: 320, maxBuildings: 1000, lat: 25, lng: 48, color: "hsl(30 70% 50%)", status: "online", ping: 95 },
  { id: "se", name: "Seoul", country: "Coreia do Sul", flag: "🇰🇷", region: "Ásia", server: "ap-northeast-2", population: 980, buildings: 275, maxBuildings: 800, lat: 30, lng: 75, color: "hsl(270 70% 55%)", status: "online", ping: 190 },
  { id: "db", name: "Dubai", country: "Emirados", flag: "🇦🇪", region: "Oriente Médio", server: "me-south-1", population: 650, buildings: 180, maxBuildings: 500, lat: 34, lng: 57, color: "hsl(45 80% 50%)", status: "online", ping: 120 },
  { id: "sg", name: "Singapore", country: "Singapura", flag: "🇸🇬", region: "Ásia", server: "ap-southeast-1", population: 820, buildings: 230, maxBuildings: 700, lat: 48, lng: 70, color: "hsl(280 70% 55%)", status: "online", ping: 160 },
  { id: "sf", name: "San Francisco", country: "EUA", flag: "🇺🇸", region: "América do Norte", server: "us-west-1", population: 1450, buildings: 520, maxBuildings: 1200, lat: 30, lng: 15, color: "hsl(200 70% 50%)", status: "online", ping: 55 },
  { id: "pa", name: "Paris", country: "França", flag: "🇫🇷", region: "Europa", server: "eu-west-3", population: 930, buildings: 290, maxBuildings: 800, lat: 27, lng: 49, color: "hsl(330 60% 55%)", status: "online", ping: 90 },
  { id: "mx", name: "Cidade do México", country: "México", flag: "🇲🇽", region: "América do Norte", server: "us-south-1", population: 560, buildings: 140, maxBuildings: 600, lat: 36, lng: 18, color: "hsl(15 80% 50%)", status: "online", ping: 35 },
  { id: "sy", name: "Sydney", country: "Austrália", flag: "🇦🇺", region: "Oceania", server: "ap-southeast-2", population: 420, buildings: 110, maxBuildings: 500, lat: 58, lng: 82, color: "hsl(50 70% 50%)", status: "online", ping: 200 },
  { id: "be", name: "Berlim", country: "Alemanha", flag: "🇩🇪", region: "Europa", server: "eu-central-1", population: 780, buildings: 210, maxBuildings: 700, lat: 24, lng: 51, color: "hsl(0 0% 45%)", status: "online", ping: 85 },
];

const REGIONS = ["Todas", "América do Sul", "América do Norte", "Europa", "Ásia", "Oriente Médio", "Oceania"];

export default function WorldMap() {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("Todas");

  const filtered = CITIES.filter(c => {
    if (region !== "Todas" && c.region !== region) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.country.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleEnterCity = (city: CityData) => {
    const user = localStorage.getItem("agentoffice_user");
    if (!user) {
      navigate("/signup");
      return;
    }
    // Store selected city and navigate to office
    localStorage.setItem("agentoffice_city", JSON.stringify({ id: city.id, name: city.name, country: city.country, flag: city.flag }));
    navigate("/office");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img src={logo} alt="AgentOffice" className="w-6 h-6" />
            <span className="font-display font-bold text-white">Mapa-Múndi</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Signal className="w-2.5 h-2.5" /> {CITIES.length} cidades online
            </span>
          </div>
          <button onClick={() => navigate("/signup")} className="text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors">
            Entrar na cidade
          </button>
        </div>
      </div>

      <div className="pt-14 flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar - City List */}
        <div className="w-full lg:w-96 border-r border-gray-800 bg-gray-900/50 flex flex-col">
          <div className="p-4 border-b border-gray-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar cidade ou país..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {REGIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                    region === r ? "bg-primary text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.map((city) => (
              <motion.div
                key={city.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`rounded-xl p-4 cursor-pointer transition-all border ${
                  selectedCity?.id === city.id
                    ? "bg-gray-800 border-primary/50"
                    : "bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 hover:border-gray-700"
                }`}
                onClick={() => setSelectedCity(city)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{city.flag}</span>
                    <div>
                      <h3 className="font-display font-semibold text-white text-sm">{city.name}</h3>
                      <p className="text-gray-500 text-[10px]">{city.country} · {city.server}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-emerald-400">{city.ping}ms</span>
                  </div>
                </div>

                <div className="flex gap-4 text-[10px] text-gray-500 mb-2">
                  <span className="flex items-center gap-1"><Users2 className="w-3 h-3" />{city.population.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{city.buildings}/{city.maxBuildings}</span>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-1">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(city.buildings / city.maxBuildings) * 100}%`, backgroundColor: city.color }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main - Map / City Detail */}
        <div className="flex-1 relative">
          {/* Simple world map visualization */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-full max-w-4xl aspect-[2/1]">
              {/* Grid background */}
              <div className="absolute inset-0 rounded-2xl border border-gray-800 bg-gray-900/30"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
                  `,
                  backgroundSize: "40px 40px"
                }}
              />

              {/* City dots */}
              {CITIES.map((city) => (
                <motion.div
                  key={city.id}
                  className="absolute cursor-pointer group"
                  style={{ left: `${city.lng}%`, top: `${city.lat}%`, transform: "translate(-50%, -50%)" }}
                  whileHover={{ scale: 1.5 }}
                  onClick={() => setSelectedCity(city)}
                >
                  <div className="relative">
                    <div
                      className="w-3 h-3 rounded-full border-2 border-gray-950"
                      style={{ backgroundColor: city.color, boxShadow: `0 0 12px ${city.color}80` }}
                    />
                    {selectedCity?.id === city.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -inset-2 rounded-full border-2"
                        style={{ borderColor: city.color }}
                      />
                    )}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      <div className="bg-gray-800 text-white text-[10px] font-medium px-2 py-1 rounded-lg border border-gray-700">
                        {city.flag} {city.name}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Selected city detail panel */}
          {selectedCity && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute bottom-6 right-6 w-80 bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{selectedCity.flag}</span>
                <div>
                  <h3 className="font-display font-bold text-white text-lg">{selectedCity.name}</h3>
                  <p className="text-gray-500 text-xs">{selectedCity.country} · {selectedCity.region}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <div className="text-lg font-display font-bold text-white">{selectedCity.population.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-500">jogadores ativos</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <div className="text-lg font-display font-bold text-white">{selectedCity.buildings}</div>
                  <div className="text-[10px] text-gray-500">de {selectedCity.maxBuildings} prédios</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-4 bg-gray-800/30 rounded-lg px-3 py-2">
                <span className="flex items-center gap-1"><Server className="w-3 h-3" />{selectedCity.server}</span>
                <span className="flex items-center gap-1 text-emerald-400"><Signal className="w-3 h-3" />{selectedCity.ping}ms</span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                  <span>Ocupação</span>
                  <span>{Math.round((selectedCity.buildings / selectedCity.maxBuildings) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(selectedCity.buildings / selectedCity.maxBuildings) * 100}%`, backgroundColor: selectedCity.color }} />
                </div>
              </div>

              <button
                onClick={() => handleEnterCity(selectedCity)}
                className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100 font-medium py-3 rounded-xl text-sm transition-colors"
              >
                <Building2 className="w-4 h-4" />
                Entrar em {selectedCity.name}
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
