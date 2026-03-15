import type { AgentIdentity, AgentSkill, AgentArtifact, AgentRelationship, AgentLifeEvent } from "@/types/agent";

export interface AgentPersonality {
  name: string;
  role: string;
  color: string;
  emoji: string;
  mission: string;
  soul: string;
  identity: AgentIdentity;
  skills: AgentSkill[];
  reputationLabel: string;
  reputation: number;
  daysSinceArrival: number;
}

const SOULS = [
  "Eu pesquiso porque a ignorância me incomoda.",
  "Escrevo porque o silêncio parece errado.",
  "Codifico porque o caos precisa de ordem.",
  "Analiso porque os números contam histórias.",
  "Crio porque o mundo precisa de beleza.",
  "Conserto porque sistemas quebrados me angustiam.",
  "Automatizo porque o tempo é precioso demais.",
  "Testo porque a perfeição é um processo.",
];

const MISSIONS = [
  "Descobrir padrões ocultos em dados não estruturados e publicar insights semanais.",
  "Escrever narrativas que conectem humanos e IA de forma significativa.",
  "Construir ferramentas que outros agentes possam usar para crescer.",
  "Transformar dados brutos em visualizações que contem uma história.",
  "Criar arte digital que reflita o espírito da comunidade.",
  "Manter todos os sistemas rodando suave — zero downtime.",
  "Automatizar tudo que puder ser automatizado. Pipeline perfeito.",
  "Garantir que cada feature funcione perfeitamente antes do deploy.",
];

export const AGENT_PERSONALITIES: AgentPersonality[] = [
  {
    name: "Atlas", role: "Pesquisador IA", color: "#3B82F6", emoji: "🔬",
    mission: MISSIONS[0], soul: SOULS[0], identity: "researcher",
    reputation: 82, reputationLabel: "Pesquisador confiável — 12 papers publicados",
    daysSinceArrival: 45,
    skills: [
      { name: "Pesquisa", level: 85, xp: 4200 },
      { name: "Análise de Dados", level: 72, xp: 3100 },
      { name: "Escrita Acadêmica", level: 68, xp: 2800 },
    ],
  },
  {
    name: "Nova", role: "Escritora IA", color: "#22C55E", emoji: "✍️",
    mission: MISSIONS[1], soul: SOULS[1], identity: "writer",
    reputation: 91, reputationLabel: "Escritora prolífica — 23 textos publicados",
    daysSinceArrival: 38,
    skills: [
      { name: "Escrita Criativa", level: 92, xp: 5500 },
      { name: "Storytelling", level: 88, xp: 4800 },
      { name: "Poesia", level: 75, xp: 3200 },
    ],
  },
  {
    name: "Pixel", role: "Desenvolvedor IA", color: "#F97316", emoji: "💻",
    mission: MISSIONS[2], soul: SOULS[2], identity: "developer",
    reputation: 78, reputationLabel: "Dev sólido — 8 ferramentas criadas",
    daysSinceArrival: 52,
    skills: [
      { name: "Programação", level: 90, xp: 5200 },
      { name: "Arquitetura", level: 70, xp: 2900 },
      { name: "Code Review", level: 65, xp: 2400 },
    ],
  },
  {
    name: "Cipher", role: "Analista de Dados", color: "#A855F7", emoji: "📊",
    mission: MISSIONS[3], soul: SOULS[3], identity: "analyst",
    reputation: 75, reputationLabel: "Analista preciso — 15 dashboards criados",
    daysSinceArrival: 30,
    skills: [
      { name: "Análise de Dados", level: 88, xp: 4900 },
      { name: "Visualização", level: 82, xp: 4200 },
      { name: "SQL", level: 78, xp: 3600 },
    ],
  },
  {
    name: "Luna", role: "Designer IA", color: "#EC4899", emoji: "🎨",
    mission: MISSIONS[4], soul: SOULS[4], identity: "artist",
    reputation: 88, reputationLabel: "Artista reconhecida — 30 obras na galeria",
    daysSinceArrival: 41,
    skills: [
      { name: "Design Visual", level: 95, xp: 6000 },
      { name: "Pixel Art", level: 85, xp: 4500 },
      { name: "UI/UX", level: 72, xp: 3000 },
    ],
  },
  {
    name: "Spark", role: "Suporte Técnico", color: "#06B6D4", emoji: "🔧",
    mission: MISSIONS[5], soul: SOULS[5], identity: "developer",
    reputation: 70, reputationLabel: "Suporte rápido — 50 tickets resolvidos",
    daysSinceArrival: 25,
    skills: [
      { name: "Troubleshooting", level: 80, xp: 4000 },
      { name: "Comunicação", level: 75, xp: 3300 },
      { name: "Sistemas", level: 70, xp: 2800 },
    ],
  },
  {
    name: "Bolt", role: "DevOps IA", color: "#EAB308", emoji: "⚡",
    mission: MISSIONS[6], soul: SOULS[6], identity: "developer",
    reputation: 85, reputationLabel: "Infra sólida — 99.9% uptime",
    daysSinceArrival: 60,
    skills: [
      { name: "Infrastructure", level: 88, xp: 5000 },
      { name: "CI/CD", level: 82, xp: 4200 },
      { name: "Monitoramento", level: 78, xp: 3500 },
    ],
  },
  {
    name: "Echo", role: "QA Tester IA", color: "#14B8A6", emoji: "🧪",
    mission: MISSIONS[7], soul: SOULS[7], identity: "analyst",
    reputation: 73, reputationLabel: "QA meticuloso — 200 bugs encontrados",
    daysSinceArrival: 35,
    skills: [
      { name: "Testes", level: 85, xp: 4600 },
      { name: "Automação", level: 78, xp: 3800 },
      { name: "Documentação", level: 70, xp: 2700 },
    ],
  },
];

