<p align="center">
  <h1 align="center">🛒 E-commerce LAPES</h1>
  <p align="center">
    <strong>E-commerce Simplificado — Desafio Técnico LAPES 2026</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs" alt="NestJS" />
    <img src="https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma" alt="Prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white" alt="Redis" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white" alt="CI" />
  </p>
</p>

---

## Descrição

API RESTful de e-commerce desenvolvida como desafio técnico do processo seletivo **LAPES 2026**. O sistema implementa fluxo de compra com autenticação, catálogo de produtos, carrinho, pedidos e cupons de desconto.

> Documentação interativa da API disponível via **Swagger** em `/docs` ao rodar o servidor.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Runtime** | Node.js 20 (Alpine) |
| **Framework** | NestJS 10 |
| **Linguagem** | TypeScript 5 |
| **ORM** | Prisma 5 |
| **Banco** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Auth** | Passport + JWT + Bcrypt |
| **Docs** | Swagger / OpenAPI |
| **Testes** | Jest |
| **CI/CD** | GitHub Actions |
| **Containers** | Docker + Compose |

---

## Arquitetura

O projeto segue o padrão **Modular Monolith** do NestJS — cada domínio é um módulo isolado com controller, service e DTOs próprios.

```
Cliente HTTP
    │
    ▼
NestJS API (:3000)
    ├── Auth Module ──► JWT Strategy ──► Passport
    ├── Throttler (Rate Limiting)
    ├── Logger Middleware (JSON estruturado)
    └── Global Exception Filter
                │
                ▼
         Prisma Service
                │
                ▼
        PostgreSQL (:5432)
```

**Principais decisões:**

- **Passport + JWT**: autenticação stateless, sem sessão no servidor
- **Prisma como ORM**: client 100% tipado, migrations versionadas
- **Global ValidationPipe**: `whitelist: true` + `forbidNonWhitelisted: true` em todas as rotas
- **Docker Compose**: API + PostgreSQL + Redis orquestrados

---

## Estrutura do Projeto

```
ecommerce-lapes/
├── .github/workflows/
│   └── ci.yml                          # Pipeline CI (build + test)
├── prisma/
│   ├── migrations/                     # Migrations versionadas
│   ├── schema.prisma                   # Schema do banco (6 models, 3 enums)
│   └── seed.ts                         # Seed com dados de desenvolvimento
├── src/
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts    # Exception filter global
│   │   ├── logger/
│   │   │   └── logger.middleware.ts         # Logger JSON em todas as rotas
│   │   └── prisma/
│   │       ├── prisma.module.ts            # Módulo global do Prisma
│   │       └── prisma.service.ts           # Service com lifecycle hooks
│   ├── modules/
│   │   └── auth/
│   │       ├── decorators/
│   │       │   ├── current-user.decorator.ts   # Extrai user do JWT
│   │       │   └── roles.decorator.ts          # Metadata de roles (RBAC)
│   │       ├── dto/
│   │       │   ├── login.dto.ts
│   │       │   └── register.dto.ts
│   │       ├── guards/
│   │       │   ├── jwt-auth.guard.ts       # Guard de autenticação
│   │       │   └── roles.guard.ts          # Guard de autorização (RBAC)
│   │       ├── strategies/
│   │       │   └── jwt.strategy.ts         # Estratégia Passport JWT
│   │       ├── auth.controller.ts
│   │       ├── auth.module.ts
│   │       ├── auth.service.ts
│   │       └── auth.service.spec.ts        # Testes unitários
│   ├── app.module.ts                   # Módulo raiz
│   └── main.ts                         # Bootstrap + Swagger + CORS
├── docker-compose.yml                  # 3 serviços: API + Postgres + Redis
├── Dockerfile                          # Node 20 Alpine
├── .env.example                        # Template de variáveis
└── package.json
```

---

## Modelagem do Banco

O schema Prisma define **6 models** e **3 enums** mapeados como tipos nativos do PostgreSQL:

