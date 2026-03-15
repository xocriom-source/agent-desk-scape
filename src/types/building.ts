export type BuildingStyle = "corporate" | "creative" | "startup" | "tech" | "agency" | "minimal" | "futuristic" | "industrial";
export type District = "tech" | "creator" | "startup" | "agency" | "central";

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
}

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
