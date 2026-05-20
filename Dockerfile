FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl netcat-openbsd

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
