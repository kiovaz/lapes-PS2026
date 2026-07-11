# 📚 8-Bit Books — E-commerce

> E-commerce completo de livros desenvolvido com **NestJS** (backend) e **React + Vite** (frontend), com pagamento via **Stripe**, cache com **Redis**, banco **PostgreSQL** com **Prisma ORM** e assistente de compras com **IA (Gemini)**.

---

## 📋 Índice

- [Descrição](#-descrição)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura Geral](#-arquitetura-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura do Repositório](#-estrutura-do-repositório)
- [Fluxo de Funcionamento](#-fluxo-de-funcionamento)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Como Executar](#-como-executar)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Build](#-build)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [CI/CD](#-cicd)
- [Licença](#-licença)

---

## 📖 Descrição

**8-Bit Books** é um e-commerce simplificado de livros, desenvolvido como processo seletivo LAPES 2026. O projeto é composto por uma API REST (backend) e uma Single Page Application (frontend), containerizados com Docker.

**Autor:** Caio Vasconcelos

---

## ✨ Funcionalidades

### Loja (Customer)

| Funcionalidade | Descrição |
|---|---|
| **Catálogo de Produtos** | Listagem com filtros (busca, categoria, faixa de preço), paginação e ordenação |
| **Detalhes do Produto** | Visualização completa com imagem, descrição, preço e estoque |
| **Carrinho de Compras** | Adicionar, atualizar quantidade, remover itens e limpar carrinho |
| **Checkout com Stripe** | Pagamento via cartão com Stripe PaymentIntent + chave de idempotência |
| **Gestão de Pedidos** | Listagem, detalhamento e cancelamento de pedidos (com refund no Stripe) |
| **Cupons de Desconto** | Validação e aplicação de cupons (percentual ou valor fixo) |
| **Wishlist (Favoritos)** | Adicionar/remover produtos favoritos |
| **Endereços** | CRUD completo de endereços com seleção de padrão |
| **Perfil** | Visualização e edição de dados pessoais + alteração de senha |
| **Busca Inteligente com IA** | Busca em linguagem natural (ex: "livros até R$50") interpretada pela Gemini |
| **Assistente Virtual (Chat IA)** | Chat com function calling para consultar produtos, pedidos, carrinho e cupons |

### Painel Admin

| Funcionalidade | Descrição |
|---|---|
| **Gestão de Produtos** | CRUD com soft delete |
| **Gestão de Pedidos** | Listagem de todos os pedidos e atualização de status (PENDING → PAID → SHIPPED → DELIVERED) |
| **Gestão de Cupons** | CRUD completo com regras de remoção (não remove cupons vinculados a pedidos) |

### Infraestrutura

| Funcionalidade | Descrição |
|---|---|
| **Health Check** | Endpoint `/health` verifica PostgreSQL e Redis |
| **Rate Limiting** | Throttle global (30 req/60s) com limites customizados por endpoint |
| **Cache com Redis** | Cache de listagem e detalhes de produtos com TTL configurável |
| **Distributed Locking** | Lock via Redis para checkout (evita race conditions) |
| **Swagger/OpenAPI** | Documentação interativa da API em `/docs` |
| **Logs estruturados** | Middleware de log JSON em todas as rotas |
| **Tratamento global de erros** | GlobalExceptionFilter padroniza respostas de erro |

---

## 🏗 Arquitetura Geral

```
┌──────────────────────┐         ┌──────────────────────┐
│                      │  HTTP   │                      │
│   Frontend (React)   │────────▶│   Backend (NestJS)   │
│   Vite + SPA         │◀────────│   REST API           │
│   Porta 5173         │         │   Porta 3000         │
│                      │         │                      │
└──────────────────────┘         └────────┬─────────────┘
                                          │
                          ┌───────┬───────┼───────┐
                          │       │       │       │
                          ▼       ▼       ▼       ▼
                    ┌────────┐┌───────┐┌───────┐┌──────┐
                    │Postgres││ Redis ││Stripe ││Gemini│
                    │(NeonDB)││(Upst.)││  API  ││ (AI) │
                    └────────┘└───────┘└───────┘└──────┘
```

**Padrão Arquitetural:** Modular (NestJS Modules) com camadas de Controller → Service → Módulos compartilhados (Prisma, Redis, Gemini) e serviços externos (Stripe).

---

## 🛠 Stack Tecnológica

### Backend

| Tecnologia | Versão | Finalidade |
|---|---|---|
| Node.js | 20 | Runtime |
| NestJS | ^10.0.0 | Framework HTTP |
| TypeScript | ^5.3.0 | Linguagem |
| Prisma | ^5.0.0 | ORM |
| PostgreSQL | 18 | Banco de dados relacional |
| Redis (ioredis) | ^5.3.0 | Cache e locks distribuídos |
| Passport + JWT | ^0.7.0 / ^4.0.0 | Autenticação |
| @nestjs/passport | ^10.0.0 | Integração Passport com NestJS |
| @nestjs/jwt | ^10.0.0 | Módulo JWT do NestJS |
| @nestjs/throttler | ^5.0.0 | Rate Limiting |
| Stripe | ^22.1.1 | Pagamentos |
| Swagger | ^7.0.0 | Documentação da API |
| Gemini (Google AI) | ^0.24.1 | Inteligência artificial |
| bcrypt | ^5.1.1 | Hash de senhas |
| Winston | ^3.11.0 | Logging |
| class-validator | ^0.14.0 | Validação de DTOs |
| class-transformer | ^0.5.1 | Transformação de dados |
| Jest | ^29.7.0 | Testes |

### Frontend

| Tecnologia | Versão | Finalidade |
|---|---|---|
| React | ^19.2.7 | Framework UI |
| Vite | ^8.1.1 | Build tool e dev server |
| TypeScript | ~6.0.2 | Linguagem |
| React Router DOM | ^7.18.1 | Roteamento SPA |
| Axios | ^1.18.1 | Cliente HTTP |
| Stripe.js | ^9.9.0 | Integração de pagamento |
| @stripe/react-stripe-js | ^6.7.0 | Componentes React do Stripe |
| Lucide React | ^1.23.0 | Ícones |
| Oxlint | ^1.71.0 | Linter |

### Infraestrutura

| Tecnologia | Finalidade |
|---|---|
| Docker | Containerização |
| Docker Compose | Orquestração local |
| Nginx | Servidor web do frontend (produção) |
| GitHub Actions | CI/CD |

---

## 📁 Estrutura do Repositório

```
ecommerce-lapes/
├── .github/
│   └── workflows/
│       └── ci.yml                  # Pipeline CI (backend + frontend)
├── backend/
│   ├── prisma/
│   │   ├── migrations/             # Migrations do banco de dados
│   │   ├── schema.prisma           # Schema do banco de dados
│   │   └── seed.ts                 # Seed de dados iniciais
│   ├── src/
│   │   ├── common/                 # Módulos compartilhados
│   │   │   ├── filters/            # GlobalExceptionFilter
│   │   │   ├── gemini/             # Integração com Google Gemini
│   │   │   ├── logger/             # Middleware de log
│   │   │   ├── prisma/             # PrismaModule/Service
│   │   │   ├── redis/              # RedisModule/Service + locks
│   │   │   └── validators/         # Validadores customizados (CPF)
│   │   ├── modules/                # Módulos de domínio
│   │   │   ├── addresses/          # CRUD de endereços
│   │   │   ├── ai/                 # Busca inteligente + chat IA
│   │   │   ├── auth/               # Registro, login, perfil, JWT
│   │   │   ├── cart/               # Carrinho de compras
│   │   │   ├── coupons/            # Cupons de desconto
│   │   │   ├── orders/             # Pedidos, checkout, Stripe, webhooks
│   │   │   ├── products/           # Catálogo de produtos
│   │   │   └── wishlist/           # Lista de favoritos
│   │   ├── app.module.ts           # Módulo raiz
│   │   ├── health.controller.ts    # Health check
│   │   └── main.ts                 # Bootstrap da aplicação
│   ├── test/                       # Config de testes e2e
│   ├── Dockerfile                  # Multi-stage Docker build
│   ├── .env.example                # Template de variáveis de ambiente
│   └── package.json
├── frontend/
│   ├── public/                     # Assets estáticos
│   ├── src/
│   │   ├── api/                    # Camada de comunicação com o backend (Axios)
│   │   ├── assets/                 # Assets compilados
│   │   ├── components/             # Componentes reutilizáveis
│   │   │   ├── layout/             # Header, StoreLayout, AdminLayout, AdminSidebar
│   │   │   └── ChatWidget.tsx      # Widget de chat com IA
│   │   ├── contexts/               # React Contexts (Auth, Cart, Toast)
│   │   ├── pages/                  # Páginas da aplicação
│   │   │   ├── account/            # Perfil, Endereços, Configurações
│   │   │   ├── admin/              # Produtos, Pedidos, Cupons (admin)
│   │   │   ├── auth/               # Login, Registro
│   │   │   └── store/              # Catálogo, Produto, Carrinho, Checkout, Pedidos, Wishlist
│   │   ├── styles/                 # CSS global
│   │   ├── types/                  # Tipos TypeScript
│   │   └── utils/                  # Formatadores e validadores
│   ├── Dockerfile                  # Multi-stage Docker build (Nginx)
│   ├── nginx.conf                  # Configuração do Nginx
│   ├── vite.config.ts              # Configuração do Vite + proxy
│   └── package.json
├── docker-compose.yml              # Orquestração dos containers
├── .gitignore
└── README.md                       # Este arquivo
```

---

## 🔄 Fluxo de Funcionamento

1. **Registro/Login** → Usuário se cadastra ou faz login, recebe JWT.
2. **Navegação** → Navega pelo catálogo com filtros, busca textual ou busca inteligente via IA.
3. **Carrinho** → Adiciona produtos ao carrinho (validação de estoque em tempo real).
4. **Checkout** → Seleciona endereço, aplica cupom (opcional), cria pedido com lock distribuído (Redis).
5. **Pagamento** → Backend cria PaymentIntent no Stripe, frontend confirma pagamento com `confirmCardPayment`.
6. **Confirmação** → Frontend chama `PATCH /orders/:id/confirm-payment`, backend verifica no Stripe e atualiza status para PAID.
7. **Webhook (fallback)** → Stripe envia webhook `payment_intent.succeeded` para `POST /webhooks/stripe` como backup.
8. **Gestão** → Admin gerencia produtos, pedidos (avança status) e cupons.

---

## 📦 Pré-requisitos

- **Node.js** ≥ 20
- **npm** ≥ 9
- **Docker** e **Docker Compose** (para execução containerizada)
- **PostgreSQL** (ou usar NeonDB na nuvem)
- **Redis** (ou usar Upstash na nuvem)
- Conta no **Stripe** (chaves de teste)
- *(Opcional)* Chave de API do **Google Gemini** para funcionalidades de IA

---

## 🚀 Instalação

### Método 1: Docker Compose (Recomendado para desenvolvimento)

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd ecommerce-lapes

# Configurar variáveis de ambiente
cp backend/.env.example backend/.env
# Editar backend/.env com suas credenciais

# Subir os containers
docker compose up -d
```

### Método 2: Execução Local

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed   # (opcional) popular banco com dados iniciais
npm run start:dev

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev
```

---

## ⚙ Configuração

### Banco de Dados

O projeto utiliza **PostgreSQL** via Prisma ORM. O schema está em `backend/prisma/schema.prisma`.

```bash
# Gerar cliente Prisma
npx prisma generate

# Criar/aplicar migrations
npx prisma migrate dev

# Popular banco com dados de exemplo
npx prisma db seed

# Visualizar dados no Prisma Studio
npx prisma studio
```

### Stripe

1. Crie uma conta no [Stripe Dashboard](https://dashboard.stripe.com/).
2. Copie as chaves de teste (`pk_test_...` e `sk_test_...`).
3. Configure a `STRIPE_WEBHOOK_SECRET` para webhooks (opcional em dev).

---

## 🔐 Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexão PostgreSQL (NeonDB) | `postgresql://user:pass@host/db?sslmode=require` |
| `REDIS_URL` | URL de conexão Redis (Upstash) | `rediss://default:pass@host:6379` |
| `JWT_SECRET` | Chave secreta para assinatura JWT | `my-secret-dev-key123` |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | `7d` |
| `PORT_API` | Porta da API | `3000` |
| `PORT_PRISMA_STUDIO` | Porta do Prisma Studio | `5555` |
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe | `sk_test_...` |
| `STRIPE_PUBLIC_KEY` | Chave pública do Stripe | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret do webhook Stripe | `whsec_...` |
| `CACHE_PRODUCTS_LIST_TTL_MS` | TTL do cache de listagem de produtos | `600000` (10 min) |
| `CACHE_PRODUCTS_DETAIL_TTL_MS` | TTL do cache de detalhe de produto | `900000` (15 min) |
| `CHECKOUT_LOCK_TTL_MS` | TTL do lock de checkout (Redis) | `30000` (30s) |
| `GEMINI_API_KEY` | Chave de API do Google Gemini | `your_gemini_api_key_here` |
| `GEMINI_MODEL` | Modelo Gemini utilizado | `gemini-2.0-flash` |

### Frontend (`frontend/.env`)

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_API_URL` | URL base da API backend | `http://localhost:3000` |
| `VITE_STRIPE_PUBLIC_KEY` | Chave pública do Stripe | `pk_test_...` |

---

## ▶ Como Executar

### Com Docker Compose

```bash
docker compose up -d
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/docs |
| Prisma Studio | http://localhost:5555 |

### Localmente (sem Docker)

```bash
# Terminal 1 — Backend
cd backend
npm run start:dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

---

## 📜 Scripts Disponíveis

### Backend (`backend/package.json`)

| Script | Comando | Descrição |
|---|---|---|
| `start:dev` | `nest start --watch` | Dev com hot reload |
| `start` | `nest start` | Inicia sem watch |
| `start:prod` | `node dist/src/main` | Produção |
| `build` | `nest build` | Compila TypeScript |
| `lint` | `eslint "{src,test}/**/*.ts"` | Lint com ESLint |
| `lint:fix` | `eslint ... --fix` | Corrigir lint |
| `format` | `prettier --write ...` | Formatar código |
| `test` | `jest --passWithNoTests` | Rodar testes unitários |
| `test:watch` | `jest --watch` | Testes em watch mode |
| `test:cov` | `jest --coverage` | Testes com cobertura |
| `test:e2e` | `jest --config ./test/jest-e2e.json` | Testes end-to-end |
| `prisma:generate` | `prisma generate` | Gerar Prisma Client |
| `prisma:migrate` | `prisma migrate dev` | Criar migration |
| `prisma:reset` | `prisma migrate reset --force` | Reset do banco |
| `prisma:seed` | `prisma db seed` | Popular banco |
| `prisma:studio` | `prisma studio` | Interface visual do banco |
| `docker:up` | `docker compose up -d` | Subir containers |
| `docker:down` | `docker compose down` | Parar containers |

### Frontend (`frontend/package.json`)

| Script | Comando | Descrição |
|---|---|---|
| `dev` | `vite` | Dev server com HMR |
| `build` | `tsc -b && vite build` | Build de produção |
| `lint` | `oxlint` | Lint com Oxlint |
| `preview` | `vite preview` | Preview do build |

---

## 🔨 Build

### Backend

```bash
cd backend
npm run build
# Output em backend/dist/
```

### Frontend

```bash
cd frontend
npm run build
# Output em frontend/dist/
```

### Docker (Produção)

Ambos os Dockerfiles usam **multi-stage builds**:

- **Backend:** `node:20-alpine` → compila TS → copia apenas `dist/` + `prisma/` + dependências de produção → roda como usuário `node`.
- **Frontend:** `node:20-alpine` → compila com Vite → `nginx:alpine` serve os estáticos com SPA fallback.

---

## 🧪 Testes

O backend possui testes unitários com **Jest** e **ts-jest**:

```bash
cd backend

# Rodar testes
npm test

# Testes com cobertura
npm run test:cov

# Testes em watch mode
npm run test:watch
```

**Arquivos de teste existentes:**
- `auth.service.spec.ts`
- `products.service.spec.ts`
- `cart.service.spec.ts`
- `orders.service.spec.ts`
- `coupons.service.spec.ts`
- `addresses.service.spec.ts`
- `wishlist.service.spec.ts`

> **Nota:** O frontend não possui testes automatizados configurados no momento.

---

## 🚢 Deploy

### Docker Compose (Produção)

```bash
docker compose up -d --build
```

O `docker-compose.yml` define dois serviços:

- **api** — Backend NestJS (porta 3000) com Prisma Studio (porta 5555)
- **frontend** — React servido via Nginx (porta 80, mapeada para 5173)

### Variáveis de ambiente para build do frontend em Docker

No `docker-compose.yml`, as variáveis do frontend são passadas como `build args`:

```yaml
args:
  - VITE_STRIPE_PUBLIC_KEY=pk_test_...
  - VITE_API_URL=http://localhost:3000
```

---

## 🔁 CI/CD

O projeto utiliza **GitHub Actions** com o workflow `.github/workflows/ci.yml`:

### Job: `backend-ci`
- Roda em `ubuntu-latest`
- **Services:** PostgreSQL 16 + Redis 7
- **Steps:** checkout → Node.js 20 → `npm ci` → `prisma generate` → `prisma migrate deploy` → lint → build → testes com cobertura

### Job: `frontend-ci`
- Roda em `ubuntu-latest` (paralelo ao backend)
- **Steps:** checkout → Node.js 20 → `npm ci` → lint (Oxlint) → build

**Triggers:** Push e PR na branch `main`.

---
## 📄 Licença

Este projeto está licenciado sob a licença **MIT**. Veja o campo `license` em `backend/package.json`.