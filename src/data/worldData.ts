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

const SMALL_DISTRICTS = DEFAULT_DISTRICTS.slice(0, 4);
const MINI_DISTRICTS = DEFAULT_DISTRICTS.slice(0, 3);

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

// Helper to create cities concisely
function city(id: string, name: string, country: string, flag: string, region: string, pop: number, maxB: number, bld: number, color: string, lat: number, lng: number, districts = SMALL_DISTRICTS, servers = 1, basePing = 100): City {
  return { id, name, country, flag, region, districts, servers: makeServers(id, region, servers, basePing), population: pop, maxBuildings: maxB, buildings: bld, color, lat, lng };
}

export const WORLD_DATA: Continent[] = [
  // ── SOUTH AMERICA ──
  {
    id: "south-america", name: "América do Sul", emoji: "🌎",
    countries: [
      {
        id: "br", name: "Brasil", flag: "🇧🇷", continent: "south-america",
        cities: [
          city("sp", "São Paulo", "Brasil", "🇧🇷", "sa-east-1", 1247, 1000, 312, "hsl(142 70% 45%)", 38, 28, DEFAULT_DISTRICTS, 3, 12),
          city("rj", "Rio de Janeiro", "Brasil", "🇧🇷", "sa-east-1", 820, 800, 195, "hsl(200 70% 50%)", 40, 30, DEFAULT_DISTRICTS, 2, 15),
          city("bh", "Belo Horizonte", "Brasil", "🇧🇷", "sa-east-1", 410, 400, 98, "hsl(30 70% 50%)", 37, 29, SMALL_DISTRICTS, 1, 18),
          city("ct", "Curitiba", "Brasil", "🇧🇷", "sa-east-1", 350, 350, 72, "hsl(160 60% 45%)", 42, 27, SMALL_DISTRICTS, 1, 20),
          city("bs", "Brasília", "Brasil", "🇧🇷", "sa-east-1", 380, 400, 85, "hsl(45 70% 50%)", 36, 28, SMALL_DISTRICTS, 1, 16),
          city("poa", "Porto Alegre", "Brasil", "🇧🇷", "sa-east-1", 280, 300, 65, "hsl(180 60% 45%)", 44, 27, SMALL_DISTRICTS, 1, 22),
          city("rec", "Recife", "Brasil", "🇧🇷", "sa-east-1", 310, 350, 70, "hsl(20 70% 50%)", 34, 32, SMALL_DISTRICTS, 1, 20),
          city("for", "Fortaleza", "Brasil", "🇧🇷", "sa-east-1", 290, 300, 62, "hsl(35 75% 50%)", 33, 31, SMALL_DISTRICTS, 1, 22),
          city("sal", "Salvador", "Brasil", "🇧🇷", "sa-east-1", 340, 350, 75, "hsl(10 65% 50%)", 35, 31, SMALL_DISTRICTS, 1, 19),
          city("man", "Manaus", "Brasil", "🇧🇷", "sa-east-1", 180, 200, 35, "hsl(120 60% 40%)", 33, 25, MINI_DISTRICTS, 1, 25),
          city("goi", "Goiânia", "Brasil", "🇧🇷", "sa-east-1", 220, 250, 48, "hsl(55 65% 45%)", 37, 27, MINI_DISTRICTS, 1, 19),
          city("cam", "Campinas", "Brasil", "🇧🇷", "sa-east-1", 260, 300, 55, "hsl(150 55% 45%)", 39, 28, SMALL_DISTRICTS, 1, 14),
          city("flo", "Florianópolis", "Brasil", "🇧🇷", "sa-east-1", 200, 250, 45, "hsl(190 65% 50%)", 43, 27, SMALL_DISTRICTS, 1, 21),
        ],
      },
      {
        id: "ar", name: "Argentina", flag: "🇦🇷", continent: "south-america",
        cities: [
          city("ba", "Buenos Aires", "Argentina", "🇦🇷", "sa-east-1", 580, 600, 140, "hsl(210 60% 50%)", 48, 25, SMALL_DISTRICTS, 2, 25),
          city("cor", "Córdoba", "Argentina", "🇦🇷", "sa-east-1", 220, 250, 48, "hsl(30 55% 50%)", 46, 24, MINI_DISTRICTS, 1, 28),
          city("ros", "Rosário", "Argentina", "🇦🇷", "sa-east-1", 180, 200, 38, "hsl(15 60% 50%)", 47, 24, MINI_DISTRICTS, 1, 27),
          city("mdz", "Mendoza", "Argentina", "🇦🇷", "sa-east-1", 150, 200, 30, "hsl(280 50% 50%)", 47, 22, MINI_DISTRICTS, 1, 30),
        ],
      },
      {
        id: "co", name: "Colômbia", flag: "🇨🇴", continent: "south-america",
        cities: [
          city("bog", "Bogotá", "Colômbia", "🇨🇴", "sa-east-1", 450, 500, 110, "hsl(50 70% 50%)", 34, 22, SMALL_DISTRICTS, 2, 30),
          city("med", "Medellín", "Colômbia", "🇨🇴", "sa-east-1", 280, 300, 65, "hsl(25 65% 50%)", 33, 22, MINI_DISTRICTS, 1, 32),
          city("cal", "Cali", "Colômbia", "🇨🇴", "sa-east-1", 200, 250, 45, "hsl(120 55% 45%)", 35, 21, MINI_DISTRICTS, 1, 33),
        ],
      },
      {
        id: "cl", name: "Chile", flag: "🇨🇱", continent: "south-america",
        cities: [
          city("scl", "Santiago", "Chile", "🇨🇱", "sa-east-1", 380, 400, 90, "hsl(0 60% 50%)", 47, 21, SMALL_DISTRICTS, 2, 28),
          city("val", "Valparaíso", "Chile", "🇨🇱", "sa-east-1", 140, 200, 28, "hsl(220 55% 50%)", 47, 20, MINI_DISTRICTS, 1, 30),
        ],
      },
      {
        id: "pe", name: "Peru", flag: "🇵🇪", continent: "south-america",
        cities: [
          city("lim", "Lima", "Peru", "🇵🇪", "sa-east-1", 350, 400, 80, "hsl(40 65% 50%)", 39, 20, SMALL_DISTRICTS, 1, 35),
        ],
      },
      {
        id: "uy", name: "Uruguai", flag: "🇺🇾", continent: "south-america",
        cities: [
          city("mvd", "Montevidéu", "Uruguai", "🇺🇾", "sa-east-1", 180, 200, 40, "hsl(210 55% 50%)", 48, 26, MINI_DISTRICTS, 1, 26),
        ],
      },
      {
        id: "ec", name: "Equador", flag: "🇪🇨", continent: "south-america",
        cities: [
          city("uio", "Quito", "Equador", "🇪🇨", "sa-east-1", 200, 250, 42, "hsl(55 60% 50%)", 37, 20, MINI_DISTRICTS, 1, 35),
        ],
      },
      {
        id: "ve", name: "Venezuela", flag: "🇻🇪", continent: "south-america",
        cities: [
          city("ccs", "Caracas", "Venezuela", "🇻🇪", "sa-east-1", 220, 250, 45, "hsl(45 65% 50%)", 33, 23, MINI_DISTRICTS, 1, 33),
        ],
      },
      {
        id: "bo", name: "Bolívia", flag: "🇧🇴", continent: "south-america",
        cities: [
          city("lpb", "La Paz", "Bolívia", "🇧🇴", "sa-east-1", 150, 200, 28, "hsl(30 50% 45%)", 40, 22, MINI_DISTRICTS, 1, 38),
        ],
      },
      {
        id: "py", name: "Paraguai", flag: "🇵🇾", continent: "south-america",
        cities: [
          city("asu", "Assunção", "Paraguai", "🇵🇾", "sa-east-1", 140, 200, 25, "hsl(0 55% 50%)", 42, 25, MINI_DISTRICTS, 1, 28),
        ],
      },
    ],
  },

  // ── NORTH AMERICA ──
  {
    id: "north-america", name: "América do Norte", emoji: "🌎",
    countries: [
      {
        id: "us", name: "Estados Unidos", flag: "🇺🇸", continent: "north-america",
        cities: [
          city("ny", "New York", "EUA", "🇺🇸", "us-east-1", 2891, 2000, 890, "hsl(220 70% 50%)", 30, 26, DEFAULT_DISTRICTS, 4, 45),
          city("sf", "San Francisco", "EUA", "🇺🇸", "us-west-1", 1450, 1200, 520, "hsl(200 70% 50%)", 30, 15, DEFAULT_DISTRICTS, 3, 55),
          city("la", "Los Angeles", "EUA", "🇺🇸", "us-west-1", 1820, 1500, 680, "hsl(340 60% 55%)", 32, 14, DEFAULT_DISTRICTS, 3, 50),
          city("au-tx", "Austin", "EUA", "🇺🇸", "us-south-1", 680, 600, 165, "hsl(15 70% 50%)", 33, 19, SMALL_DISTRICTS, 2, 40),
          city("chi", "Chicago", "EUA", "🇺🇸", "us-east-1", 920, 800, 280, "hsl(210 55% 50%)", 28, 21, DEFAULT_DISTRICTS, 2, 42),
          city("mia", "Miami", "EUA", "🇺🇸", "us-east-1", 750, 700, 210, "hsl(180 65% 50%)", 34, 23, SMALL_DISTRICTS, 2, 38),
          city("sea", "Seattle", "EUA", "🇺🇸", "us-west-1", 680, 600, 195, "hsl(150 60% 45%)", 25, 14, SMALL_DISTRICTS, 2, 52),
          city("bos", "Boston", "EUA", "🇺🇸", "us-east-1", 520, 500, 145, "hsl(0 50% 45%)", 28, 27, SMALL_DISTRICTS, 2, 43),
          city("den", "Denver", "EUA", "🇺🇸", "us-west-1", 420, 400, 110, "hsl(30 60% 50%)", 29, 17, SMALL_DISTRICTS, 1, 48),
          city("atl", "Atlanta", "EUA", "🇺🇸", "us-east-1", 480, 500, 130, "hsl(15 55% 50%)", 32, 22, SMALL_DISTRICTS, 1, 40),
          city("dal", "Dallas", "EUA", "🇺🇸", "us-south-1", 450, 450, 120, "hsl(220 50% 50%)", 32, 19, SMALL_DISTRICTS, 1, 42),
          city("pdx", "Portland", "EUA", "🇺🇸", "us-west-1", 320, 350, 85, "hsl(160 55% 45%)", 26, 14, MINI_DISTRICTS, 1, 53),
          city("nas", "Nashville", "EUA", "🇺🇸", "us-east-1", 280, 300, 70, "hsl(45 60% 50%)", 31, 21, MINI_DISTRICTS, 1, 41),
          city("phx", "Phoenix", "EUA", "🇺🇸", "us-west-1", 350, 400, 90, "hsl(25 70% 55%)", 32, 15, MINI_DISTRICTS, 1, 50),
          city("det", "Detroit", "EUA", "🇺🇸", "us-east-1", 260, 300, 60, "hsl(210 45% 45%)", 28, 22, MINI_DISTRICTS, 1, 43),
          city("dc", "Washington D.C.", "EUA", "🇺🇸", "us-east-1", 580, 500, 160, "hsl(0 40% 45%)", 30, 24, SMALL_DISTRICTS, 2, 44),
        ],
      },
      {
        id: "ca", name: "Canadá", flag: "🇨🇦", continent: "north-america",
        cities: [
          city("to", "Toronto", "Canadá", "🇨🇦", "ca-central-1", 720, 700, 180, "hsl(0 70% 50%)", 27, 23, SMALL_DISTRICTS, 2, 50),
          city("van", "Vancouver", "Canadá", "🇨🇦", "ca-central-1", 450, 500, 120, "hsl(170 60% 45%)", 24, 14, SMALL_DISTRICTS, 1, 55),
          city("mtl", "Montreal", "Canadá", "🇨🇦", "ca-central-1", 380, 400, 95, "hsl(220 55% 50%)", 26, 24, SMALL_DISTRICTS, 1, 52),
          city("ott", "Ottawa", "Canadá", "🇨🇦", "ca-central-1", 250, 300, 60, "hsl(0 50% 45%)", 26, 23, MINI_DISTRICTS, 1, 51),
          city("cal-ca", "Calgary", "Canadá", "🇨🇦", "ca-central-1", 220, 250, 50, "hsl(200 50% 45%)", 24, 16, MINI_DISTRICTS, 1, 54),
        ],
      },
      {
        id: "mx", name: "México", flag: "🇲🇽", continent: "north-america",
        cities: [
          city("mc", "Cidade do México", "México", "🇲🇽", "us-south-1", 560, 600, 140, "hsl(15 80% 50%)", 36, 18, SMALL_DISTRICTS, 2, 35),
          city("gdl", "Guadalajara", "México", "🇲🇽", "us-south-1", 280, 300, 65, "hsl(40 70% 50%)", 36, 17, MINI_DISTRICTS, 1, 37),
          city("mty", "Monterrey", "México", "🇲🇽", "us-south-1", 250, 300, 58, "hsl(210 55% 50%)", 34, 18, MINI_DISTRICTS, 1, 36),
          city("can", "Cancún", "México", "🇲🇽", "us-south-1", 180, 250, 38, "hsl(180 70% 50%)", 36, 20, MINI_DISTRICTS, 1, 38),
        ],
      },
    ],
  },

  // ── EUROPE ──
  {
    id: "europe", name: "Europa", emoji: "🌍",
    countries: [
      {
        id: "gb", name: "Reino Unido", flag: "🇬🇧", continent: "europe",
        cities: [
          city("ld", "London", "Reino Unido", "🇬🇧", "eu-west-2", 1120, 1000, 320, "hsl(30 70% 50%)", 25, 48, DEFAULT_DISTRICTS, 3, 95),
          city("man-uk", "Manchester", "Reino Unido", "🇬🇧", "eu-west-2", 380, 400, 90, "hsl(0 55% 50%)", 24, 48, SMALL_DISTRICTS, 1, 97),
          city("edi", "Edinburgh", "Reino Unido", "🇬🇧", "eu-west-2", 250, 300, 60, "hsl(220 50% 45%)", 22, 48, MINI_DISTRICTS, 1, 98),
        ],
      },
      {
        id: "de", name: "Alemanha", flag: "🇩🇪", continent: "europe",
        cities: [
          city("be", "Berlim", "Alemanha", "🇩🇪", "eu-central-1", 780, 700, 210, "hsl(0 0% 45%)", 24, 51, DEFAULT_DISTRICTS.slice(0, 5), 2, 85),
          city("mun", "Munique", "Alemanha", "🇩🇪", "eu-central-1", 420, 400, 110, "hsl(210 50% 50%)", 26, 52, SMALL_DISTRICTS, 1, 87),
          city("ham", "Hamburgo", "Alemanha", "🇩🇪", "eu-central-1", 320, 350, 80, "hsl(15 55% 50%)", 23, 51, SMALL_DISTRICTS, 1, 86),
          city("fra", "Frankfurt", "Alemanha", "🇩🇪", "eu-central-1", 350, 350, 90, "hsl(200 55% 50%)", 25, 51, SMALL_DISTRICTS, 1, 86),
        ],
      },
      {
        id: "fr", name: "França", flag: "🇫🇷", continent: "europe",
        cities: [
          city("pa", "Paris", "França", "🇫🇷", "eu-west-3", 930, 800, 290, "hsl(330 60% 55%)", 27, 49, DEFAULT_DISTRICTS, 2, 90),
          city("lyo", "Lyon", "França", "🇫🇷", "eu-west-3", 280, 300, 65, "hsl(210 55% 50%)", 28, 50, MINI_DISTRICTS, 1, 92),
          city("mrs", "Marseille", "França", "🇫🇷", "eu-west-3", 250, 300, 58, "hsl(200 60% 50%)", 29, 50, MINI_DISTRICTS, 1, 93),
          city("nic", "Nice", "França", "🇫🇷", "eu-west-3", 180, 200, 40, "hsl(190 65% 50%)", 29, 51, MINI_DISTRICTS, 1, 93),
        ],
      },
      {
        id: "es", name: "Espanha", flag: "🇪🇸", continent: "europe",
        cities: [
          city("mad", "Madrid", "Espanha", "🇪🇸", "eu-south-1", 650, 600, 180, "hsl(0 65% 50%)", 30, 47, DEFAULT_DISTRICTS, 2, 92),
          city("bcn", "Barcelona", "Espanha", "🇪🇸", "eu-south-1", 520, 500, 140, "hsl(210 60% 50%)", 29, 49, SMALL_DISTRICTS, 2, 93),
          city("vlc", "Valência", "Espanha", "🇪🇸", "eu-south-1", 250, 300, 55, "hsl(25 60% 50%)", 30, 48, MINI_DISTRICTS, 1, 94),
          city("sev", "Sevilha", "Espanha", "🇪🇸", "eu-south-1", 220, 250, 48, "hsl(40 65% 50%)", 31, 46, MINI_DISTRICTS, 1, 95),
        ],
      },
      {
        id: "it", name: "Itália", flag: "🇮🇹", continent: "europe",
        cities: [
          city("rom", "Roma", "Itália", "🇮🇹", "eu-south-1", 580, 500, 160, "hsl(30 55% 50%)", 29, 52, SMALL_DISTRICTS, 2, 90),
          city("mil", "Milão", "Itália", "🇮🇹", "eu-south-1", 450, 400, 120, "hsl(220 50% 50%)", 28, 51, SMALL_DISTRICTS, 1, 88),
          city("fir", "Florença", "Itália", "🇮🇹", "eu-south-1", 200, 250, 45, "hsl(15 60% 50%)", 29, 52, MINI_DISTRICTS, 1, 91),
        ],
      },
      {
        id: "pt", name: "Portugal", flag: "🇵🇹", continent: "europe",
        cities: [
          city("lis", "Lisboa", "Portugal", "🇵🇹", "eu-west-1", 420, 400, 110, "hsl(200 55% 50%)", 30, 45, SMALL_DISTRICTS, 2, 95),
          city("opo", "Porto", "Portugal", "🇵🇹", "eu-west-1", 250, 300, 60, "hsl(220 50% 45%)", 29, 45, MINI_DISTRICTS, 1, 96),
        ],
      },
      {
        id: "nl", name: "Holanda", flag: "🇳🇱", continent: "europe",
        cities: [
          city("ams", "Amsterdam", "Holanda", "🇳🇱", "eu-west-1", 580, 500, 155, "hsl(25 60% 50%)", 24, 50, SMALL_DISTRICTS, 2, 88),
          city("rot", "Rotterdam", "Holanda", "🇳🇱", "eu-west-1", 220, 250, 50, "hsl(200 55% 50%)", 25, 50, MINI_DISTRICTS, 1, 89),
        ],
      },
      {
        id: "se", name: "Suécia", flag: "🇸🇪", continent: "europe",
        cities: [
          city("sto", "Estocolmo", "Suécia", "🇸🇪", "eu-north-1", 380, 400, 95, "hsl(210 60% 50%)", 20, 52, SMALL_DISTRICTS, 1, 92),
        ],
      },
      {
        id: "no", name: "Noruega", flag: "🇳🇴", continent: "europe",
        cities: [
          city("osl", "Oslo", "Noruega", "🇳🇴", "eu-north-1", 280, 300, 65, "hsl(210 50% 45%)", 19, 51, MINI_DISTRICTS, 1, 94),
        ],
      },
      {
        id: "dk", name: "Dinamarca", flag: "🇩🇰", continent: "europe",
        cities: [
          city("cph", "Copenhague", "Dinamarca", "🇩🇰", "eu-north-1", 320, 350, 80, "hsl(0 55% 50%)", 22, 52, SMALL_DISTRICTS, 1, 90),
        ],
      },
      {
        id: "fi", name: "Finlândia", flag: "🇫🇮", continent: "europe",
        cities: [
          city("hel", "Helsinque", "Finlândia", "🇫🇮", "eu-north-1", 250, 300, 55, "hsl(220 55% 50%)", 19, 54, MINI_DISTRICTS, 1, 95),
        ],
      },
      {
        id: "ch", name: "Suíça", flag: "🇨🇭", continent: "europe",
        cities: [
          city("zur", "Zurique", "Suíça", "🇨🇭", "eu-central-1", 350, 350, 90, "hsl(0 55% 50%)", 26, 51, SMALL_DISTRICTS, 1, 87),
          city("gen", "Genebra", "Suíça", "🇨🇭", "eu-central-1", 220, 250, 50, "hsl(210 50% 50%)", 27, 50, MINI_DISTRICTS, 1, 88),
        ],
      },
      {
        id: "at", name: "Áustria", flag: "🇦🇹", continent: "europe",
        cities: [
          city("vie", "Viena", "Áustria", "🇦🇹", "eu-central-1", 320, 350, 80, "hsl(0 45% 50%)", 26, 53, SMALL_DISTRICTS, 1, 87),
        ],
      },
      {
        id: "be-c", name: "Bélgica", flag: "🇧🇪", continent: "europe",
        cities: [
          city("bru", "Bruxelas", "Bélgica", "🇧🇪", "eu-west-1", 280, 300, 65, "hsl(45 55% 50%)", 25, 50, MINI_DISTRICTS, 1, 89),
        ],
      },
      {
        id: "ie", name: "Irlanda", flag: "🇮🇪", continent: "europe",
        cities: [
          city("dub", "Dublin", "Irlanda", "🇮🇪", "eu-west-1", 350, 350, 90, "hsl(142 55% 45%)", 24, 46, SMALL_DISTRICTS, 1, 94),
        ],
      },
      {
        id: "pl", name: "Polônia", flag: "🇵🇱", continent: "europe",
        cities: [
          city("waw", "Varsóvia", "Polônia", "🇵🇱", "eu-central-1", 380, 400, 95, "hsl(0 60% 50%)", 24, 54, SMALL_DISTRICTS, 1, 90),
          city("krk", "Cracóvia", "Polônia", "🇵🇱", "eu-central-1", 220, 250, 50, "hsl(210 45% 50%)", 25, 54, MINI_DISTRICTS, 1, 91),
        ],
      },
      {
        id: "cz", name: "República Tcheca", flag: "🇨🇿", continent: "europe",
        cities: [
          city("prg", "Praga", "República Tcheca", "🇨🇿", "eu-central-1", 320, 350, 80, "hsl(45 50% 50%)", 25, 52, SMALL_DISTRICTS, 1, 88),
        ],
      },
      {
        id: "ro", name: "Romênia", flag: "🇷🇴", continent: "europe",
        cities: [
          city("buc", "Bucareste", "Romênia", "🇷🇴", "eu-central-1", 280, 300, 65, "hsl(210 55% 50%)", 28, 55, MINI_DISTRICTS, 1, 92),
        ],
      },
      {
        id: "gr", name: "Grécia", flag: "🇬🇷", continent: "europe",
        cities: [
          city("ath", "Atenas", "Grécia", "🇬🇷", "eu-south-1", 250, 300, 55, "hsl(210 60% 50%)", 30, 55, MINI_DISTRICTS, 1, 95),
        ],
      },
      {
        id: "ua", name: "Ucrânia", flag: "🇺🇦", continent: "europe",
        cities: [
          city("kiv", "Kyiv", "Ucrânia", "🇺🇦", "eu-central-1", 350, 400, 85, "hsl(50 55% 50%)", 25, 56, SMALL_DISTRICTS, 1, 95),
        ],
      },
      {
        id: "hu", name: "Hungria", flag: "🇭🇺", continent: "europe",
        cities: [
          city("bud", "Budapeste", "Hungria", "🇭🇺", "eu-central-1", 280, 300, 65, "hsl(0 50% 50%)", 26, 54, MINI_DISTRICTS, 1, 90),
        ],
      },
    ],
  },

  // ── ASIA ──
  {
    id: "asia", name: "Ásia", emoji: "🌏",
    countries: [
      {
        id: "jp", name: "Japão", flag: "🇯🇵", continent: "asia",
        cities: [
          city("tk", "Tokyo", "Japão", "🇯🇵", "ap-northeast-1", 1583, 1500, 445, "hsl(350 70% 50%)", 32, 78, DEFAULT_DISTRICTS, 3, 180),
          city("osa", "Osaka", "Japão", "🇯🇵", "ap-northeast-1", 620, 600, 170, "hsl(15 60% 50%)", 33, 77, SMALL_DISTRICTS, 2, 182),
          city("kyo", "Kyoto", "Japão", "🇯🇵", "ap-northeast-1", 280, 300, 65, "hsl(330 50% 50%)", 33, 77, MINI_DISTRICTS, 1, 183),
          city("fuk", "Fukuoka", "Japão", "🇯🇵", "ap-northeast-1", 220, 250, 50, "hsl(200 55% 50%)", 34, 76, MINI_DISTRICTS, 1, 184),
        ],
      },
      {
        id: "kr", name: "Coreia do Sul", flag: "🇰🇷", continent: "asia",
        cities: [
          city("sel", "Seoul", "Coreia do Sul", "🇰🇷", "ap-northeast-2", 980, 800, 275, "hsl(270 70% 55%)", 30, 75, DEFAULT_DISTRICTS.slice(0, 5), 2, 190),
          city("bus", "Busan", "Coreia do Sul", "🇰🇷", "ap-northeast-2", 320, 350, 80, "hsl(200 60% 50%)", 32, 76, MINI_DISTRICTS, 1, 192),
        ],
      },
      {
        id: "cn", name: "China", flag: "🇨🇳", continent: "asia",
        cities: [
          city("sha", "Shanghai", "China", "🇨🇳", "ap-east-1", 1200, 1000, 380, "hsl(0 60% 50%)", 34, 73, DEFAULT_DISTRICTS, 3, 200),
          city("bei", "Beijing", "China", "🇨🇳", "ap-east-1", 980, 900, 310, "hsl(45 55% 50%)", 30, 72, DEFAULT_DISTRICTS, 3, 205),
          city("shen", "Shenzhen", "China", "🇨🇳", "ap-east-1", 850, 800, 260, "hsl(210 60% 50%)", 38, 72, SMALL_DISTRICTS, 2, 198),
          city("gua", "Guangzhou", "China", "🇨🇳", "ap-east-1", 720, 700, 220, "hsl(142 50% 45%)", 38, 71, SMALL_DISTRICTS, 2, 200),
          city("hk", "Hong Kong", "China", "🇭🇰", "ap-east-1", 580, 500, 165, "hsl(350 60% 50%)", 38, 72, SMALL_DISTRICTS, 2, 195),
          city("chd", "Chengdu", "China", "🇨🇳", "ap-east-1", 450, 450, 120, "hsl(120 50% 45%)", 35, 69, SMALL_DISTRICTS, 1, 208),
          city("hzh", "Hangzhou", "China", "🇨🇳", "ap-east-1", 520, 500, 145, "hsl(180 55% 50%)", 35, 73, SMALL_DISTRICTS, 1, 202),
        ],
      },
      {
        id: "tw", name: "Taiwan", flag: "🇹🇼", continent: "asia",
        cities: [
          city("tpe", "Taipei", "Taiwan", "🇹🇼", "ap-northeast-1", 420, 400, 110, "hsl(210 55% 50%)", 36, 74, SMALL_DISTRICTS, 1, 190),
        ],
      },
      {
        id: "sg-c", name: "Singapura", flag: "🇸🇬", continent: "asia",
        cities: [
          city("sgp", "Singapore", "Singapura", "🇸🇬", "ap-southeast-1", 820, 700, 230, "hsl(280 70% 55%)", 48, 70, SMALL_DISTRICTS, 2, 160),
        ],
      },
      {
        id: "in", name: "Índia", flag: "🇮🇳", continent: "asia",
        cities: [
          city("mum", "Mumbai", "Índia", "🇮🇳", "ap-south-1", 780, 700, 220, "hsl(25 60% 50%)", 37, 63, DEFAULT_DISTRICTS, 2, 140),
          city("blr", "Bangalore", "Índia", "🇮🇳", "ap-south-1", 850, 800, 250, "hsl(142 60% 45%)", 40, 64, DEFAULT_DISTRICTS, 2, 145),
          city("del", "Delhi", "Índia", "🇮🇳", "ap-south-1", 680, 600, 190, "hsl(30 55% 50%)", 34, 64, SMALL_DISTRICTS, 2, 142),
          city("hyd", "Hyderabad", "Índia", "🇮🇳", "ap-south-1", 520, 500, 140, "hsl(280 50% 50%)", 38, 65, SMALL_DISTRICTS, 1, 143),
          city("che", "Chennai", "Índia", "🇮🇳", "ap-south-1", 420, 400, 110, "hsl(200 55% 50%)", 40, 65, SMALL_DISTRICTS, 1, 144),
          city("pun", "Pune", "Índia", "🇮🇳", "ap-south-1", 380, 400, 95, "hsl(45 50% 50%)", 38, 63, MINI_DISTRICTS, 1, 142),
        ],
      },
      {
        id: "th", name: "Tailândia", flag: "🇹🇭", continent: "asia",
        cities: [
          city("bkk", "Bangkok", "Tailândia", "🇹🇭", "ap-southeast-1", 520, 500, 140, "hsl(45 70% 50%)", 40, 68, SMALL_DISTRICTS, 2, 155),
          city("cnx", "Chiang Mai", "Tailândia", "🇹🇭", "ap-southeast-1", 220, 250, 48, "hsl(120 55% 45%)", 38, 67, MINI_DISTRICTS, 1, 158),
        ],
      },
      {
        id: "vn", name: "Vietnã", flag: "🇻🇳", continent: "asia",
        cities: [
          city("hcm", "Ho Chi Minh", "Vietnã", "🇻🇳", "ap-southeast-1", 380, 400, 95, "hsl(0 55% 50%)", 42, 70, SMALL_DISTRICTS, 1, 160),
          city("han", "Hanói", "Vietnã", "🇻🇳", "ap-southeast-1", 280, 300, 65, "hsl(45 55% 50%)", 37, 70, MINI_DISTRICTS, 1, 162),
        ],
      },
      {
        id: "id", name: "Indonésia", flag: "🇮🇩", continent: "asia",
        cities: [
          city("jkt", "Jakarta", "Indonésia", "🇮🇩", "ap-southeast-1", 480, 500, 130, "hsl(0 60% 50%)", 46, 70, SMALL_DISTRICTS, 1, 165),
          city("bli", "Bali", "Indonésia", "🇮🇩", "ap-southeast-1", 280, 300, 60, "hsl(160 60% 50%)", 46, 72, MINI_DISTRICTS, 1, 168),
        ],
      },
      {
        id: "my", name: "Malásia", flag: "🇲🇾", continent: "asia",
        cities: [
          city("kul", "Kuala Lumpur", "Malásia", "🇲🇾", "ap-southeast-1", 420, 400, 110, "hsl(210 55% 50%)", 44, 69, SMALL_DISTRICTS, 1, 158),
        ],
      },
      {
        id: "ph", name: "Filipinas", flag: "🇵🇭", continent: "asia",
        cities: [
          city("mnl", "Manila", "Filipinas", "🇵🇭", "ap-southeast-1", 380, 400, 90, "hsl(30 60% 50%)", 40, 74, SMALL_DISTRICTS, 1, 165),
        ],
      },
      {
        id: "pk", name: "Paquistão", flag: "🇵🇰", continent: "asia",
        cities: [
          city("khi", "Karachi", "Paquistão", "🇵🇰", "ap-south-1", 320, 350, 75, "hsl(142 45% 45%)", 36, 61, MINI_DISTRICTS, 1, 150),
          city("lhe", "Lahore", "Paquistão", "🇵🇰", "ap-south-1", 280, 300, 60, "hsl(30 50% 50%)", 34, 63, MINI_DISTRICTS, 1, 152),
        ],
      },
      {
        id: "bd", name: "Bangladesh", flag: "🇧🇩", continent: "asia",
        cities: [
          city("dac", "Dhaka", "Bangladesh", "🇧🇩", "ap-south-1", 350, 350, 80, "hsl(142 55% 45%)", 38, 66, MINI_DISTRICTS, 1, 148),
        ],
      },
    ],
  },

  // ── MIDDLE EAST ──
  {
    id: "middle-east", name: "Oriente Médio", emoji: "🌍",
    countries: [
      {
        id: "ae", name: "Emirados Árabes", flag: "🇦🇪", continent: "middle-east",
        cities: [
          city("db", "Dubai", "Emirados", "🇦🇪", "me-south-1", 650, 500, 180, "hsl(45 80% 50%)", 34, 57, DEFAULT_DISTRICTS, 2, 120),
          city("auh", "Abu Dhabi", "Emirados", "🇦🇪", "me-south-1", 320, 350, 80, "hsl(30 65% 50%)", 35, 57, SMALL_DISTRICTS, 1, 122),
        ],
      },
      {
        id: "sa", name: "Arábia Saudita", flag: "🇸🇦", continent: "middle-east",
        cities: [
          city("ruh", "Riad", "Arábia Saudita", "🇸🇦", "me-south-1", 420, 450, 110, "hsl(40 70% 50%)", 36, 58, SMALL_DISTRICTS, 1, 125),
          city("jed", "Jeddah", "Arábia Saudita", "🇸🇦", "me-south-1", 280, 300, 65, "hsl(200 50% 50%)", 37, 56, MINI_DISTRICTS, 1, 128),
        ],
      },
      {
        id: "il", name: "Israel", flag: "🇮🇱", continent: "middle-east",
        cities: [
          city("tlv", "Tel Aviv", "Israel", "🇮🇱", "me-south-1", 520, 500, 150, "hsl(210 65% 50%)", 32, 56, SMALL_DISTRICTS, 2, 110),
        ],
      },
      {
        id: "tr", name: "Turquia", flag: "🇹🇷", continent: "middle-east",
        cities: [
          city("ist", "Istambul", "Turquia", "🇹🇷", "eu-central-1", 580, 500, 160, "hsl(0 55% 50%)", 29, 55, SMALL_DISTRICTS, 2, 100),
          city("ank", "Ancara", "Turquia", "🇹🇷", "eu-central-1", 280, 300, 65, "hsl(45 50% 50%)", 30, 56, MINI_DISTRICTS, 1, 102),
        ],
      },
      {
        id: "qa", name: "Catar", flag: "🇶🇦", continent: "middle-east",
        cities: [
          city("doh", "Doha", "Catar", "🇶🇦", "me-south-1", 280, 300, 70, "hsl(30 60% 50%)", 36, 58, MINI_DISTRICTS, 1, 122),
        ],
      },
    ],
  },

  // ── OCEANIA ──
  {
    id: "oceania", name: "Oceania", emoji: "🌏",
    countries: [
      {
        id: "au-c", name: "Austrália", flag: "🇦🇺", continent: "oceania",
        cities: [
          city("sy", "Sydney", "Austrália", "🇦🇺", "ap-southeast-2", 420, 500, 110, "hsl(50 70% 50%)", 58, 82, SMALL_DISTRICTS, 2, 200),
          city("mel", "Melbourne", "Austrália", "🇦🇺", "ap-southeast-2", 380, 400, 95, "hsl(210 55% 50%)", 60, 81, SMALL_DISTRICTS, 1, 202),
          city("bne", "Brisbane", "Austrália", "🇦🇺", "ap-southeast-2", 250, 300, 58, "hsl(180 60% 50%)", 56, 83, MINI_DISTRICTS, 1, 205),
          city("per", "Perth", "Austrália", "🇦🇺", "ap-southeast-2", 200, 250, 45, "hsl(40 60% 50%)", 58, 72, MINI_DISTRICTS, 1, 210),
        ],
      },
      {
        id: "nz", name: "Nova Zelândia", flag: "🇳🇿", continent: "oceania",
        cities: [
          city("akl", "Auckland", "Nova Zelândia", "🇳🇿", "ap-southeast-2", 250, 300, 60, "hsl(210 60% 50%)", 60, 87, MINI_DISTRICTS, 1, 220),
          city("wlg", "Wellington", "Nova Zelândia", "🇳🇿", "ap-southeast-2", 180, 200, 38, "hsl(142 55% 45%)", 62, 87, MINI_DISTRICTS, 1, 222),
        ],
      },
    ],
  },

  // ── AFRICA ──
  {
    id: "africa", name: "África", emoji: "🌍",
    countries: [
      {
        id: "za", name: "África do Sul", flag: "🇿🇦", continent: "africa",
        cities: [
          city("jb", "Joanesburgo", "África do Sul", "🇿🇦", "af-south-1", 280, 300, 65, "hsl(120 50% 40%)", 55, 54, SMALL_DISTRICTS, 1, 150),
          city("cpt", "Cidade do Cabo", "África do Sul", "🇿🇦", "af-south-1", 250, 300, 55, "hsl(200 60% 50%)", 58, 52, MINI_DISTRICTS, 1, 152),
        ],
      },
      {
        id: "ng", name: "Nigéria", flag: "🇳🇬", continent: "africa",
        cities: [
          city("lg", "Lagos", "Nigéria", "🇳🇬", "af-south-1", 340, 350, 78, "hsl(100 60% 40%)", 42, 50, SMALL_DISTRICTS, 1, 140),
          city("abj", "Abuja", "Nigéria", "🇳🇬", "af-south-1", 180, 200, 35, "hsl(142 45% 40%)", 41, 51, MINI_DISTRICTS, 1, 142),
        ],
      },
      {
        id: "ke", name: "Quênia", flag: "🇰🇪", continent: "africa",
        cities: [
          city("nbo", "Nairobi", "Quênia", "🇰🇪", "af-south-1", 280, 300, 65, "hsl(142 55% 45%)", 48, 56, MINI_DISTRICTS, 1, 145),
        ],
      },
      {
        id: "eg", name: "Egito", flag: "🇪🇬", continent: "africa",
        cities: [
          city("cai", "Cairo", "Egito", "🇪🇬", "me-south-1", 380, 400, 90, "hsl(45 65% 50%)", 35, 56, SMALL_DISTRICTS, 1, 130),
        ],
      },
      {
        id: "gh", name: "Gana", flag: "🇬🇭", continent: "africa",
        cities: [
          city("acc", "Accra", "Gana", "🇬🇭", "af-south-1", 220, 250, 48, "hsl(0 55% 50%)", 43, 48, MINI_DISTRICTS, 1, 138),
        ],
      },
      {
        id: "tz", name: "Tanzânia", flag: "🇹🇿", continent: "africa",
        cities: [
          city("dar", "Dar es Salaam", "Tanzânia", "🇹🇿", "af-south-1", 180, 200, 35, "hsl(200 50% 45%)", 46, 56, MINI_DISTRICTS, 1, 148),
        ],
      },
      {
        id: "ma", name: "Marrocos", flag: "🇲🇦", continent: "africa",
        cities: [
          city("cas", "Casablanca", "Marrocos", "🇲🇦", "eu-west-1", 250, 300, 55, "hsl(15 55% 50%)", 32, 46, MINI_DISTRICTS, 1, 105),
        ],
      },
      {
        id: "et", name: "Etiópia", flag: "🇪🇹", continent: "africa",
        cities: [
          city("add", "Adis Abeba", "Etiópia", "🇪🇹", "af-south-1", 200, 250, 42, "hsl(120 45% 40%)", 42, 56, MINI_DISTRICTS, 1, 150),
        ],
      },
      {
        id: "rw", name: "Ruanda", flag: "🇷🇼", continent: "africa",
        cities: [
          city("kgl", "Kigali", "Ruanda", "🇷🇼", "af-south-1", 180, 200, 35, "hsl(210 50% 45%)", 46, 55, MINI_DISTRICTS, 1, 148),
        ],
      },
      {
        id: "sn", name: "Senegal", flag: "🇸🇳", continent: "africa",
        cities: [
          city("dkr", "Dakar", "Senegal", "🇸🇳", "af-south-1", 180, 200, 35, "hsl(45 55% 50%)", 39, 44, MINI_DISTRICTS, 1, 135),
        ],
      },
    ],
  },

  // ── CENTRAL AMERICA & CARIBBEAN ──
  {
    id: "central-america", name: "América Central e Caribe", emoji: "🌎",
    countries: [
      {
        id: "cr", name: "Costa Rica", flag: "🇨🇷", continent: "central-america",
        cities: [
          city("sjo", "San José", "Costa Rica", "🇨🇷", "us-south-1", 200, 250, 45, "hsl(142 60% 45%)", 36, 21, MINI_DISTRICTS, 1, 35),
        ],
      },
      {
        id: "pa-c", name: "Panamá", flag: "🇵🇦", continent: "central-america",
        cities: [
          city("pty", "Cidade do Panamá", "Panamá", "🇵🇦", "us-south-1", 220, 250, 48, "hsl(210 55% 50%)", 37, 22, MINI_DISTRICTS, 1, 33),
        ],
      },
      {
        id: "pr", name: "Porto Rico", flag: "🇵🇷", continent: "central-america",
        cities: [
          city("sju", "San Juan", "Porto Rico", "🇵🇷", "us-east-1", 180, 200, 38, "hsl(200 60% 50%)", 36, 24, MINI_DISTRICTS, 1, 38),
        ],
      },
      {
        id: "do", name: "República Dominicana", flag: "🇩🇴", continent: "central-america",
        cities: [
          city("sdq", "Santo Domingo", "Rep. Dominicana", "🇩🇴", "us-east-1", 200, 250, 42, "hsl(0 55% 50%)", 36, 23, MINI_DISTRICTS, 1, 40),
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
