# 🛒 E-commerce Simplificado — Desafio LAPES 2026

## 📋 Sobre
Sistema fullstack de e-commerce simplificado desenvolvido para o Processo Seletivo LAPES 2026.

## 🛠️ Stack
| Camada | Tecnologia |
|--------|-----------|
| **Backend** | Node.js + TypeScript + NestJS |
| **Banco** | PostgreSQL + Prisma ORM |
| **Cache** | Redis |
| **Auth** | JWT (Bearer Token) |
| **Validação** | class-validator + class-transformer |
| **Docs** | Swagger/OpenAPI |
| **Testes** | Jest + Supertest |
| **Infra** | Docker + docker-compose |
| **CI** | GitHub Actions |

## 🚀 Como rodar

### Pré-requisitos
- Docker e docker-compose instalados
- Node.js 20+ (pra rodar fora do Docker)

### Subir tudo com Docker (recomendado)
```bash
# 1. Clone o repositório
git clone <url-do-repo>
cd ecommerce-lapes

# 2. Copie o .env
cp .env.example .env

# 3. Suba os containers
docker-compose up -d

# 4. Rode as migrations
docker exec -it ecommerce-api npx prisma migrate dev

# 5. Rode o seed
docker exec -it ecommerce-api npm run prisma:seed

# 6. Acesse
# API: http://localhost:3000
# Swagger: http://localhost:3000/docs
```

### Rodar localmente (sem Docker)
```bash
# 1. Instale dependências
npm install

# 2. Configure o .env
cp .env.example .env
# Edite o .env com suas credenciais locais

# 3. Migrations + Seed
npm run prisma:migrate
npm run prisma:seed

# 4. Inicie
npm run start:dev
```

## 📧 Usuários de teste (seed)
| Role | Email | Senha |
|------|-------|-------|
| Admin | admin@lapes.com | 123456 |
| Customer | joao@email.com | 123456 |

## 🧪 Testes
```bash
npm test
```

## 📚 Documentação da API
Swagger disponível em `http://localhost:3000/docs` após iniciar o projeto.

## 📁 Estrutura do projeto
```
src/
 ├── modules/
 │   ├── auth/         (registro, login, JWT, guards)
 │   ├── products/     (CRUD, cache, filtros)
 │   ├── cart/         (carrinho persistente)
 │   ├── orders/       (checkout, pedidos, status)
 │   └── coupons/      (cupons de desconto)
 ├── common/
 │   ├── prisma/       (conexão com banco)
 │   ├── logger/       (logs em JSON)
 │   └── filters/      (tratamento de erros)
 ├── app.module.ts
 └── main.ts
```

## 🏗️ Decisões Técnicas
*In progress*

---