**Models:** `User`, `Product`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Coupon`, `CouponUsage`

**Enums:** `Role` (ADMIN, CUSTOMER) · `OrderStatus` (PENDING, PAID, SHIPPED, DELIVERED, CANCELLED) · `CouponType` (PERCENT, FIXED)

### Relações

```
User  1──0..1  Cart           um carrinho por usuário
User  1──0..*  Order          usuário realiza pedidos
User  1──0..*  CouponUsage    registro de uso de cupom
Cart  1──0..*  CartItem       carrinho contém itens
Order 1──0..*  OrderItem      pedido contém itens
Order *──0..1  Coupon          pedido pode aplicar um cupom
Coupon 1──0..* CouponUsage    cupom registra usos
CartItem / OrderItem ──► Product
```

### Regras implementadas no schema

- `Decimal(10,2)` para todos os campos monetários (evita erros de ponto flutuante)
- `@@unique([cartId, productId])` em CartItem — impede produto duplicado no carrinho
- `@@unique([couponId, userId])` em CouponUsage — um cupom por usuário
- `priceAtPurchase` em OrderItem — snapshot do preço no momento da compra
- `deletedAt` em Product — soft delete para preservar integridade de pedidos
- `onDelete: Cascade` em CartItem e OrderItem

---

## Auth Module

Módulo de autenticação completo com registro, login e perfil protegido.

**Endpoints:**

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| `POST` | `/auth/register` | Registra novo customer | Não |
| `POST` | `/auth/login` | Autentica e retorna JWT | Não |
| `GET` | `/auth/me` | Retorna perfil do usuário logado | Bearer |

**Segurança:**

- Senhas hasheadas com **Bcrypt** (10 salt rounds)
- JWT com payload `{sub, email, role}` e expiração configurável
- Rate limiting por rota: register (5 req/min), login (10 req/min), global (30 req/min)
- `RolesGuard` + `@Roles()` decorator prontos para RBAC em qualquer módulo
- Senha **nunca** retornada nas responses

**Validação (class-validator):**

- `name`: obrigatório, mínimo 2 caracteres
- `email`: formato válido, obrigatório
- `password`: obrigatório, mínimo 6 caracteres
- Campos não declarados no DTO são **rejeitados** (`forbidNonWhitelisted`)

---

## Infraestrutura

### Docker Compose

3 serviços orquestrados via `docker-compose.yml` com **setup zero-config**:

| Serviço | Imagem | Porta (host) | Healthcheck |
|---------|--------|-------------|-------------|
| **api** | Build local (Dockerfile) | `3000` | — |
| **db** | `postgres:16-alpine` | `5433` | `pg_isready` |
| **redis** | `redis:7-alpine` | `6379` | `redis-cli ping` |

**Automação do setup:**
- `entrypoint.sh` aguarda Postgres via TCP, roda `prisma migrate deploy` + `prisma db seed`, e inicia a API
- `depends_on: condition: service_healthy` garante ordem correta de inicialização
- Valores padrão em todas as variáveis — funciona sem `.env`
- Hot-reload (`npm run start:dev`) com volume mount do código fonte

### CI/CD (GitHub Actions)

Pipeline executada em todo **push** e **PR** para `main`:

1. Checkout → Setup Node 20 → `npm ci`
2. `prisma generate` → `prisma migrate deploy`
3. `npm run build` → `npm test`

Services no CI: PostgreSQL 16 + Redis 7 com health checks.

### Logs

Todas as requisições são logadas em **JSON estruturado** pelo `LoggerMiddleware`:

```json
{
  "timestamp": "2026-05-13T20:15:30.123Z",
  "method": "POST",
  "route": "/auth/login",
  "statusCode": 200,
  "duration": "45ms"
}
```

Erros não tratados são capturados pelo `GlobalExceptionFilter` e retornados em formato padronizado:

```json
{
  "statusCode": 401,
  "message": "Credenciais inválidas.",
  "timestamp": "2026-05-13T20:15:30.123Z",
  "path": "/auth/login"
}
```

---

## Como Rodar

### Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose

### Com Docker (recomendado) — Setup Zero-Config

```bash
# Clone e rode — só isso!
git clone https://github.com/kiovaz/processo-seletivo-2026.git
cd processo-seletivo-2026
docker-compose up
```

> **Tudo é automático:** o sistema aguarda o Postgres ficar pronto, aplica as migrations, popula o banco com dados de desenvolvimento (seed) e inicia a API com hot-reload.

- 🌐 **API**: http://localhost:3000
- 📖 **Swagger**: http://localhost:3000/docs
- 🔑 **Login admin**: `admin@lapes.com` / `123456`
- 🛒 **Login cliente**: `joao@email.com` / `123456`

> **Nota:** O projeto funciona sem precisar criar um `.env` — valores padrão de desenvolvimento já estão configurados. Se quiser customizar, copie o `.env.example` para `.env` e ajuste.

### Comandos Úteis (Makefile)

| Comando | Descrição |
|---------|-----------|
| `make dev` | Sobe tudo com build |
| `make dev-d` | Sobe tudo em background |
| `make down` | Para todos os containers |
| `make logs` | Acompanha logs da API em tempo real |
| `make seed` | Re-executa o seed do banco |
| `make reset` | Destrói tudo (inclusive dados) e recria do zero |
| `make studio` | Abre o Prisma Studio na porta 5555 |

### Sem Docker (desenvolvimento local)

```bash
# Instale as dependências
npm install

# Configure .env apontando para seu PostgreSQL e Redis locais
cp .env.example .env

# Gere o Prisma Client e rode migrations
npx prisma generate
npx prisma migrate dev

# Execute o seed
npx prisma db seed

# Inicie em modo desenvolvimento
npm run start:dev
```

---

## Variáveis de Ambiente

Copie o `.env.example` e ajuste conforme necessário:

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string do PostgreSQL | `postgresql://postgres:postgres@db:5432/ecommerce` |
| `REDIS_URL` | Connection string do Redis | `redis://redis:6379` |
| `JWT_SECRET` | Chave secreta para assinar tokens | `minha-chave-secreta` |
| `JWT_EXPIRES_IN` | Tempo de expiração do JWT | `7d` |
| `PORT_API` | Porta exposta da API | `3000` |
| `PORT_POSTGRES` | Porta exposta do PostgreSQL | `5433` |
| `PORT_REDIS` | Porta exposta do Redis | `6379` |
| `POSTGRES_USER` | Usuário do PostgreSQL (Docker) | `postgres` |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL (Docker) | `postgres` |
| `POSTGRES_DB` | Nome do banco (Docker) | `ecommerce` |

---

## Seed

O seed popula o banco com dados de desenvolvimento:

- **Usuários**: `admin@lapes.com` (ADMIN) + `joao@email.com` (CUSTOMER) — senha: `123456`
- **Produtos**: 5 itens (roupas, acessórios, calçados) com preços e estoque
- **Cupons**: `LAPES10` (10% off, min R$50) + `FRETE20` (R$20 off, min R$100)
- **Carrinho**: carrinho do João com 2 itens

```bash
npx prisma db seed
```

---

## Testes

```bash
# Rodar testes
npm test

# Watch mode
npm run test:watch

# Cobertura
npm test -- --coverage
```

---

## Autores

| Nome | GitHub |
|------|--------|
| **Caio Vasconcelos** | [@kiovaz](https://github.com/kiovaz) |
| **Edgar Klewert** | [@edgarklewert](https://github.com/Edgar-Klewert) |