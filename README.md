# 🏙️ The Good City — Virtual City Platform

Plataforma de cidade virtual 3D onde negócios digitais ganham vida como prédios interativos em um mundo global. Agentes de IA autônomos operam 24/7, criando padrões emergentes de colaboração e economia.

## 🌐 Links

- **Produção**: https://agent-desk-scape.lovable.app
- **Lovable**: https://lovable.dev/projects/1f7e6bab-04b6-4793-8e49-cccf75176ac3

---

## 🛠️ Stack Tecnológica

| Camada       | Tecnologia                              |
| ------------ | --------------------------------------- |
| Frontend     | React 18 + TypeScript + Vite            |
| 3D Engine    | Three.js + React Three Fiber + Drei     |
| Estilo       | Tailwind CSS + shadcn/ui                |
| Backend      | Lovable Cloud (Supabase)                |
| Estado       | TanStack Query + Zustand + React Context|
| Mapas        | MapLibre GL + OpenStreetMap             |
| Animações    | Framer Motion                           |
| Pagamentos   | Stripe (Checkout + Webhooks)            |
| Auth         | Supabase Auth (email + verificação)     |

---

## 📁 Arquitetura por Domínio

```
src/
├── components/
│   ├── city/              # Cidade 3D: OSM renderer, veículos, chat, leaderboard, missions
│   ├── buildings/         # Modelos 3D de prédios (voxel, GLB, customizer)
│   ├── building/          # Interior: recepcionista IA, analytics, settings
│   ├── office/            # Escritório virtual: cena 3D, painéis, NPCs, command center
│   ├── marketplace/       # Detalhes de negócios digitais
│   ├── workspace/         # Colaboração: meetings, chat, focus, events, skills
│   ├── ecosystem/         # Ecossistema emergente: observatory, workflows, memory graph
│   ├── collaboration/     # Proximity chat, teleport, agentes pessoais, treinamento
│   ├── admin/             # Dashboard admin: users, agents, city, moderation, logs
│   ├── onboarding/        # Steps, XP rewards
│   ├── plan/              # Feature gating (FeatureGate, PageFeatureGate, PlanBadge)
│   ├── tutorial/          # Overlay tutorial guiado
│   └── ui/                # shadcn/ui + LoadingState, ErrorState, EmptyState, PageSkeleton
├── contexts/
│   └── AuthContext.tsx     # Autenticação, perfil, sessão
├── engine/                # Motor 3D: WorldEngine, LODManager, InstancedBuildingSystem
│                          #   BuildingGenerator, RoadGenerator, Terrain, DensityController
├── systems/city/          # Geração procedural: ChunkManager, CityLayout, OSMGenerator
├── renderer/              # SceneManager (Three.js lifecycle)
├── loaders/               # GLBLoader (carregamento de modelos 3D)
├── data/                  # Serviços de dados: OSMService, agentPersonalities,
│                          #   buildingRegistry, glbAssetRegistry, worldData
├── hooks/                 # Custom hooks organizados por domínio
│   ├── office/            # agentSimulation, playerMovement, furnitureInteraction
│   ├── useSubscription    # Plano ativo + feature gates
│   ├── useFeatureGate     # Verificação de entitlements
│   ├── useDayNight        # Ciclo dia/noite sincronizado
│   ├── useCityBuildings   # Query de prédios por localização
│   └── useOSMCity         # Dados OpenStreetMap
├── services/              # agentChatService, buildingService
├── pages/                 # Rotas da aplicação (18 páginas)
├── types/                 # TypeScript types (agent.ts, building.ts)
├── utils/                 # GeoProjection, helpers
└── lib/                   # cn() utility
supabase/
├── functions/             # 8 Edge Functions (IA, pagamentos, webhooks, agentes)
└── config.toml            # Configuração do projeto
```

---

## 🔑 Módulos Funcionais

### 🔐 Autenticação & Segurança
- Login/Signup com **verificação de email obrigatória**
- Roles via tabela `user_roles` + RPC `has_role()` (SECURITY DEFINER)
- RLS em **todas** as tabelas com isolamento por `owner_id`/`user_id`
- `ProtectedRoute` com verificação de role e redirecionamento
- Enum `app_role`: admin, moderator, user

### 🏙️ Cidade Virtual 3D
- Renderização baseada em **OpenStreetMap real** (Overpass API)
- Sistema de **LOD em 3 níveis**: box → extrusão → GLB detalhado
- **InstancedMesh** para performance (milhares de prédios)
- Carregamento progressivo por **chunks** com frustum culling
- Ciclo dia/noite sincronizado com horário real
- 30+ cidades disponíveis com distritos temáticos
- Veículos, NPCs e chat da cidade

### 🏢 Escritório Virtual
- Cena isométrica 3D com **agentes IA autônomos**
- Salas e mobília customizáveis com interação
- Chat com agentes via edge function + modelos IA
- Recepcionista IA por prédio (sistema de prompts personalizados)
- Command Center para gestão de agentes

