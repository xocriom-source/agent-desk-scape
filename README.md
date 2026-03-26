# 🏙️ The Good City — Virtual City Platform

Plataforma de cidade virtual 3D onde negócios digitais ganham vida como prédios interativos em um mundo global.

## 🌐 Links

- **Produção**: https://agent-desk-scape.lovable.app
- **Lovable**: https://lovable.dev/projects/1f7e6bab-04b6-4793-8e49-cccf75176ac3

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| 3D Engine | Three.js + React Three Fiber + Drei |
| Estilo | Tailwind CSS + shadcn/ui |
| Backend | Lovable Cloud |
| Estado | TanStack Query + React Context |
| Mapas | MapLibre GL + OpenStreetMap |
| Animações | Framer Motion |
| Pagamentos | Stripe |

## 📁 Arquitetura

```
src/
├── components/
│   ├── city/          # Cidade 3D (OSM, veículos, chat)
│   ├── office/        # Escritório virtual e painéis
│   ├── building/      # Interior de prédios e assistentes IA
│   ├── marketplace/   # Marketplace de negócios digitais
│   ├── workspace/     # Ferramentas de colaboração
│   ├── ecosystem/     # Ecossistema de agentes
│   ├── admin/         # Painel administrativo
│   └── ui/            # Componentes shadcn/ui
├── contexts/          # AuthContext (autenticação + perfil)
├── engine/            # Motor 3D (WorldEngine, LOD, Instancing)
├── systems/city/      # Geração procedural e OSM
├── data/              # Serviços e registros de dados
├── hooks/             # React hooks (useSubscription, useFeatureGate, etc.)
├── pages/             # Rotas da aplicação
└── types/             # TypeScript types
supabase/
├── functions/         # Edge Functions (AI, pagamentos, webhooks)
└── config.toml        # Configuração
```

## 🔑 Módulos Principais

### Autenticação & Segurança
- Login/Signup com verificação de email
- Roles via tabela `user_roles` + RPC `has_role`
- RLS em todas as tabelas
- ProtectedRoute com verificação de role

### Cidade 3D
- Renderização baseada em OpenStreetMap
- Sistema de LOD em 3 níveis
- Carregamento progressivo por chunks
- 30+ cidades disponíveis

### Escritório Virtual
- Cena isométrica com agentes IA
- Salas e mobília customizáveis
- Chat com agentes via IA
- Recepcionista IA por prédio

### Marketplace Digital
- Listagem de negócios digitais (SaaS, e-commerce, apps)
- Métricas financeiras (MRR, crescimento)
- Sistema de ofertas e escrow
- Filtros por categoria e região

### Planos & Feature Gating
- Explorer (gratuito), Business ($49/mês), Mogul ($199/mês)
- Feature gates centralizados via `useFeatureGate`
- Checkout Stripe integrado

### Painel Admin
- Overview, usuários, agentes, cidade, moderação, logs
- Acesso restrito por role `admin`

## 🚀 Setup Local

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

## 📊 Edge Functions

| Função | Propósito |
|--------|-----------|
| `agent-chat` | Chat conversacional com agentes IA |
| `agent-heartbeat` | Atualização periódica de agentes |
| `ai-receptionist` | Recepcionista IA por prédio |
| `check-subscription` | Verificação de plano ativo |
| `create-checkout` | Criação de sessão Stripe |
| `stripe-webhook` | Webhook de pagamentos |
| `manage-escrow` | Gestão de escrow para deals |

## 📝 Licença

Projeto privado — todos os direitos reservados.
