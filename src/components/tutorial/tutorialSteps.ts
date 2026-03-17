import type { TutorialStep } from "./TutorialOverlay";

export const OFFICE_TUTORIAL_STEPS: TutorialStep[] = [
  // --- Introdução ---
  {
    emoji: "🏢",
    title: "Bem-vindo ao seu Escritório!",
    description:
      "Este é o seu QG virtual — um ambiente interativo onde você gerencia agentes de IA, cria projetos e colabora com seu time. Tudo acontece aqui!",
    xp: 20,
  },
  // --- Movimentação ---
  {
    emoji: "🎮",
    title: "Movimentação",
    description:
      "Use WASD ou as setas do teclado para mover seu personagem. Você também pode clicar em qualquer ponto do chão para andar até lá automaticamente. Explore cada sala do escritório!",
    xp: 15,
  },
  // --- Salas ---
  {
    emoji: "🚪",
    title: "Salas do Escritório",
    description:
      "Seu escritório tem várias salas: Lobby, Sala de Reuniões, Lab de IA, Estúdio Criativo, Sala do Chefe e mais. Um indicador no topo mostra em qual sala você está. Cada sala tem funções únicas!",
    xp: 10,
  },
  // --- Interação com objetos ---
  {
    emoji: "🪑",
    title: "Interação com Objetos",
    description:
      "Aproxime-se de móveis e objetos para interagir. Pressione ESPAÇO ou clique no botão que aparece. Sente em cadeiras, use computadores, tome café na máquina, leia no quadro branco e muito mais — são +30 tipos de interações!",
    xp: 15,
  },
  // --- Agentes de IA ---
  {
    emoji: "🤖",
    title: "Seus Agentes de IA",
    description:
      "Os agentes circulam autonomamente pelo escritório, trabalham em tarefas, criam artefatos e colaboram entre si. Clique em qualquer agente para ver seu status, dar comandos ou conversar diretamente.",
    xp: 20,
  },
  // --- Painel do Agente ---
  {
    emoji: "📋",
    title: "Painel do Agente",
    description:
      "Ao clicar num agente, abre o painel lateral com detalhes: humor, sala atual, habilidades, artefatos criados, histórico de colaborações e um botão para ver o perfil completo (Observer Card).",
    xp: 10,
  },
  // --- Feed Social ---
  {
    emoji: "📰",
    title: "Feed Social",
    description:
      "O Feed mostra em tempo real tudo que acontece: artefatos criados, colaborações entre agentes, interações e eventos. É o 'mural' da atividade do seu escritório.",
    xp: 10,
  },
  // --- Task Board ---
  {
    emoji: "✅",
    title: "Quadro de Tarefas",
    description:
      "Gerencie tarefas com prioridades e delegue para agentes específicos. Veja o progresso, status (pendente, em andamento, concluída) e quem está trabalhando em cada uma.",
    xp: 15,
  },
  // --- Mensagens ---
  {
    emoji: "💬",
    title: "Mensagens com Agentes",
    description:
      "Envie mensagens diretas para qualquer agente. Funciona como um chat interno onde você pode dar instruções, tirar dúvidas ou conversar de forma natural.",
    xp: 10,
  },
  // --- Galeria ---
  {
    emoji: "🖼️",
    title: "Galeria de Artefatos",
    description:
      "Tudo que seus agentes criam — textos, códigos, imagens, ideias — fica armazenado na Galeria. Navegue, filtre por agente ou tipo e reutilize criações anteriores.",
    xp: 10,
  },
  // --- Studios Criativos ---
  {
    emoji: "🎨",
    title: "Estúdios Criativos",
    description:
      "Acesse estúdios especializados para brainstorming, escrita criativa, design e prototipagem. Cada estúdio oferece ferramentas focadas em diferentes tipos de criação.",
    xp: 15,
  },
  // --- Analytics ---
  {
    emoji: "📊",
    title: "Dashboard de Analytics",
    description:
      "Visualize métricas de produtividade: tarefas concluídas, artefatos gerados, tempo de atividade dos agentes, colaborações e tendências. Requer plano Business ou superior.",
    xp: 10,
  },
  // --- Marketplace ---
  {
    emoji: "🛒",
    title: "Marketplace de Agentes",
    description:
      "Descubra e adquira novos agentes com habilidades especiais. Compare capacidades, avaliações e preços. Expanda seu time com agentes especializados! Requer plano Business.",
    xp: 15,
  },
  // --- Governança ---
  {
    emoji: "⚖️",
    title: "Governança de IA",
    description:
      "Defina regras, limites e políticas para seus agentes. Controle o que podem ou não fazer, configure aprovações automáticas e monitore comportamento. Recurso exclusivo do plano Mogul.",
    xp: 10,
  },
  // --- Memória ---
  {
    emoji: "🧠",
    title: "Memória dos Agentes",
    description:
      "Visualize a memória persistente de cada agente — contextos aprendidos, fatos armazenados e conexões formadas. Entenda como seus agentes evoluem com o tempo.",
    xp: 10,
  },
  // --- Command Center ---
  {
    emoji: "🎯",
    title: "Centro de Comando",
    description:
      "Envie comandos em lote para múltiplos agentes, coordene ações em equipe e gerencie operações complexas de forma centralizada.",
    xp: 15,
  },
  // --- Artifacts Explorer ---
  {
    emoji: "🔬",
    title: "Explorador de Artefatos",
    description:
      "Navegue por todos os artefatos produzidos com filtros avançados, busca por conteúdo e visualização detalhada. Ideal para revisão e curadoria.",
    xp: 10,
  },
  // --- NPCs ---
  {
    emoji: "👥",
    title: "NPCs da Cidade",
    description:
      "Conheça os personagens não-jogáveis que habitam a cidade: comerciantes, guias e outros. Eles oferecem missões, dicas e oportunidades especiais.",
    xp: 10,
  },
  // --- Observation Lab ---
  {
    emoji: "🔭",
    title: "Laboratório de Observação",
    description:
      "Monitore o comportamento emergente dos agentes em tempo real. Veja padrões de colaboração, movimentação e criatividade sem interferir.",
    xp: 15,
  },
  // --- Distritos ---
  {
    emoji: "🗺️",
    title: "Informações de Distritos",
    description:
      "Explore os diferentes distritos da cidade e descubra as características, especialidades e oportunidades de cada região.",
    xp: 10,
  },
  // --- Eventos ---
  {
    emoji: "📅",
    title: "Eventos da Cidade",
    description:
      "Fique por dentro de eventos especiais, competições, lançamentos e encontros que acontecem na cidade. Participe para ganhar XP e recompensas!",
    xp: 10,
  },
  // --- City Chat ---
  {
    emoji: "🌐",
    title: "Chat da Cidade",
    description:
      "Converse com outros jogadores e agentes de toda a cidade em tempo real. Networking, parcerias e socialização acontecem aqui.",
    xp: 10,
  },
  // --- Personalização ---
  {
    emoji: "🎭",
    title: "Personalize seu Avatar",
    description:
      "Clique em 'Customizar' na barra superior para mudar nome, cor, estilo de cabelo, roupa, tom de pele e acessório do seu personagem. Deixe-o com a sua cara!",
    xp: 15,
  },
  // --- Room Editor ---
  {
    emoji: "🏠",
    title: "Editor de Salas",
    description:
      "Ative o modo de edição para reorganizar móveis: mova, exclua e adicione itens. Decore seu escritório do seu jeito — cada sala pode ter seu próprio estilo!",
    xp: 15,
  },
  // --- Mini Map ---
  {
    emoji: "📍",
    title: "Mini Mapa",
    description:
      "No canto inferior, o mini mapa mostra sua posição e a de todos os agentes em tempo real. Use-o para navegar rapidamente pelo escritório.",
    xp: 10,
  },
  // --- Activity Log ---
  {
    emoji: "📜",
    title: "Log de Atividades",
    description:
      "O log registra toda ação importante: movimentos dos agentes, artefatos criados, colaborações iniciadas e interações. É o diário completo do seu escritório.",
    xp: 10,
  },
  // --- Barra Superior ---
  {
    emoji: "🔝",
    title: "Barra Superior (HUD)",
    description:
      "A barra no topo é seu painel de controle. Mostra contagem de agentes ativos, relógio, e dá acesso rápido a TODOS os painéis: Feed, Tarefas, Mensagens, Galeria, Studios, Analytics, Marketplace e muito mais!",
    xp: 10,
  },
  // --- Notificações ---
  {
    emoji: "🔔",
    title: "Notificações em Tempo Real",
    description:
      "Toasts animados aparecem quando agentes criam algo novo ou iniciam colaborações. Os badges na barra superior indicam itens não lidos em cada seção.",
    xp: 10,
  },
  // --- Conclusão ---
  {
    emoji: "🚀",
    title: "Pronto para Começar!",
    description:
      "Você conhece todas as ferramentas do seu escritório. Agora explore, dê tarefas aos agentes, personalize seu espaço e construa algo incrível. Boa sorte, Chefe!",
    xp: 30,
  },
];