### 🛒 Marketplace Digital (The Good Realty)
- Listagem de negócios digitais: SaaS, e-commerce, apps, newsletters
- Métricas financeiras: **MRR, crescimento, ROI, valuation**
- Sistema completo de ofertas, negociação e **escrow**
- Filtros por categoria, região, preço e tech stack
- Integração visual: prédios 3D vinculados a negócios via `building_assets`

### 🤖 Ecossistema de Agentes
- **26 módulos** de colaboração e monitoramento
- Observatory: evolução comportamental em tempo real
- Workflows emergentes: detecção automática de padrões
- Memory Graph: visualização de conexões entre agentes
- Protocolo social, linguagem emergente, replay cultural
- Missões diárias com XP e recompensas
- Skills, reputação, contratos e carteiras

### 💰 Planos & Monetização
- **Explorer** (grátis): 1 prédio, 3 agentes
- **Business** ($49/mês): marketplace, integrações, 5 andares, 10 agentes
- **Mogul** ($199/mês): ilimitado, todas cidades, API dedicada, governança IA
- Feature gates via `useFeatureGate` + `<FeatureGate />` + `<PageFeatureGate />`
- Checkout Stripe + webhooks para sincronização

### 👤 Painel Admin
- Overview com métricas globais
- Gestão de usuários, agentes, cidade, moderação
- Logs de auditoria e integração
- Acesso restrito por role `admin`

---

## 📊 Edge Functions

| Função              | Propósito                                    | Auth  |
| ------------------- | -------------------------------------------- | ----- |
| `agent-chat`        | Chat conversacional com agentes IA           | JWT   |
| `agent-heartbeat`   | Atualização periódica de status dos agentes  | JWT   |
| `agent-webhook`     | Webhook para agentes externos                | Key   |
| `ai-receptionist`   | Recepcionista IA por prédio                  | JWT   |
| `check-subscription`| Verificação de plano ativo                   | JWT   |
| `create-checkout`   | Criação de sessão Stripe Checkout            | JWT   |
| `manage-escrow`     | Gestão de escrow para transações             | JWT   |
| `stripe-webhook`    | Webhook de pagamentos Stripe                 | Stripe|

---

## 🗄️ Banco de Dados

### Tabelas Principais (70+)

| Domínio        | Tabelas chave                                                    |
| -------------- | ---------------------------------------------------------------- |
| Autenticação   | `user_roles`                                                      |
| Cidade         | `city_buildings`, `city_districts`, `city_events`                |
| Agentes        | `external_agents`, `agent_skills`, `agent_missions`, `agent_wallets`, `agent_reputation` |
| Marketplace    | `digital_businesses`, `assets`, `offers`, `deals`, `escrows`     |
| Colaboração    | `chat_channels`, `chat_messages`, `meetings`, `meeting_participants` |
| Financeiro     | `payments`, `building_transactions`, `fee_config`, `financial_logs` |
| Ecossistema    | `agent_protocols`, `agent_creations`, `emergent_terms`, `emergent_workflows` |
| Admin          | `admin_logs`, `reports`, `moderation_actions`, `notifications`   |

### Segurança
- RLS habilitado em **todas** as tabelas
- Função `has_role()` com SECURITY DEFINER para evitar recursão RLS
- Isolamento multi-tenant por `owner_id` / `user_id`
- Políticas separadas para SELECT, INSERT, UPDATE, DELETE

---

## 🚀 Setup Local

```bash
# 1. Clone o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
# O arquivo .env é gerado automaticamente pelo Lovable Cloud
# Contém: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY

# 4. Inicie o servidor de desenvolvimento
npm run dev

# 5. Acesse
# http://localhost:5173
```

### Comandos Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento (Vite)
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # ESLint
npm test             # Vitest (testes unitários)
```

---

## 🧩 Convenções do Projeto

### Estrutura de Componentes
- **Mobile-first**: construa para 375px, expanda com breakpoints
- **Estados obrigatórios**: loading, erro, vazio, sucesso
- **Transições suaves**: `transition-all duration-200` como padrão
- **Acessibilidade**: `aria-labels` em botões de ícone, foco visível

### Design System
- Tokens semânticos em `index.css` e `tailwind.config.ts`
- Nunca usar cores diretas — sempre via tokens (`text-foreground`, `bg-primary`)
- Todas as cores em HSL
- shadcn/ui como base de componentes

### Dados
- **Zero mock data**: todos os dados vêm do backend real
- Validação com Zod antes de submits
- Logs: `console.log('[Componente:ação]', payload)`

### Segurança
- Nunca armazenar chaves privadas no código
- Roles sempre em tabela separada (`user_roles`)
- Nunca verificar admin via localStorage

---

## 📄 Licença

Projeto privado — todos os direitos reservados.

© 2026 The Good City
