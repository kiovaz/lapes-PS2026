# 📚 8-Bit Books — Backend (API)

> API REST do e-commerce 8-Bit Books, construída com **NestJS**, **Prisma ORM**, **PostgreSQL**, **Redis**, **Stripe** e **Google Gemini (IA)**.

---

## 📋 Índice

- [Arquitetura](#-arquitetura)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Responsabilidades das Camadas](#-responsabilidades-das-camadas)
- [Banco de Dados](#-banco-de-dados)
- [Migrations](#-migrations)
- [Seed](#-seed)
- [Autenticação e Autorização](#-autenticação-e-autorização)
- [Middlewares](#-middlewares)
- [Tratamento de Erros](#-tratamento-de-erros)
- [Logs](#-logs)
- [Cache (Redis)](#-cache-redis)
- [Configuração](#-configuração)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Scripts](#-scripts)
- [Execução Local](#-execução-local)
- [Testes](#-testes)
- [Documentação da API (Swagger)](#-documentação-da-api-swagger)
- [Endpoints](#-endpoints)

---

## 🏗 Arquitetura

O backend segue a **arquitetura modular do NestJS**, com separação clara em módulos de domínio e módulos compartilhados (common):

```
AppModule
├── ThrottlerModule (Rate Limiting global)
├── PrismaModule (Banco de dados)
├── RedisModule (Cache + Locks)
├── GeminiModule (Integração com IA)
├── AuthModule (Autenticação JWT)
├── ProductsModule (Catálogo)
├── CartModule (Carrinho)
├── OrdersModule (Pedidos + Stripe + Webhooks)
├── CouponsModule (Cupons de desconto)
├── AddressesModule (Endereços)
├── WishlistModule (Favoritos)
└── AiModule (Busca inteligente + Chat)
```

**Padrão por módulo:** `Controller → Service → PrismaService`

Cada módulo contém:
- **Controller** — Define rotas e decorators (Swagger, Guards, Throttle)
- **Service** — Regras de negócio
- **DTOs** — Validação de entrada com `class-validator`
- **Spec** — Testes unitários (quando existente)

---

## 📁 Estrutura de Pastas

```
backend/
├── prisma/
│   ├── migrations/
│   │   ├── 20260522221855_init/
│   │   ├── 20260607154900_add_wishlist_items/
│   │   ├── 20260608103434_add_user_fields_address_shipping/
│   │   └── migration_lock.toml
│   ├── schema.prisma                # Schema do banco de dados
│   └── seed.ts                      # Seed de dados iniciais
├── src/
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts   # GlobalExceptionFilter
│   │   ├── gemini/
│   │   │   ├── gemini.module.ts
│   │   │   └── gemini.service.ts          # Integração Google Gemini
│   │   ├── logger/
│   │   │   └── logger.middleware.ts       # Middleware de log JSON
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts          # Wrapper do PrismaClient
│   │   ├── redis/
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts           # Cache, locks, SCAN
│   │   └── validators/
│   │       └── cpf.validator.ts           # Validador customizado de CPF
│   ├── modules/
│   │   ├── addresses/
│   │   │   ├── addresses.controller.ts
│   │   │   ├── addresses.module.ts
│   │   │   ├── addresses.service.ts
│   │   │   ├── addresses.service.spec.ts
│   │   │   └── dto/
│   │   │       ├── create-address.dto.ts
│   │   │       └── update-address.dto.ts
│   │   ├── ai/
│   │   │   ├── ai.controller.ts
│   │   │   ├── ai.module.ts
│   │   │   ├── ai.service.ts
│   │   │   └── dto/
│   │   │       ├── chat-message.dto.ts
│   │   │       └── smart-search.dto.ts
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.service.spec.ts
│   │   │   ├── decorators/
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   └── roles.decorator.ts
│   │   │   ├── dto/
│   │   │   │   ├── change-password.dto.ts
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── update-profile.dto.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   └── strategies/
│   │   │       └── jwt.strategy.ts
│   │   ├── cart/
│   │   │   ├── cart.controller.ts
│   │   │   ├── cart.module.ts
│   │   │   ├── cart.service.ts
│   │   │   ├── cart.service.spec.ts
│   │   │   └── dto/
│   │   │       ├── add-to-cart.dto.ts
│   │   │       └── update-cart-item.dto.ts
│   │   ├── coupons/
│   │   │   ├── coupons.controller.ts
│   │   │   ├── coupons.module.ts
│   │   │   ├── coupons.service.ts
│   │   │   ├── coupons.service.spec.ts
│   │   │   └── dto/
│   │   │       ├── create-coupon.dto.ts
│   │   │       ├── update-coupon.dto.ts
│   │   │       └── validate-coupon.dto.ts
│   │   ├── orders/
│   │   │   ├── orders.controller.ts
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.service.ts
│   │   │   ├── orders.service.spec.ts
│   │   │   ├── stripe.service.ts
│   │   │   ├── webhooks.controller.ts
│   │   │   └── dto/
│   │   │       ├── checkout.dto.ts
│   │   │       └── update-order-status.dto.ts
│   │   ├── products/
│   │   │   ├── products.controller.ts
│   │   │   ├── products.module.ts
│   │   │   ├── products.service.ts
│   │   │   ├── products.service.spec.ts
│   │   │   └── dto/
│   │   │       ├── create-product.dto.ts
│   │   │       ├── filter-products.dto.ts
│   │   │       └── update-product.dto.ts
│   │   └── wishlist/
│   │       ├── wishlist.controller.ts
│   │       ├── wishlist.module.ts
│   │       ├── wishlist.service.ts
│   │       └── wishlist.service.spec.ts
│   ├── app.module.ts                # Módulo raiz
│   ├── health.controller.ts         # Health check
│   └── main.ts                      # Bootstrap
├── test/
│   └── jest-e2e.json                # Config de testes e2e
├── .env.example                     # Template de variáveis
├── .eslintrc.js                     # Configuração ESLint
├── .prettierrc                      # Configuração Prettier
├── Dockerfile                       # Multi-stage build
├── jest.config.json                 # Configuração Jest
├── nest-cli.json                    # Config NestJS CLI
├── tsconfig.json                    # Config TypeScript
└── package.json
```

---

## 🧱 Responsabilidades das Camadas

| Camada | Responsabilidade |
|---|---|
| **Controllers** | Recebem requisições HTTP, validam entrada (DTOs), aplicam guards e decorators, delegam ao service |
| **Services** | Implementam regras de negócio, interagem com Prisma, Redis e serviços externos (Stripe, Gemini) |
| **DTOs** | Definem e validam a forma dos dados de entrada usando `class-validator` e `class-transformer` |
| **Guards** | `JwtAuthGuard` (autenticação) e `RolesGuard` (autorização por role) |
| **Decorators** | `@CurrentUser()` (extrai usuário do JWT), `@Roles()` (define roles permitidas) |
| **Filters** | `GlobalExceptionFilter` captura e padroniza todas as exceções |
| **Middlewares** | `LoggerMiddleware` loga todas as requisições em formato JSON |
| **Strategies** | `JwtStrategy` configura extração e validação do token JWT |

---

## 🗄 Banco de Dados

**SGBD:** PostgreSQL (recomendado: NeonDB para ambiente cloud)
**ORM:** Prisma ^5.0.0

### Modelos (Entidades)

| Modelo | Tabela | Descrição |
|---|---|---|
| `User` | `users` | Usuários do sistema (ADMIN ou CUSTOMER) |
| `Address` | `addresses` | Endereços dos usuários |
| `Product` | `products` | Produtos do catálogo (com soft delete via `deletedAt`) |
| `Cart` | `carts` | Carrinho de compras (1:1 com User) |
| `CartItem` | `cart_items` | Itens do carrinho (unique: cartId + productId) |
| `Order` | `orders` | Pedidos com status, total, desconto, dados de envio e integração Stripe |
| `OrderItem` | `order_items` | Itens do pedido com snapshot de preço (`priceAtPurchase`) |
| `Coupon` | `coupons` | Cupons de desconto (PERCENT ou FIXED) |
| `CouponUsage` | `coupon_usage` | Controle de uso de cupom por usuário (unique: couponId + userId) |
| `WishlistItem` | `wishlist_items` | Favoritos (unique: userId + productId) |

### Enums

| Enum | Valores |
|---|---|
| `Role` | `ADMIN`, `CUSTOMER` |
| `OrderStatus` | `PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| `CouponType` | `PERCENT`, `FIXED` |

### Diagrama de Relacionamentos

```
User ──── 1:1 ──── Cart
  │                  │
  │ 1:N              │ 1:N
  ▼                  ▼
Address           CartItem ──── N:1 ──── Product
Order                                      │
  │ 1:N                                    │ 1:N
  ▼                                        ▼
OrderItem                           WishlistItem
  │
Coupon ──── 1:N ──── CouponUsage
```

---

## 📦 Migrations

As migrations estão em `prisma/migrations/`:

| Migration | Descrição |
|---|---|
| `20260522221855_init` | Schema inicial: users, products, carts, cart_items, orders, order_items, coupons, coupon_usage |
| `20260607154900_add_wishlist_items` | Adição do modelo WishlistItem |
| `20260608103434_add_user_fields_address_shipping` | Campos de endereço de entrega nos pedidos, modelo Address, campos extras em User |

**Comandos:**

```bash
# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations em produção
npx prisma migrate deploy

# Reset completo (CUIDADO: apaga todos os dados)
npx prisma migrate reset --force
```

---

## 🌱 Seed

O arquivo `prisma/seed.ts` popula o banco com dados iniciais (produtos de exemplo, usuários, etc.).

```bash
npx prisma db seed
```

O seed é executado via `ts-node` conforme configurado no `package.json`:

```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

---

## 🔐 Autenticação e Autorização

### Autenticação

- **Estratégia:** JWT via `@nestjs/passport` + `passport-jwt`
- **Hash de senha:** `bcrypt` com salt rounds = 10
- **Token:** Gerado no login/registro, contém `{ sub: userId, email, role }`
- **Expiração:** Configurável via `JWT_EXPIRES_IN` (padrão: `7d`)
- **Validação:** `JwtStrategy` extrai o token do header `Authorization: Bearer <token>`

### Autorização

- **`JwtAuthGuard`** — Protege rotas que exigem autenticação
- **`RolesGuard`** — Verifica se o role do usuário é compatível com os roles definidos via `@Roles(Role.ADMIN)`
- **`@CurrentUser()`** — Decorator que extrai `{ userId, email, role }` do token JWT

### Fluxo

1. `POST /auth/register` → Cria usuário com senha hasheada → Retorna JWT
2. `POST /auth/login` → Valida credenciais → Retorna JWT
3. Requisições autenticadas enviam `Authorization: Bearer <token>`
4. Guards verificam presença e validade do token + role (quando aplicável)

---

## 🔧 Middlewares

| Middleware | Escopo | Descrição |
|---|---|---|
| `LoggerMiddleware` | Todas as rotas (`*`) | Loga método, rota, status code e duração em JSON |
| `ThrottlerGuard` (global) | Todas as rotas | Rate limiting: 30 req/60s (padrão) |

---

## ❌ Tratamento de Erros

O `GlobalExceptionFilter` captura **todas** as exceções e retorna:

```json
{
  "statusCode": 400,
  "message": "Mensagem de erro",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/endpoint"
}
```

- **Erros HTTP (4xx):** Logados como `warn`
- **Erros internos (5xx):** Logados como `error` com stack trace completo (nunca exposto ao cliente)

---

## 📝 Logs

- **Middleware:** `LoggerMiddleware` gera logs JSON estruturados com `timestamp`, `method`, `route`, `statusCode` e `duration`
- **NestJS Logger:** Usado nos services (Stripe, Redis, AI, etc.) para logs de domínio
- **Winston:** Disponível como dependência (`^3.11.0`), embora os logs atuais utilizem o Logger nativo do NestJS e `console.log`

---

## 🔴 Cache (Redis)

O `RedisService` provê:

| Método | Descrição |
|---|---|
| `get<T>(key)` | Busca valor com deserialização JSON automática |
| `set(key, value, ttlMs?)` | Armazena valor com TTL opcional |
| `del(key)` | Remove uma chave |
| `delByPattern(pattern)` | Remove chaves por padrão (SCAN + DEL) |
| `acquireLock(key, ttlMs)` | Distributed lock com SET NX EX |
| `releaseLock(key, token)` | Release com Lua script (atômico) |

**Uso no projeto:**
- Cache de listagem e detalhes de produtos (TTLs configuráveis)
- Lock distribuído no checkout (evita double-checkout)
- Health check do Redis

---

## ⚙ Configuração

| Arquivo | Descrição |
|---|---|
| `.env` / `.env.example` | Variáveis de ambiente |
| `nest-cli.json` | Configuração do NestJS CLI |
| `tsconfig.json` | Configuração TypeScript |
| `.eslintrc.js` | ESLint com `@typescript-eslint` + Prettier |
| `.prettierrc` | Formatação de código |
| `jest.config.json` | Configuração do Jest (ts-jest, rootDir, moduleNameMapper) |
| `Dockerfile` | Multi-stage Docker build (base → builder → production) |

---

## 🔐 Variáveis de Ambiente

Veja o arquivo `.env.example` para o template completo:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | URL de conexão PostgreSQL |
| `REDIS_URL` | ✅ | URL de conexão Redis |
| `JWT_SECRET` | ✅ | Chave secreta JWT |
| `JWT_EXPIRES_IN` | ❌ | Expiração do token (padrão: `7d`) |
| `PORT_API` | ❌ | Porta da API (padrão: `3000`) |
| `PORT_PRISMA_STUDIO` | ❌ | Porta do Prisma Studio (padrão: `5555`) |
| `STRIPE_SECRET_KEY` | ✅ | Chave secreta do Stripe |
| `STRIPE_PUBLIC_KEY` | ❌ | Chave pública do Stripe |
| `STRIPE_WEBHOOK_SECRET` | ❌ | Secret do webhook Stripe |
| `CACHE_PRODUCTS_LIST_TTL_MS` | ❌ | TTL cache listagem (padrão: `600000`) |
| `CACHE_PRODUCTS_DETAIL_TTL_MS` | ❌ | TTL cache detalhe (padrão: `900000`) |
| `CHECKOUT_LOCK_TTL_MS` | ❌ | TTL lock checkout (padrão: `30000`) |
| `GEMINI_API_KEY` | ❌ | Chave API Google Gemini (necessário para IA) |
| `GEMINI_MODEL` | ❌ | Modelo Gemini (padrão: `gemini-2.0-flash`) |

---

## 📜 Scripts

| Script | Descrição |
|---|---|
| `npm run start:dev` | Inicia em modo desenvolvimento com hot reload |
| `npm run start` | Inicia sem watch |
| `npm run start:prod` | Inicia em modo produção |
| `npm run build` | Compila TypeScript |
| `npm run lint` | Executa ESLint |
| `npm run lint:fix` | Corrige erros de lint |
| `npm run format` | Formata com Prettier |
| `npm test` | Executa testes unitários |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:cov` | Testes com cobertura |
| `npm run test:e2e` | Testes end-to-end |
| `npm run prisma:generate` | Gera Prisma Client |
| `npm run prisma:migrate` | Cria migration |
| `npm run prisma:reset` | Reset do banco |
| `npm run prisma:seed` | Popula banco |
| `npm run prisma:studio` | Abre Prisma Studio |
| `npm run prisma:studio:docker` | Abre Prisma Studio via Docker |
| `npm run docker:up` | Sobe containers |
| `npm run docker:down` | Para containers |

---

## 🖥 Execução Local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 3. Gerar Prisma Client
npx prisma generate

# 4. Aplicar migrations
npx prisma migrate dev

# 5. (Opcional) Popular banco com dados de exemplo
npx prisma db seed

# 6. Iniciar em modo desenvolvimento
npm run start:dev
```

A API estará disponível em `http://localhost:3000`.

---

## 🧪 Testes

**Framework:** Jest ^29.7.0 + ts-jest
**Config:** `jest.config.json`

```bash
# Rodar todos os testes
npm test

# Com cobertura
npm run test:cov

# Watch mode
npm run test:watch
```

### Testes unitários existentes

| Arquivo | Módulo |
|---|---|
| `auth.service.spec.ts` | Autenticação (registro, login, perfil, senha) |
| `products.service.spec.ts` | Produtos (CRUD, filtros, cache) |
| `cart.service.spec.ts` | Carrinho (adicionar, atualizar, remover) |
| `orders.service.spec.ts` | Pedidos (checkout, cancelamento, status, pagamento) |
| `coupons.service.spec.ts` | Cupons (CRUD, validação) |
| `addresses.service.spec.ts` | Endereços (CRUD, endereço padrão) |
| `wishlist.service.spec.ts` | Favoritos (adicionar, remover, verificar) |

### Testes e2e

Configuração disponível em `test/jest-e2e.json`, mas sem arquivos de teste e2e implementados no momento.

---

## 📖 Documentação da API (Swagger)

A documentação interativa está disponível em:

```
http://localhost:3000/docs
```

- **Título:** E-commerce 8-Bit Books
- **Versão:** 1.0
- **Autenticação:** Bearer Auth (JWT)
- **Gerada automaticamente** a partir dos decorators `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`, `@ApiProperty`

---

## 🌐 Endpoints

### Health

| Método | Rota | Descrição | Auth | Códigos |
|---|---|---|---|---|
| `GET` | `/health` | Verifica saúde da API, PostgreSQL e Redis | ❌ | `200`, `503` |

**Resposta 200:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "uptime": 12345.678,
  "services": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

---

### Auth (`/auth`)

| Método | Rota | Descrição | Auth | Rate Limit | Códigos |
|---|---|---|---|---|---|
| `POST` | `/auth/register` | Registra novo customer | ❌ | 5 req/60s | `201`, `409` |
| `POST` | `/auth/login` | Autentica usuário | ❌ | 10 req/60s | `200`, `401` |
| `GET` | `/auth/me` | Retorna perfil do usuário logado | ✅ Bearer | — | `200`, `401` |
| `PATCH` | `/auth/me` | Atualiza informações do perfil | ✅ Bearer | — | `200`, `401` |
| `PATCH` | `/auth/me/password` | Altera senha do usuário | ✅ Bearer | — | `200`, `400`, `401` |

#### `POST /auth/register`

**Body:**
```json
{
  "firstName": "João",
  "lastName": "Silva",
  "email": "joao@email.com",
  "cpf": "12345678909",
  "phone": "11999998888",
  "birthDate": "1990-05-15",
  "password": "123456"
}
```

**Resposta 201:**
```json
{
  "access_token": "eyJhbG...",
  "user": {
    "id": 1,
    "firstName": "João",
    "lastName": "Silva",
    "fullName": "João Silva",
    "email": "joao@email.com",
    "role": "CUSTOMER"
  }
}
```

#### `POST /auth/login`

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "123456"
}
```

**Resposta 200:** Mesma estrutura do registro.

---

### Products (`/products`)

| Método | Rota | Descrição | Auth | Rate Limit | Códigos |
|---|---|---|---|---|---|
| `GET` | `/products` | Lista produtos com filtros e paginação | ❌ | 30 req/60s | `200` |
| `GET` | `/products/categories` | Lista categorias disponíveis | ❌ | 30 req/60s | `200` |
| `GET` | `/products/:id` | Detalha um produto | ❌ | 30 req/60s | `200`, `404` |
| `POST` | `/products` | Cria produto | ✅ ADMIN | — | `201`, `401`, `403` |
| `PATCH` | `/products/:id` | Atualiza produto | ✅ ADMIN | — | `200`, `401`, `403`, `404` |
| `DELETE` | `/products/:id` | Remove produto (soft delete) | ✅ ADMIN | — | `200`, `401`, `403`, `404` |

#### `GET /products` — Query Parameters

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `search` | `string` | Busca por nome (case-insensitive) |
| `category` | `string` | Filtra por categoria exata |
| `minPrice` | `number` | Preço mínimo |
| `maxPrice` | `number` | Preço máximo |
| `page` | `number` | Página (padrão: 1) |
| `limit` | `number` | Itens por página (padrão: 10, max: 50) |
| `sortBy` | `string` | Ordenar por: `price`, `name`, `createdAt` |
| `order` | `string` | Direção: `asc`, `desc` |

**Resposta 200:**
```json
{
  "data": [{ "id": 1, "name": "...", "price": "29.90", ... }],
  "meta": { "total": 100, "page": 1, "limit": 10, "totalPages": 10 }
}
```

#### `POST /products` (ADMIN)

**Body:**
```json
{
  "name": "Livro Exemplo",
  "description": "Descrição do livro",
  "price": 59.9,
  "stock": 100,
  "category": "Ficção",
  "image": "https://exemplo.com/imagem.png"
}
```

---

### Cart (`/cart`)

> Todas as rotas requerem autenticação (`Bearer`).

| Método | Rota | Descrição | Códigos |
|---|---|---|---|
| `GET` | `/cart` | Retorna o carrinho do usuário | `200`, `401` |
| `POST` | `/cart/items` | Adiciona item ao carrinho | `201`, `400`, `401`, `404` |
| `PATCH` | `/cart/items/:id` | Atualiza quantidade de um item | `200`, `400`, `401`, `404` |
| `DELETE` | `/cart/items/:id` | Remove um item do carrinho | `200`, `401`, `404` |
| `DELETE` | `/cart` | Limpa todo o carrinho | `200`, `401` |

#### `POST /cart/items`

**Body:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

#### `PATCH /cart/items/:id`

**Body:**
```json
{
  "quantity": 3
}
```

---

### Orders (`/orders`)

> Todas as rotas requerem autenticação (`Bearer`).

| Método | Rota | Descrição | Auth Especial | Códigos |
|---|---|---|---|---|
| `POST` | `/orders/checkout` | Cria pedido a partir do carrinho | — | `201`, `400`, `401`, `409` |
| `GET` | `/orders` | Lista pedidos (admin vê todos) | — | `200`, `401` |
| `GET` | `/orders/:id` | Detalha um pedido | — | `200`, `401`, `403`, `404` |
| `PATCH` | `/orders/:id/cancel` | Cancela pedido (antes de SHIPPED) | — | `200`, `400`, `401`, `403`, `404` |
| `PATCH` | `/orders/:id/status` | Avança status do pedido | ADMIN | `200`, `400`, `401`, `403`, `404` |
| `PATCH` | `/orders/:id/confirm-payment` | Confirma pagamento | — | `200`, `400`, `401`, `403`, `404` |

#### `POST /orders/checkout`

**Body:**
```json
{
  "couponCode": "CUPOM10",
  "addressId": 1,
  "idempotencyKey": "checkout-uuid-abc123"
}
```

Todos os campos são opcionais. Se `addressId` não for informado, usa o endereço padrão do usuário.

**Resposta 201:**
```json
{
  "order": { "id": 1, "status": "PENDING", "total": "149.90", ... },
  "clientSecret": "pi_xxx_secret_xxx"
}
```

#### `PATCH /orders/:id/status` (ADMIN)

**Body:**
```json
{
  "status": "SHIPPED"
}
```

**Máquina de estados:** `PENDING → PAID → SHIPPED → DELIVERED`

---

### Coupons (`/coupons`)

> Todas as rotas requerem autenticação (`Bearer`).

| Método | Rota | Descrição | Auth Especial | Códigos |
|---|---|---|---|---|
| `POST` | `/coupons` | Cria cupom | ADMIN | `201`, `400`, `401`, `403`, `409` |
| `GET` | `/coupons` | Lista todos os cupons | ADMIN | `200`, `401`, `403` |
| `GET` | `/coupons/:id` | Detalha um cupom | ADMIN | `200`, `401`, `403`, `404` |
| `PATCH` | `/coupons/:id` | Atualiza cupom | ADMIN | `200`, `400`, `401`, `403`, `404`, `409` |
| `DELETE` | `/coupons/:id` | Remove cupom | ADMIN | `200`, `400`, `401`, `403`, `404` |
| `POST` | `/coupons/validate` | Valida cupom antes do checkout | — | `200`, `400`, `401`, `404` |

#### `POST /coupons` (ADMIN)

**Body:**
```json
{
  "code": "CUPOM10",
  "type": "PERCENT",
  "value": 10,
  "minOrderValue": 50,
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

#### `POST /coupons/validate`

**Body:**
```json
{
  "code": "CUPOM10",
  "subtotal": 150.00
}
```

**Resposta 200:**
```json
{
  "valid": true,
  "coupon": { ... },
  "subtotal": 150.00,
  "discount": 15.00,
  "total": 135.00
}
```

---

### Addresses (`/addresses`)

> Todas as rotas requerem autenticação (`Bearer`).

| Método | Rota | Descrição | Códigos |
|---|---|---|---|
| `POST` | `/addresses` | Cadastra novo endereço | `201`, `400`, `401` |
| `GET` | `/addresses` | Lista endereços do usuário | `200`, `401` |
| `GET` | `/addresses/:id` | Detalha um endereço | `200`, `401`, `403`, `404` |
| `PATCH` | `/addresses/:id` | Atualiza um endereço | `200`, `401`, `403`, `404` |
| `DELETE` | `/addresses/:id` | Remove um endereço | `200`, `401`, `403`, `404` |
| `PATCH` | `/addresses/:id/default` | Define como endereço padrão | `200`, `401`, `403`, `404` |

#### `POST /addresses`

**Body:**
```json
{
  "label": "Casa",
  "street": "Rua das Flores, 123",
  "complement": "Apto 42, Bloco B",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01001000",
  "isDefault": false
}
```

---

### Wishlist (`/wishlist`)

> Todas as rotas requerem autenticação (`Bearer`).

| Método | Rota | Descrição | Códigos |
|---|---|---|---|
| `GET` | `/wishlist` | Lista favoritos do usuário | `200`, `401` |
| `POST` | `/wishlist/:productId` | Adiciona produto aos favoritos | `201`, `401`, `404`, `409` |
| `DELETE` | `/wishlist/:productId` | Remove produto dos favoritos | `200`, `401`, `404` |
| `GET` | `/wishlist/:productId/check` | Verifica se produto está nos favoritos | `200`, `401` |

**Resposta do check:**
```json
{
  "isFavorited": true
}
```

---

### AI (`/ai`)

| Método | Rota | Descrição | Auth | Rate Limit | Códigos |
|---|---|---|---|---|---|
| `POST` | `/ai/search` | Busca inteligente com linguagem natural | ❌ | 15 req/60s | `200`, `400` |
| `POST` | `/ai/chat` | Chat com assistente virtual | ✅ Bearer | 20 req/60s | `200`, `401` |

#### `POST /ai/search`

**Body:**
```json
{
  "query": "livros de ficção até 50 reais"
}
```

**Resposta 200:**
```json
{
  "query": "livros de ficção até 50 reais",
  "interpretedFilters": {
    "category": "Ficção",
    "maxPrice": 50,
    "sortBy": "price",
    "sortOrder": "asc"
  },
  "data": [...],
  "meta": { ... }
}
```

#### `POST /ai/chat`

**Body:**
```json
{
  "message": "Quais são meus pedidos?",
  "history": [
    { "role": "user", "content": "Olá" },
    { "role": "model", "content": "Olá! Como posso ajudar?" }
  ]
}
```

**Resposta 200:**
```json
{
  "response": "Você tem 3 pedidos: ...",
  "functionsCalled": ["getOrders"]
}
```

**Funções disponíveis via function calling:**
- `searchProducts` — Busca no catálogo
- `getCategories` — Lista categorias
- `getProductDetails` — Detalhe de produto
- `getCart` — Carrinho do usuário
- `getOrders` — Pedidos do usuário
- `getOrderDetails` — Detalhe de pedido
- `checkCoupon` — Verifica cupom

---

### Webhooks (`/webhooks`)

| Método | Rota | Descrição | Auth | Códigos |
|---|---|---|---|---|
| `POST` | `/webhooks/stripe` | Webhook do Stripe (uso interno) | Assinatura Stripe | `200`, `400` |

> Este endpoint é excluído da documentação Swagger pública. Ele processa eventos `payment_intent.succeeded` e `payment_intent.payment_failed`.