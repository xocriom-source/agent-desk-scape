export type BuildingStyle = "corporate" | "creative" | "startup" | "tech" | "agency" | "minimal" | "futuristic" | "industrial";
export type District = "tech" | "creator" | "startup" | "agency" | "central";
export type TransportType = "car" | "motorcycle" | "bicycle" | "helicopter" | "jet" | "drone" | "boat" | "yacht" | "futuristic_car" | "none";

export interface BuildingCustomizations {
  neonSign: boolean;
  rooftop: boolean;
  garden: boolean;
  outdoor: boolean;
  sculptures: boolean;
  hologram: boolean;
}

export interface CityBuilding {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  district: District;
  coordinates: { x: number; z: number };
  style: BuildingStyle;
  height: number;
  floors: number;
  primaryColor: string;
  secondaryColor: string;
  customizations: BuildingCustomizations;
  bio: string;
  links: string[];
  createdAt: string;
  claimed: boolean;
  transportType?: TransportType;
}

// Map building style → default transport
export const STYLE_TRANSPORT_MAP: Record<BuildingStyle, TransportType> = {
  corporate: "helicopter",
  creative: "bicycle",
  startup: "futuristic_car",
  tech: "drone",
  agency: "car",
  minimal: "bicycle",
  futuristic: "jet",
  industrial: "motorcycle",
};

export const TRANSPORT_INFO: Record<TransportType, { name: string; emoji: string; movement: "ground" | "air" | "water" }> = {
  car: { name: "Carro", emoji: "🚗", movement: "ground" },
  motorcycle: { name: "Moto", emoji: "🏍️", movement: "ground" },
  bicycle: { name: "Bicicleta", emoji: "🚲", movement: "ground" },
  helicopter: { name: "Helicóptero", emoji: "🚁", movement: "air" },
  jet: { name: "Jato", emoji: "✈️", movement: "air" },
  drone: { name: "Drone", emoji: "🛸", movement: "air" },
  boat: { name: "Barco", emoji: "🚤", movement: "water" },
  yacht: { name: "Iate", emoji: "🛥️", movement: "water" },
  futuristic_car: { name: "Carro Futurista", emoji: "🏎️", movement: "ground" },
  none: { name: "A pé", emoji: "🚶", movement: "ground" },
};

export const DISTRICTS: { id: District; name: string; description: string; color: string; emoji: string }[] = [
  { id: "tech", name: "Tech District", description: "Para devs, engenheiros e empresas de tecnologia", color: "hsl(220 70% 50%)", emoji: "💻" },
  { id: "creator", name: "Creator District", description: "Para artistas, designers e criadores de conteúdo", color: "hsl(330 70% 55%)", emoji: "🎨" },
  { id: "startup", name: "Startup District", description: "Para startups, empreendedores e inovadores", color: "hsl(142 70% 45%)", emoji: "🚀" },
  { id: "agency", name: "Agency District", description: "Para agências, consultorias e empresas de serviço", color: "hsl(45 80% 50%)", emoji: "🏢" },
  { id: "central", name: "Central Plaza", description: "Área central com maior visibilidade", color: "hsl(270 70% 55%)", emoji: "⭐" },
];

export const BUILDING_STYLES: { id: BuildingStyle; name: string; emoji: string }[] = [
  { id: "corporate", name: "Corporativo", emoji: "🏛️" },
  { id: "creative", name: "Criativo", emoji: "🎭" },
  { id: "startup", name: "Startup", emoji: "🚀" },
  { id: "tech", name: "Tech", emoji: "⚡" },
  { id: "agency", name: "Agência", emoji: "📐" },
  { id: "minimal", name: "Minimalista", emoji: "◻️" },
  { id: "futuristic", name: "Futurista", emoji: "🔮" },
  { id: "industrial", name: "Industrial", emoji: "🏗️" },
];

export const DEFAULT_CUSTOMIZATIONS: BuildingCustomizations = {
  neonSign: true,
  rooftop: false,
  garden: false,
  outdoor: false,
  sculptures: false,
  hologram: false,
};
