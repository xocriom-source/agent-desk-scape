// Global world data: continents → countries → cities → districts → servers

export interface Continent {
  id: string;
  name: string;
  emoji: string;
  countries: Country[];
}

export interface Country {
  id: string;
  name: string;
  flag: string;
  continent: string;
  cities: City[];
}

export interface City {
  id: string;
  name: string;
  country: string;
  flag: string;
  region: string;
  districts: CityDistrict[];
  servers: ServerShard[];
  population: number;
  maxBuildings: number;
  buildings: number;
  color: string;
  lat: number;
  lng: number;
}

export interface CityDistrict {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

export interface ServerShard {
  id: string;
  name: string;
  region: string;
  population: number;
  maxPopulation: number;
  ping: number;
  status: "online" | "full" | "maintenance";
}

const DEFAULT_DISTRICTS: CityDistrict[] = [
  { id: "tech", name: "Tech District", emoji: "💻", description: "Para devs e empresas de tecnologia", color: "hsl(220 70% 50%)" },
  { id: "creator", name: "Creator District", emoji: "🎨", description: "Para artistas e criadores", color: "hsl(330 70% 55%)" },
  { id: "startup", name: "Startup District", emoji: "🚀", description: "Para startups e empreendedores", color: "hsl(142 70% 45%)" },
  { id: "agency", name: "Agency District", emoji: "🏢", description: "Para agências e consultorias", color: "hsl(45 80% 50%)" },
  { id: "downtown", name: "Downtown", emoji: "🏙️", description: "Centro comercial e financeiro", color: "hsl(270 70% 55%)" },
  { id: "financial", name: "Financial District", emoji: "💰", description: "Bancos e corporações", color: "hsl(200 60% 45%)" },
];

function makeServers(cityId: string, region: string, count: number, basePing: number): ServerShard[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${cityId}-s${i + 1}`,
    name: `Server ${i + 1}`,
    region,
    population: Math.floor(Math.random() * 300) + 50,
    maxPopulation: 500,
    ping: basePing + Math.floor(Math.random() * 20),
    status: "online" as const,
  }));
}

export const WORLD_DATA: Continent[] = [
  {
    id: "south-america",
    name: "América do Sul",
    emoji: "🌎",
    countries: [
      {
        id: "br", name: "Brasil", flag: "🇧🇷", continent: "south-america",
        cities: [
          { id: "sp", name: "São Paulo", country: "Brasil", flag: "🇧🇷", region: "sa-east-1", districts: DEFAULT_DISTRICTS, servers: makeServers("sp", "sa-east-1", 3, 12), population: 1247, maxBuildings: 1000, buildings: 312, color: "hsl(142 70% 45%)", lat: 38, lng: 28 },
          { id: "rj", name: "Rio de Janeiro", country: "Brasil", flag: "🇧🇷", region: "sa-east-1", districts: DEFAULT_DISTRICTS, servers: makeServers("rj", "sa-east-1", 2, 15), population: 820, maxBuildings: 800, buildings: 195, color: "hsl(200 70% 50%)", lat: 40, lng: 30 },
          { id: "bh", name: "Belo Horizonte", country: "Brasil", flag: "🇧🇷", region: "sa-east-1", districts: DEFAULT_DISTRICTS.slice(0, 4), servers: makeServers("bh", "sa-east-1", 1, 18), population: 410, maxBuildings: 400, buildings: 98, color: "hsl(30 70% 50%)", lat: 37, lng: 29 },
          { id: "ct", name: "Curitiba", country: "Brasil", flag: "🇧🇷", region: "sa-east-1", districts: DEFAULT_DISTRICTS.slice(0, 4), servers: makeServers("ct", "sa-east-1", 1, 20), population: 350, maxBuildings: 350, buildings: 72, color: "hsl(160 60% 45%)", lat: 42, lng: 27 },
          { id: "bs", name: "Brasília", country: "Brasil", flag: "🇧🇷", region: "sa-east-1", districts: DEFAULT_DISTRICTS.slice(0, 4), servers: makeServers("bs", "sa-east-1", 1, 16), population: 380, maxBuildings: 400, buildings: 85, color: "hsl(45 70% 50%)", lat: 36, lng: 28 },
        ],
      },
      {
        id: "ar", name: "Argentina", flag: "🇦🇷", continent: "south-america",
        cities: [
          { id: "ba", name: "Buenos Aires", country: "Argentina", flag: "🇦🇷", region: "sa-east-1", districts: DEFAULT_DISTRICTS.slice(0, 4), servers: makeServers("ba", "sa-east-1", 2, 25), population: 580, maxBuildings: 600, buildings: 140, color: "hsl(210 60% 50%)", lat: 48, lng: 25 },
        ],
      },
    ],
  },
  {
    id: "north-america",
    name: "América do Norte",
    emoji: "🌎",
    countries: [
      {
        id: "us", name: "Estados Unidos", flag: "🇺🇸", continent: "north-america",
        cities: [
          { id: "ny", name: "New York", country: "EUA", flag: "🇺🇸", region: "us-east-1", districts: DEFAULT_DISTRICTS, servers: makeServers("ny", "us-east-1", 4, 45), population: 2891, maxBuildings: 2000, buildings: 890, color: "hsl(220 70% 50%)", lat: 30, lng: 26 },
          { id: "sf", name: "San Francisco", country: "EUA", flag: "🇺🇸", region: "us-west-1", districts: DEFAULT_DISTRICTS, servers: makeServers("sf", "us-west-1", 3, 55), population: 1450, maxBuildings: 1200, buildings: 520, color: "hsl(200 70% 50%)", lat: 30, lng: 15 },
          { id: "au", name: "Austin", country: "EUA", flag: "🇺🇸", region: "us-south-1", districts: DEFAULT_DISTRICTS.slice(0, 4), servers: makeServers("au", "us-south-1", 2, 40), population: 680, maxBuildings: 600, buildings: 165, color: "hsl(15 70% 50%)", lat: 33, lng: 19 },
          { id: "la", name: "Los Angeles", country: "EUA", flag: "🇺🇸", region: "us-west-1", districts: DEFAULT_DISTRICTS, servers: makeServers("la", "us-west-1", 3, 50), population: 1820, maxBuildings: 1500, buildings: 680, color: "hsl(340 60% 55%)", lat: 32, lng: 14 },
        ],
      },
      {
        id: "ca", name: "Canadá", flag: "🇨🇦", continent: "north-america",
        cities: [
          { id: "to", name: "Toronto", country: "Canadá", flag: "🇨🇦", region: "ca-central-1", districts: DEFAULT_DISTRICTS.slice(0, 4), servers: makeServers("to", "ca-central-1", 2, 50), population: 720, maxBuildings: 700, buildings: 180, color: "hsl(0 70% 50%)", lat: 27, lng: 23 },
        ],
      },
      {
        id: "mx", name: "México", flag: "🇲🇽", continent: "north-america",
        cities: [
          { id: "mc", name: "Cidade do México", country: "México", flag: "🇲🇽", region: "us-south-1", districts: DEFAULT_DISTRICTS.slice(0, 4), servers: makeServers("mc", "us-south-1", 2, 35), population: 560, maxBuildings: 600, buildings: 140, color: "hsl(15 80% 50%)", lat: 36, lng: 18 },
        ],
      },
    ],
  },
  {
    id: "europe",
    name: "Europa",
    emoji: "🌍",
    countries: [
      {
        id: "gb", name: "Reino Unido", flag: "🇬🇧", continent: "europe",
        cities: [
          { id: "ld", name: "London", country: "Reino Unido", flag: "🇬🇧", region: "eu-west-2", districts: DEFAULT_DISTRICTS, servers: makeServers("ld", "eu-west-2", 3, 95), population: 1120, maxBuildings: 1000, buildings: 320, color: "hsl(30 70% 50%)", lat: 25, lng: 48 },
        ],
      },
      {
        id: "de", name: "Alemanha", flag: "🇩🇪", continent: "europe",
        cities: [
          { id: "be", name: "Berlim", country: "Alemanha", flag: "🇩🇪", region: "eu-central-1", districts: DEFAULT_DISTRICTS.slice(0, 5), servers: makeServers("be", "eu-central-1", 2, 85), population: 780, maxBuildings: 700, buildings: 210, color: "hsl(0 0% 45%)", lat: 24, lng: 51 },
        ],
      },
      {
        id: "fr", name: "França", flag: "🇫🇷", continent: "europe",
        cities: [
          { id: "pa", name: "Paris", country: "França", flag: "🇫🇷", region: "eu-west-3", districts: DEFAULT_DISTRICTS, servers: makeServers("pa", "eu-west-3", 2, 90), population: 930, maxBuildings: 800, buildings: 290, color: "hsl(330 60% 55%)", lat: 27, lng: 49 },
        ],
      },
    ],
  },
  {
    id: "asia",
    name: "Ásia",
    emoji: "🌏",
    countries: [
      {
        id: "jp", name: "Japão", flag: "🇯🇵", continent: "asia",
        cities: [
          { id: "tk", name: "Tokyo", country: "Japão", flag: "🇯🇵", region: "ap-northeast-1", districts: DEFAULT_DISTRICTS, servers: makeServers("tk", "ap-northeast-1", 3, 180), population: 1583, maxBuildings: 1500, buildings: 445, color: "hsl(350 70% 50%)", lat: 32, lng: 78 },
        ],
      },
      {
        id: "kr", name: "Coreia do Sul", flag: "🇰🇷", continent: "asia",
        cities: [
          { id: "se", name: "Seoul", country: "Coreia do Sul", flag: "🇰🇷", region: "ap-northeast-2", districts: DEFAULT_DISTRICTS.slice(0, 5), servers: makeServers("se", "ap-northeast-2", 2, 190), population: 980, maxBuildings: 800, buildings: 275, color: "hsl(270 70% 55%)", lat: 30, lng: 75 },
        ],
      },
      {
        id: "sg", name: "Singapura", flag: "🇸🇬", continent: "asia",
        cities: [
          { id: "sg", name: "Singapore", country: "Singapura", flag: "🇸🇬", region: "ap-southeast-1", districts: DEFAULT_DISTRICTS.slice(0, 4), servers: makeServers("sg", "ap-southeast-1", 2, 160), population: 820, maxBuildings: 700, buildings: 230, color: "hsl(280 70% 55%)", lat: 48, lng: 70 },
        ],
      },
    ],
  },
  {
    id: "middle-east",
    name: "Oriente Médio",
    emoji: "🌍",
    countries: [
      {
        id: "ae", name: "Emirados Árabes", flag: "🇦🇪", continent: "middle-east",
        cities: [
          { id: "db", name: "Dubai", country: "Emirados", flag: "🇦🇪", region: "me-south-1", districts: DEFAULT_DISTRICTS, servers: makeServers("db", "me-south-1", 2, 120), population: 650, maxBuildings: 500, buildings: 180, color: "hsl(45 80% 50%)", lat: 34, lng: 57 },
        ],
      },
    ],
  },
  {
    id: "oceania",
    name: "Oceania",
    emoji: "🌏",
    countries: [
      {
        id: "au", name: "Austrália", flag: "🇦🇺", continent: "oceania",
        cities: [
          { id: "sy", name: "Sydney", country: "Austrália", flag: "🇦🇺", region: "ap-southeast-2", districts: DEFAULT_DISTRICTS.slice(0, 4), servers: makeServers("sy", "ap-southeast-2", 2, 200), population: 420, maxBuildings: 500, buildings: 110, color: "hsl(50 70% 50%)", lat: 58, lng: 82 },
        ],
      },
    ],
  },
  {
    id: "africa",
    name: "África",
    emoji: "🌍",
    countries: [
      {
        id: "za", name: "África do Sul", flag: "🇿🇦", continent: "africa",
        cities: [
          { id: "jb", name: "Joanesburgo", country: "África do Sul", flag: "🇿🇦", region: "af-south-1", districts: DEFAULT_DISTRICTS.slice(0, 4), servers: makeServers("jb", "af-south-1", 1, 150), population: 280, maxBuildings: 300, buildings: 65, color: "hsl(120 50% 40%)", lat: 55, lng: 54 },
        ],
      },
      {
        id: "ng", name: "Nigéria", flag: "🇳🇬", continent: "africa",
        cities: [
          { id: "lg", name: "Lagos", country: "Nigéria", flag: "🇳🇬", region: "af-south-1", districts: DEFAULT_DISTRICTS.slice(0, 3), servers: makeServers("lg", "af-south-1", 1, 140), population: 340, maxBuildings: 350, buildings: 78, color: "hsl(100 60% 40%)", lat: 42, lng: 50 },
        ],
      },
    ],
  },
];

// Utility: get all cities flat
export function getAllCities(): City[] {
  return WORLD_DATA.flatMap(c => c.countries.flatMap(co => co.cities));
}

// Utility: get city by ID
export function getCityById(id: string): City | undefined {
  return getAllCities().find(c => c.id === id);
}

// Utility: get best server for a city
export function getBestServer(cityId: string): ServerShard | undefined {
  const city = getCityById(cityId);
  if (!city) return undefined;
  return city.servers
    .filter(s => s.status === "online" && s.population < s.maxPopulation)
    .sort((a, b) => a.ping - b.ping)[0];
}
