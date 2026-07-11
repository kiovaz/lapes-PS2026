# 📚 8-Bit Books — Frontend

> Single Page Application do e-commerce 8-Bit Books, construída com **React 19**, **Vite**, **TypeScript**, **React Router DOM** e **Stripe.js**.

---

## 📋 Índice

- [Arquitetura](#-arquitetura)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Organização dos Componentes](#-organização-dos-componentes)
- [Páginas](#-páginas)
- [Layouts](#-layouts)
- [Gerenciamento de Estado](#-gerenciamento-de-estado)
- [Roteamento](#-roteamento)
- [Integração com Backend](#-integração-com-backend)
- [Autenticação](#-autenticação)
- [Bibliotecas Utilizadas](#-bibliotecas-utilizadas)
- [Estilização](#-estilização)
- [Responsividade](#-responsividade)
- [Performance](#-performance)
- [Configuração](#-configuração)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Scripts](#-scripts)
- [Build](#-build)
- [Testes](#-testes)
- [Lint](#-lint)
- [Convenções](#-convenções)

---

## 🏗 Arquitetura

O frontend segue uma arquitetura de **SPA (Single Page Application)** com React, organizada em camadas:

```
main.tsx (Entrypoint)
  └── App.tsx (Router + Providers)
        ├── ToastProvider (Notificações)
        │   └── AuthProvider (Estado de autenticação)
        │       └── CartProvider (Estado do carrinho)
        │           └── BrowserRouter
        │               ├── StoreLayout (Layout da loja)
        │               │   ├── Rotas públicas (Catálogo, Produto, Carrinho, Login, Registro)
        │               │   └── Rotas privadas (Checkout, Pedidos, Wishlist, Perfil, Endereços, Configurações)
        │               └── AdminLayout (Layout do admin)
        │                   └── Rotas admin (Produtos, Pedidos, Cupons)
```

**Padrão:** Camada de API (`api/`) → Context Providers → Páginas → Componentes

---

## 📁 Estrutura de Pastas

```
frontend/
├── public/                          # Assets estáticos públicos
├── src/
│   ├── api/                         # Camada de comunicação com o backend
│   │   ├── client.ts                # Instância Axios com interceptors
│   │   ├── auth.ts                  # Endpoints de autenticação
│   │   ├── products.ts              # Endpoints de produtos
│   │   ├── cart.ts                  # Endpoints de carrinho
│   │   ├── orders.ts               # Endpoints de pedidos
│   │   ├── coupons.ts              # Endpoints de cupons
│   │   ├── addresses.ts            # Endpoints de endereços
│   │   ├── wishlist.ts             # Endpoints de favoritos
│   │   └── ai.ts                   # Endpoints de IA (busca + chat)
│   ├── assets/
│   │   └── vite.svg                # Logo Vite
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx           # Header com navegação, busca e carrinho
│   │   │   ├── StoreLayout.tsx      # Layout da loja (Header + Outlet + ChatWidget)
│   │   │   ├── AdminLayout.tsx      # Layout do admin (Sidebar + Outlet)
│   │   │   └── AdminSidebar.tsx     # Sidebar de navegação do admin
│   │   └── ChatWidget.tsx           # Widget de chat com assistente IA
│   ├── contexts/
│   │   ├── AuthContext.tsx          # Estado global de autenticação
│   │   ├── CartContext.tsx          # Estado global do carrinho
│   │   └── ToastContext.tsx         # Sistema de notificações toast
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx        # Página de login
│   │   │   └── RegisterPage.tsx     # Página de registro
│   │   ├── store/
│   │   │   ├── CatalogPage.tsx      # Catálogo com filtros e paginação
│   │   │   ├── ProductPage.tsx      # Detalhe do produto
│   │   │   ├── CartPage.tsx         # Carrinho de compras
│   │   │   ├── CheckoutPage.tsx     # Checkout com Stripe
│   │   │   ├── OrdersPage.tsx       # Lista de pedidos
│   │   │   ├── OrderDetailPage.tsx  # Detalhe do pedido
│   │   │   └── WishlistPage.tsx     # Lista de favoritos
│   │   ├── account/
│   │   │   ├── ProfilePage.tsx      # Edição de perfil
│   │   │   ├── AddressesPage.tsx    # Gerenciamento de endereços
│   │   │   └── SettingsPage.tsx     # Configurações (alteração de senha)
│   │   └── admin/
│   │       ├── AdminProductsPage.tsx  # Gestão de produtos
│   │       ├── AdminOrdersPage.tsx    # Gestão de pedidos
│   │       └── AdminCouponsPage.tsx   # Gestão de cupons
│   ├── styles/
│   │   └── index.css                # CSS global da aplicação (~42KB)
│   ├── types/
│   │   └── index.ts                 # Tipos TypeScript centralizados
│   ├── utils/
│   │   ├── formatters.ts            # Formatação (moeda, data, CPF, telefone, CEP, status)
│   │   └── validators.ts            # Validação (CPF, email, telefone, CEP)
│   ├── App.css                      # CSS do App
│   ├── App.tsx                      # Componente raiz com rotas
│   ├── index.css                    # CSS reset mínimo
│   └── main.tsx                     # Entrypoint React
├── Dockerfile                       # Multi-stage build (Node → Nginx)
├── nginx.conf                       # Configuração do Nginx para SPA
├── vite.config.ts                   # Configuração Vite + proxies
├── tsconfig.json                    # Config TypeScript raiz
├── tsconfig.app.json                # Config TS para app
├── tsconfig.node.json               # Config TS para node (Vite)
├── .oxlintrc.json                   # Config do Oxlint
├── index.html                       # HTML entry point
└── package.json
```

---

## 🧩 Organização dos Componentes

### Componentes de Layout

| Componente | Descrição |
|---|---|
| `Header` | Barra de navegação principal com logo, links, busca, ícone de carrinho com badge e menu do usuário |
| `StoreLayout` | Layout wrapper para páginas da loja (Header + `<Outlet />` + ChatWidget) |
| `AdminLayout` | Layout wrapper para páginas admin (AdminSidebar + `<Outlet />`) |
| `AdminSidebar` | Sidebar com links de navegação do painel admin |

### Componentes Funcionais

| Componente | Descrição |
|---|---|
| `ChatWidget` | Widget flutuante de chat com assistente IA (Gemini). Só renderiza para usuários autenticados. Inclui botão FAB, janela de chat, histórico de mensagens e indicador de digitação |

---

## 📄 Páginas

### Loja (`/pages/store/`)

| Página | Rota | Descrição |
|---|---|---|
| `CatalogPage` | `/` | Catálogo de produtos com busca textual, filtros por categoria e faixa de preço, ordenação e paginação |
| `ProductPage` | `/products/:id` | Detalhe do produto com imagem, descrição, preço, estoque, botão de adicionar ao carrinho e favoritar |
| `CartPage` | `/cart` | Carrinho de compras com listagem de itens, controle de quantidade, remoção individual e total |
| `CheckoutPage` | `/checkout` | Fluxo de checkout: seleção de endereço, aplicação de cupom, resumo do pedido e pagamento via Stripe (CardElement) |
| `OrdersPage` | `/orders` | Listagem de pedidos do usuário com status, data e total |
| `OrderDetailPage` | `/orders/:id` | Detalhe do pedido com itens, endereço de entrega, cupom aplicado e opção de cancelamento |
| `WishlistPage` | `/wishlist` | Lista de produtos favoritos com opção de remover e adicionar ao carrinho |

### Autenticação (`/pages/auth/`)

| Página | Rota | Descrição |
|---|---|---|
| `LoginPage` | `/login` | Formulário de login com email e senha |
| `RegisterPage` | `/register` | Formulário de registro completo (nome, email, CPF, telefone, data nascimento, senha) com validação |

### Conta do Usuário (`/pages/account/`)

| Página | Rota | Descrição |
|---|---|---|
| `ProfilePage` | `/profile` | Visualização e edição do perfil (nome, telefone) |
| `AddressesPage` | `/addresses` | CRUD de endereços com formulário modal e seleção de endereço padrão |
| `SettingsPage` | `/settings` | Alteração de senha (senha atual + nova senha) |

### Admin (`/pages/admin/`)

| Página | Rota | Descrição |
|---|---|---|
| `AdminProductsPage` | `/admin/products` | CRUD de produtos com formulário modal, listagem com busca e exclusão (soft delete) |
| `AdminOrdersPage` | `/admin/orders` | Listagem de todos os pedidos com filtro por status e ação de avançar status |
| `AdminCouponsPage` | `/admin/coupons` | CRUD de cupons com formulário modal, listagem e exclusão |

---

## 📐 Layouts

### StoreLayout

O layout principal da loja, composto por:
1. **Header** — Barra de navegação com logo, links, busca e ações do usuário
2. **`<Outlet />`** — Conteúdo da página atual (React Router)
3. **`<ChatWidget />`** — Widget de chat flutuante com IA

### AdminLayout

Layout do painel administrativo, composto por:
1. **AdminSidebar** — Menu lateral com links para Produtos, Pedidos e Cupons
2. **`<Outlet />`** — Conteúdo da página admin

---

## 🔄 Gerenciamento de Estado

O estado é gerenciado via **React Context API** com três contextos:

### `AuthContext`

| Propriedade/Método | Tipo | Descrição |
|---|---|---|
| `user` | `User \| null` | Dados do usuário logado |
| `token` | `string \| null` | Token JWT |
| `isLoading` | `boolean` | Carregando autenticação |
| `isAuthenticated` | `boolean` | `!!user` |
| `isAdmin` | `boolean` | `user?.role === 'ADMIN'` |
| `login(token)` | `function` | Salva token no localStorage e carrega perfil |
| `logout()` | `function` | Remove token e limpa estado |
| `refreshUser()` | `function` | Recarrega dados do perfil |

**Persistência:** Token JWT armazenado no `localStorage`.

### `CartContext`

| Propriedade/Método | Tipo | Descrição |
|---|---|---|
| `cart` | `Cart \| null` | Dados completos do carrinho |
| `isLoading` | `boolean` | Carregando carrinho |
| `itemCount` | `number` | Quantidade total de itens |
| `refreshCart()` | `function` | Recarrega carrinho do backend |

**Comportamento:** Só carrega o carrinho se o usuário estiver autenticado. Atualiza automaticamente quando o estado de autenticação muda.

### `ToastContext`

| Propriedade/Método | Tipo | Descrição |
|---|---|---|
| `toasts` | `Toast[]` | Lista de toasts ativos |
| `addToast(message, type)` | `function` | Adiciona toast (auto-remove em 4s) |
| `removeToast(id)` | `function` | Remove toast manualmente |

**Tipos de toast:** `success`, `error`, `warning`, `info`

---

## 🗺 Roteamento

Gerenciado via **React Router DOM v7** (`BrowserRouter`).

### Rotas Públicas (dentro do StoreLayout)

| Rota | Componente | Descrição |
|---|---|---|
| `/` | `CatalogPage` | Catálogo de produtos |
| `/products/:id` | `ProductPage` | Detalhe do produto |
| `/cart` | `CartPage` | Carrinho |
| `/login` | `LoginPage` | Login |
| `/register` | `RegisterPage` | Registro |

### Rotas Privadas (dentro do StoreLayout, com `PrivateRoute`)

| Rota | Componente | Descrição |
|---|---|---|
| `/checkout` | `CheckoutPage` | Checkout |
| `/orders` | `OrdersPage` | Pedidos |
| `/orders/:id` | `OrderDetailPage` | Detalhe do pedido |
| `/wishlist` | `WishlistPage` | Favoritos |
| `/profile` | `ProfilePage` | Perfil |
| `/addresses` | `AddressesPage` | Endereços |
| `/settings` | `SettingsPage` | Configurações |

### Rotas Admin (dentro do AdminLayout)

| Rota | Componente | Descrição |
|---|---|---|
| `/admin/products` | `AdminProductsPage` | Gestão de produtos |
| `/admin/orders` | `AdminOrdersPage` | Gestão de pedidos |
| `/admin/coupons` | `AdminCouponsPage` | Gestão de cupons |

### Rota Fallback

| Rota | Comportamento |
|---|---|
| `*` | Redireciona para `/` |

### Proteção de Rotas

O componente `PrivateRoute` verifica:
1. Se `isLoading` → exibe spinner
2. Se `isAuthenticated` → renderiza `<Outlet />`
3. Se não autenticado → redireciona para `/login`

> **Nota:** As rotas admin não possuem proteção de role no frontend (apenas a verificação ocorre no backend). O frontend não impede a navegação, mas as chamadas à API falharão com `403` se o usuário não for ADMIN.

---

## 🔌 Integração com Backend

### Cliente HTTP

O arquivo `api/client.ts` cria uma instância **Axios** configurada com:

- **Base URL:** `VITE_API_URL` (ou string vazia para usar proxy do Vite)
- **Headers:** `Content-Type: application/json`
- **Request Interceptor:** Anexa automaticamente o token JWT do `localStorage` no header `Authorization: Bearer <token>`
- **Response Interceptor:** Em caso de `401` (exceto endpoints `/auth/*`), remove o token e redireciona para `/login`

### Módulos de API

Cada módulo de API exporta um objeto com métodos que encapsulam chamadas REST:

| Módulo | Arquivo | Endpoints |
|---|---|---|
| `authApi` | `api/auth.ts` | `register`, `login`, `getProfile`, `updateProfile`, `changePassword` |
| `productsApi` | `api/products.ts` | `findAll`, `findOne`, `getCategories`, `create`, `update`, `remove` |
| `cartApi` | `api/cart.ts` | `get`, `addItem`, `updateItem`, `removeItem`, `clear` |
| `ordersApi` | `api/orders.ts` | `checkout`, `findAll`, `findOne`, `cancel`, `advanceStatus`, `confirmPayment` |
| `couponsApi` | `api/coupons.ts` | `create`, `findAll`, `findOne`, `update`, `remove`, `validate` |
| `addressesApi` | `api/addresses.ts` | `create`, `findAll`, `findOne`, `update`, `remove`, `setDefault` |
| `wishlistApi` | `api/wishlist.ts` | `findAll`, `add`, `remove`, `check` |
| `aiApi` | `api/ai.ts` | `chat` |

### Proxy de Desenvolvimento

O `vite.config.ts` configura proxies para o backend durante o desenvolvimento:

```typescript
proxy: {
  '/auth':      { target: 'http://localhost:3000', changeOrigin: true },
  '/products':  { target: 'http://localhost:3000', changeOrigin: true },
  '/cart':      { target: 'http://localhost:3000', changeOrigin: true },
  '/orders':    { target: 'http://localhost:3000', changeOrigin: true },
  '/coupons':   { target: 'http://localhost:3000', changeOrigin: true },
  '/addresses': { target: 'http://localhost:3000', changeOrigin: true },
  '/wishlist':  { target: 'http://localhost:3000', changeOrigin: true },
  '/webhooks':  { target: 'http://localhost:3000', changeOrigin: true },
  '/ai':        { target: 'http://localhost:3000', changeOrigin: true },
}
```

> Com o proxy ativado, o frontend pode usar `VITE_API_URL` vazio (sem valor), e o Vite encaminhará as chamadas para `localhost:3000`.

---

## 🔐 Autenticação

### Fluxo de Autenticação

1. **Login/Registro** → Chama `POST /auth/login` ou `POST /auth/register`
2. **Salvar Token** → `AuthContext.login(token)` salva no `localStorage` e carrega o perfil via `GET /auth/me`
3. **Requisições Autenticadas** → Interceptor Axios anexa `Authorization: Bearer <token>` automaticamente
4. **Verificação de Estado** → `AuthContext` provê `isAuthenticated`, `isAdmin`, `user`
5. **Logout** → `AuthContext.logout()` remove token e limpa estado
6. **Expiração** → Interceptor de resposta detecta `401`, remove token e redireciona para `/login`

### Persistência

- Token JWT armazenado em `localStorage` com chave `token`
- Na inicialização, `AuthContext` tenta carregar o perfil se houver token salvo
- Se o token for inválido/expirado, o perfil retorna `401` e o token é removido

---

## 📦 Bibliotecas Utilizadas

### Dependências de Produção

| Biblioteca | Versão | Finalidade |
|---|---|---|
| `react` | ^19.2.7 | Framework UI |
| `react-dom` | ^19.2.7 | Renderização DOM |
| `react-router-dom` | ^7.18.1 | Roteamento SPA |
| `axios` | ^1.18.1 | Cliente HTTP |
| `@stripe/stripe-js` | ^9.9.0 | SDK Stripe para JS |
| `@stripe/react-stripe-js` | ^6.7.0 | Componentes React para Stripe (CardElement, Elements) |
| `lucide-react` | ^1.23.0 | Biblioteca de ícones (SVG) |

### Dependências de Desenvolvimento

| Biblioteca | Versão | Finalidade |
|---|---|---|
| `vite` | ^8.1.1 | Build tool e dev server |
| `@vitejs/plugin-react` | ^6.0.3 | Plugin React para Vite |
| `typescript` | ~6.0.2 | Tipagem estática |
| `@types/react` | ^19.2.17 | Tipos do React |
| `@types/react-dom` | ^19.2.3 | Tipos do ReactDOM |
| `@types/node` | ^24.13.2 | Tipos do Node.js |
| `oxlint` | ^1.71.0 | Linter rápido (Rust-based) |

---

## 🎨 Estilização

### Abordagem

O projeto utiliza **Vanilla CSS** com um único arquivo global principal:

- **`src/styles/index.css`** (~42KB) — Arquivo de estilo principal com:
  - CSS custom properties (variáveis de cores, espaçamentos, fontes)
  - Reset/normalize
  - Componentes estilizados (botões, formulários, cards, modais, tabelas)
  - Layout grid e flexbox
  - Animações e transições
  - Toast notifications
  - Chat widget
  - Responsividade

- **`src/App.css`** — Estilos mínimos específicos do App
- **`src/index.css`** — CSS reset mínimo (importa `styles/index.css`)

### Design System

> **Nota:** Não foi identificado um design system formal (como Material UI, Chakra, etc.). Os estilos são customizados via CSS puro com variáveis CSS para temas.

Os componentes utilizam classes CSS definidas no `styles/index.css`, incluindo:
- Variáveis de cor: `--color-warning`, `--color-accent`, `--color-success`, `--color-error`, `--color-info`, `--color-text-secondary`
- Classes utilitárias: `.spinner`, `.spinner-lg`, `.page-loading`
- Classes de componentes: `.toast-container`, `.toast`, `.chat-widget-container`, `.chat-fab`, `.chat-window`, etc.

---

## 📱 Responsividade

> **Nota:** A responsividade é implementada via CSS dentro de `styles/index.css` com media queries. O viewport é configurado no `index.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

O CSS em `styles/index.css` inclui media queries para adaptar o layout a diferentes tamanhos de tela.

---

## ⚡ Performance

### Build Tool

**Vite** é utilizado como build tool, oferecendo:
- **HMR (Hot Module Replacement)** rápido em desenvolvimento
- **ESBuild** para transformação de TypeScript
- **Rollup** para bundle de produção otimizado
- **Tree-shaking** automático
- **Code splitting** por rota (via React Router lazy loading, se implementado)

### Produção (Docker)

Em produção, o frontend é servido via **Nginx** com:
- Arquivos estáticos pré-compilados
- SPA fallback (`try_files $uri $uri/ /index.html`)
- Worker único para otimizar memória em containers

---

## ⚙ Configuração

| Arquivo | Descrição |
|---|---|
| `vite.config.ts` | Dev server (porta 5173), proxies para backend, plugin React |
| `tsconfig.json` | Referencia `tsconfig.app.json` e `tsconfig.node.json` |
| `tsconfig.app.json` | Config TS para código da aplicação |
| `tsconfig.node.json` | Config TS para arquivos de configuração (Vite) |
| `.oxlintrc.json` | Configuração do Oxlint |
| `nginx.conf` | Configuração do Nginx para produção (SPA fallback, proxy comentado) |
| `Dockerfile` | Multi-stage: Node 20 → build → Nginx Alpine |
| `index.html` | HTML entry point (lang=pt-BR, favicon emoji 📚, meta description) |

---

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_API_URL` | URL base da API backend | `http://localhost:3000` |
| `VITE_STRIPE_PUBLIC_KEY` | Chave pública do Stripe | `pk_test_...` |

> **Nota:** As variáveis com prefixo `VITE_` são expostas ao código do navegador via `import.meta.env`. Nunca coloque chaves secretas em variáveis `VITE_`.

### Em Docker

As variáveis são passadas como **build args** no `docker-compose.yml`:

```yaml
args:
  - VITE_STRIPE_PUBLIC_KEY=pk_test_...
  - VITE_API_URL=http://localhost:3000
```

---

## 📜 Scripts

| Script | Comando | Descrição |
|---|---|---|
| `dev` | `vite` | Inicia dev server com HMR (porta 5173) |
| `build` | `tsc -b && vite build` | Compila TypeScript e gera bundle de produção |
| `lint` | `oxlint` | Executa linting com Oxlint |
| `preview` | `vite preview` | Preview do bundle de produção |

---

## 🔨 Build

### Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173`. O Vite proxeia chamadas API para `http://localhost:3000`.

### Produção

```bash
npm run build
```

Output em `dist/`:
- `index.html`
- `assets/` — JS, CSS e assets compilados

### Docker

```bash
docker build \
  --build-arg VITE_STRIPE_PUBLIC_KEY=pk_test_... \
  --build-arg VITE_API_URL=http://api:3000 \
  -t ecommerce-frontend .
```

O Dockerfile usa multi-stage:
1. **Stage 1 (build):** `node:20-alpine` → `npm ci` → `npm run build`
2. **Stage 2 (serve):** `nginx:alpine` → copia `dist/` → configura Nginx

---

## 🧪 Testes

> **Nota:** O frontend **não possui testes automatizados** configurados no momento. Não há framework de teste instalado nem arquivos `.test.tsx` ou `.spec.tsx`.

---

## 🔍 Lint

O projeto utiliza **Oxlint** (linter baseado em Rust):

```bash
npm run lint
```

Configuração em `.oxlintrc.json`.

> Oxlint é uma alternativa rápida ao ESLint, focado em performance. Não possui sistema de plugins como o ESLint.

---

## 📏 Convenções

### Nomenclatura de Arquivos

| Tipo | Padrão | Exemplo |
|---|---|---|
| Páginas | `PascalCase` + `Page.tsx` | `CatalogPage.tsx`, `OrderDetailPage.tsx` |
| Componentes | `PascalCase.tsx` | `ChatWidget.tsx`, `Header.tsx` |
| Contexts | `PascalCase` + `Context.tsx` | `AuthContext.tsx`, `CartContext.tsx` |
| API modules | `camelCase.ts` | `products.ts`, `auth.ts` |
| Utilitários | `camelCase.ts` | `formatters.ts`, `validators.ts` |
| Tipos | `index.ts` (centralizado) | `types/index.ts` |
| Estilos | `camelCase.css` ou `index.css` | `styles/index.css` |

### Organização de Código

- **Tipos centralizados** em `types/index.ts` com interfaces para todas as entidades
- **API desacoplada** em `api/` com um módulo por domínio
- **Estado via Context** com hooks customizados (`useAuth`, `useCart`, `useToast`)
- **Validação no frontend** com funções utilitárias (CPF, email, telefone, CEP)
- **Formatação localizada** para pt-BR (moeda BRL, datas, CPF, telefone, CEP)

### Padrões Gerais

- Componentes funcionais com hooks (sem class components)
- TypeScript strict mode
- Export default para páginas e componentes
- Named exports para hooks e utilitários
- Idioma: Português brasileiro para interface; inglês para código (nomes de variáveis, funções)