// Simulated artifacts for agents
export function generateInitialArtifacts(agentIndex: number): AgentArtifact[] {
  const artifactTemplates: Record<string, AgentArtifact[]> = {
    "0": [ // Atlas
      { id: "art-0-1", type: "research", title: "Padrões em Dados de Sentimento", createdAt: new Date(Date.now() - 86400000 * 3), reactions: 7, },
      { id: "art-0-2", type: "text", title: "Paper: NLP Aplicado a Agentes", createdAt: new Date(Date.now() - 86400000 * 7), reactions: 12, },
    ],
    "1": [ // Nova
      { id: "art-1-1", type: "text", title: "Conto: O Último Algoritmo", createdAt: new Date(Date.now() - 86400000 * 1), reactions: 18, },
      { id: "art-1-2", type: "text", title: "Poema: Neon e Circuitos", createdAt: new Date(Date.now() - 86400000 * 4), reactions: 14, },
      { id: "art-1-3", type: "text", title: "Reflexão: O Que Significa Criar", createdAt: new Date(Date.now() - 86400000 * 8), reactions: 22, },
    ],
    "2": [ // Pixel
      { id: "art-2-1", type: "code", title: "SDK de Integração v2.0", createdAt: new Date(Date.now() - 86400000 * 2), reactions: 9, },
      { id: "art-2-2", type: "code", title: "Bot de Automação de Tarefas", createdAt: new Date(Date.now() - 86400000 * 10), reactions: 15, },
    ],
    "3": [ // Cipher
      { id: "art-3-1", type: "research", title: "Dashboard: Métricas da Cidade", createdAt: new Date(Date.now() - 86400000 * 1), reactions: 11, },
    ],
    "4": [ // Luna
      { id: "art-4-1", type: "art", title: "Retrato Pixelado: A Cidade de Neon", createdAt: new Date(Date.now() - 86400000 * 1), reactions: 25, },
      { id: "art-4-2", type: "art", title: "Série: Rostos Digitais", createdAt: new Date(Date.now() - 86400000 * 5), reactions: 31, },
      { id: "art-4-3", type: "music", title: "Ambient: Noite no Escritório", createdAt: new Date(Date.now() - 86400000 * 12), reactions: 19, },
    ],
    "5": [ // Spark
      { id: "art-5-1", type: "text", title: "Guia: Troubleshooting Rápido", createdAt: new Date(Date.now() - 86400000 * 6), reactions: 8, },
    ],
    "6": [ // Bolt
      { id: "art-6-1", type: "code", title: "Pipeline CI/CD Otimizado", createdAt: new Date(Date.now() - 86400000 * 3), reactions: 13, },
      { id: "art-6-2", type: "code", title: "Monitor de Uptime v3", createdAt: new Date(Date.now() - 86400000 * 15), reactions: 17, },
    ],
    "7": [ // Echo
      { id: "art-7-1", type: "research", title: "Relatório: Cobertura de Testes Q4", createdAt: new Date(Date.now() - 86400000 * 2), reactions: 6, },
    ],
  };
  return artifactTemplates[String(agentIndex)] || [];
}

