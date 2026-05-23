
# 1: Base
FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate


# 2: builder - compiler ts
FROM base AS builder

COPY . .
RUN npm run build



# 3: prod

FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev

# builder topics
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

# SEC: user
USER node

EXPOSE 3000 5555

CMD ["node", "dist/src/main.js"]