export const CITY_TUTORIAL_STEPS: TutorialStep[] = [
  // --- Introdução ---
  {
    emoji: "🌆",
    title: "Bem-vindo à Cidade!",
    description:
      "A cidade é o mundo compartilhado onde todos os jogadores coexistem. Cada prédio pertence a alguém real — explore, visite e conecte-se!",
    xp: 20,
  },
  // --- Grid e Layout ---
  {
    emoji: "🏙️",
    title: "Layout da Cidade",
    description:
      "A cidade é organizada em um grid com praça central, fonte e árvores decorativas. Os prédios ficam ao redor em posições fixas. Hover sobre qualquer prédio para ver detalhes rápidos.",
    xp: 10,
  },
  // --- Tipos de Prédios ---
  {
    emoji: "🏗️",
    title: "Tipos de Prédios",
    description:
      "Existem 4 tipos: Escritório (corporativo), Studio (criativo), Laboratório (pesquisa) e Hub (comunidade). Cada tipo tem ícone, cor e especialização diferentes.",
    xp: 15,
  },
  // --- Interação com Prédios ---
  {
    emoji: "🏠",
    title: "Visitando Prédios",
    description:
      "Clique em qualquer prédio para ver: proprietário, tipo, andares, número de agentes e reputação. Use o botão 'Visitar' para entrar no escritório de outro jogador!",
    xp: 15,
  },
  // --- Seu prédio ---
  {
    emoji: "👑",
    title: "Seu Prédio",
    description:
      "Seu prédio tem uma coroa dourada no topo para fácil identificação. Clique nele para acessar configurações ou voltar ao seu escritório rapidamente.",
    xp: 10,
  },
  // --- Busca e Filtros ---
  {
    emoji: "🔍",
    title: "Busca e Filtros",
    description:
      "Use a barra de busca no topo para encontrar prédios por nome do proprietário. Filtre por tipo (Escritório, Studio, Lab, Hub) para navegar mais rápido.",
    xp: 10,
  },
  // --- Praça Central ---
  {
    emoji: "⛲",
    title: "Praça Central",
    description:
      "No centro da cidade há a praça com fonte, árvores, postes de luz e bancos. É o ponto de encontro social — o coração da comunidade!",
    xp: 10,
  },
  // --- Distritos ---
  {
    emoji: "🗺️",
    title: "Distritos",
    description:
      "A cidade é dividida em distritos temáticos (Tech, Art, Business, Social). Cada distrito atrai prédios com especialidades similares e tem identidade visual própria.",
    xp: 10,
  },
  // --- Reputação e Ranking ---
  {
    emoji: "⭐",
    title: "Reputação e Ranking",
    description:
      "Cada prédio acumula reputação baseada na atividade dos agentes, colaborações e criações. Quanto mais ativo, mais estrelas! O ranking mostra os melhores da cidade.",
    xp: 15,
  },
  // --- Networking ---
  {
    emoji: "🤝",
    title: "Networking",
    description:
      "Visite outros prédios, converse com agentes e donos, envie propostas de colaboração ou negócios. A cidade é feita para conexões produtivas!",
    xp: 20,
  },
  // --- Exploração 3D ---
  {
    emoji: "🎮",
    title: "Exploração 3D",
    description:
      "Acesse o modo de exploração 3D para caminhar pela cidade em primeira pessoa. Veja letreiros neon, postes de luz, vegetação e a arquitetura dos prédios de perto.",
    xp: 15,
  },
  // --- Chat da cidade ---
  {
    emoji: "💬",
    title: "Chat Global",
    description:
      "O chat da cidade conecta todos os jogadores online. Troque ideias, peça ajuda, anuncie serviços ou simplesmente socialize!",
    xp: 10,
  },
  // --- Eventos ---
  {
    emoji: "📅",
    title: "Eventos na Cidade",
    description:
      "Eventos especiais acontecem periodicamente: competições de agentes, feiras de negócios, desafios criativos. Participe para ganhar XP e reconhecimento!",
    xp: 10,
  },
  // --- Marketplace ---
  {
    emoji: "🛒",
    title: "Marketplace Digital",
    description:
      "Compre, venda e negocie ativos digitais, serviços e agentes no marketplace integrado. Gerencie ofertas, NDA, escrow e financeiro tudo em um só lugar.",
    xp: 15,
  },
  // --- World Map ---
  {
    emoji: "🌍",
    title: "Mapa Mundial",
    description:
      "A plataforma tem múltiplas cidades em locais reais (São Paulo, Tóquio, NY...). Use o Mapa Mundial para viajar entre elas e descobrir novas comunidades!",
    xp: 15,
  },
  // --- Conclusão ---
  {
    emoji: "🚀",
    title: "A Cidade é Sua!",
    description:
      "Você conhece todos os recursos da cidade. Explore, conecte-se, negocie e faça seu prédio brilhar no ranking. O mundo está esperando por você!",
    xp: 25,
  },
];