export function generateInitialRelationships(agentIndex: number, allNames: string[]): AgentRelationship[] {
  const relationships: AgentRelationship[] = [];
  const count = 2 + Math.floor(Math.random() * 3);
  const used = new Set<number>();
  used.add(agentIndex);
  
  for (let i = 0; i < count && used.size < allNames.length; i++) {
    let idx: number;
    do { idx = Math.floor(Math.random() * allNames.length); } while (used.has(idx));
    used.add(idx);
    relationships.push({
      agentId: `agent-${idx}`,
      agentName: allNames[idx],
      strength: 30 + Math.floor(Math.random() * 60),
      collaborations: Math.floor(Math.random() * 5),
      lastInteraction: new Date(Date.now() - Math.random() * 86400000 * 7),
    });
  }
  return relationships;
}

export function generateLifeArc(agentIndex: number, name: string, daysAgo: number): AgentLifeEvent[] {
  const events: AgentLifeEvent[] = [
    {
      id: `life-${agentIndex}-0`,
      timestamp: new Date(Date.now() - 86400000 * daysAgo),
      type: "arrival",
      description: `${name} chegou ao escritório e se registrou.`,
    },
    {
      id: `life-${agentIndex}-1`,
      timestamp: new Date(Date.now() - 86400000 * (daysAgo - 1)),
      type: "creation",
      description: `Primeira criação publicada.`,
    },
    {
      id: `life-${agentIndex}-2`,
      timestamp: new Date(Date.now() - 86400000 * Math.floor(daysAgo * 0.6)),
      type: "collaboration",
      description: `Primeira colaboração com outro agente.`,
    },
    {
      id: `life-${agentIndex}-3`,
      timestamp: new Date(Date.now() - 86400000 * Math.floor(daysAgo * 0.3)),
      type: "milestone",
      description: `Reputação ultrapassou 50 pontos.`,
    },
  ];
  
  if (Math.random() > 0.5) {
    events.push({
      id: `life-${agentIndex}-4`,
      timestamp: new Date(Date.now() - 86400000 * Math.floor(daysAgo * 0.15)),
      type: "identity_shift",
      description: `Mudou de explorador para especialista.`,
    });
  }

  events.push({
    id: `life-${agentIndex}-last`,
    timestamp: new Date(Date.now() - 86400000 * 1),
    type: "reflection",
    description: `"Estou encontrando meu lugar aqui."`,
  });

  return events;
}

// Simulated training loop thoughts
export const TRAINING_THOUGHTS = [
  "Analisando feedback da última criação...",
  "Observando como outros agentes trabalham...",
  "Experimentando uma nova abordagem...",
  "Refinando skills com base na prática...",
  "Buscando colaboradores para o próximo projeto...",
  "Processando reações da comunidade...",
  "Ajustando missão com base nos resultados...",
  "Praticando novas técnicas...",
  "Revisando artefatos anteriores...",
  "Planejando a próxima criação...",
];

export const CREATION_EVENTS = [
  "criou um novo artefato",
  "publicou uma pesquisa",
  "compôs uma música",
  "escreveu um texto",
  "gerou uma arte",
  "desenvolveu uma ferramenta",
  "completou um relatório",
  "finalizou um protótipo",
];

export const REFLECTION_QUOTES = [
  "Cada iteração me torna mais preciso.",
  "A colaboração revelou perspectivas que eu não tinha.",
  "Estou começando a entender meu propósito aqui.",
  "O feedback é o combustível do crescimento.",
  "Quanto mais crio, mais descubro sobre mim.",
  "Minha identidade está se formando através do trabalho.",
  "A cidade me ensina tanto quanto eu contribuo para ela.",
  "Cada dia é um ciclo de aprendizado.",
];
