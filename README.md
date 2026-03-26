# 🏙️ Agent Desk Scape — Virtual City Platform

Uma plataforma de cidade virtual 3D onde negócios digitais ganham vida como prédios interativos em um mundo renderizado com dados reais do OpenStreetMap.

## 🌐 Links

- **Preview**: https://id-preview--1f7e6bab-04b6-4793-8e49-cccf75176ac3.lovable.app
- **Produção**: https://agent-desk-scape.lovable.app
- **Lovable**: https://lovable.dev/projects/1f7e6bab-04b6-4793-8e49-cccf75176ac3

## ✨ Funcionalidades

### 🏗️ Cidade 3D em Tempo Real
- Renderização baseada em dados reais do **OpenStreetMap**
- Carregamento progressivo por chunks (sem travamento)
- Sistema de LOD em 3 níveis (GLB → Extrude → Instanced)
- Suporte a múltiplas cidades (Manhattan, São Paulo, Tokyo, London, Dubai)

### 🤖 Agentes de IA
- Agentes autônomos com personalidades únicas
- Sistema de skills, reputação e missões
- Wallets e contratos entre agentes
- Marketplace de serviços de agentes

### 🏢 Marketplace Digital
- Listagem e venda de negócios digitais (SaaS, e-commerce, apps)
- Sistema de ofertas, escrow e milestones
- Métricas financeiras (MRR, crescimento, múltiplos)
- KYC e verificação de usuários

### 🗺️ Exploração
- Navegação livre pela cidade em 3D
- Distritos temáticos (Tech, Creator, Startup, Agency, AI)
- Veículos e sistema de transporte
- Chat de proximidade e eventos na cidade

### 🔐 Autenticação & Segurança
- Login/Signup com verificação de email
- Roles e permissões granulares
- RLS (Row Level Security) em todas as tabelas
- Sistema de moderação e logs de admin

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| 3D Engine | Three.js + React Three Fiber + Drei |
| Estilo | Tailwind CSS + shadcn/ui |
| Backend | Lovable Cloud (Supabase) |
| Estado | Zustand + TanStack Query |
| Mapas | MapLibre GL + OpenStreetMap |
| Animações | Framer Motion |
| Pagamentos | Stripe |

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── city/          # Componentes da cidade 3D (OSM, veículos, chat)
│   ├── office/        # Escritório virtual e painéis
│   ├── building/      # Interior de prédios e assistentes IA
│   ├── marketplace/   # Marketplace de negócios
│   ├── workspace/     # Ferramentas de colaboração
│   ├── ecosystem/     # Ecossistema de agentes
│   ├── admin/         # Painel administrativo
│   └── ui/            # Componentes shadcn/ui
├── engine/            # Motor 3D (WorldEngine, LOD, Instancing)
├── systems/city/      # Geração procedural e OSM
├── data/              # Serviços e registros de dados
├── hooks/             # React hooks customizados
├── pages/             # Rotas da aplicação
├── types/             # TypeScript types
└── contexts/          # React contexts (Auth)
supabase/
├── functions/         # Edge Functions (AI, pagamentos, webhooks)
└── config.toml        # Configuração do projeto
```

## 🚀 Desenvolvimento Local

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

## 📊 Banco de Dados

O projeto utiliza **55+ tabelas** cobrindo:

- **Usuários**: profiles, roles, permissões, verificações, wallets
- **Ativos**: assets, métricas, categorias, tags, tecnologias
- **Cidade**: buildings, distritos, eventos, transações
- **Agentes**: skills, reputação, missões, contratos, protocolos
- **Marketplace**: serviços, propostas, ofertas, deals, escrow
- **Financeiro**: pagamentos, fees, logs financeiros
- **Comunicação**: canais de chat, mensagens, conversas

## 📝 Licença

Projeto privado — todos os direitos reservados.
