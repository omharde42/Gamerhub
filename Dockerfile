FROM node:20-alpine AS base
RUN npm i -g pnpm

FROM base AS server-deps
WORKDIR /app/server
COPY server/package.json .
RUN npm install

FROM base AS server-builder
WORKDIR /app/server
COPY server .
COPY --from=server-deps /app/server/node_modules ./node_modules
RUN npm run build

FROM base AS web-deps
WORKDIR /app/web
COPY web/package.json .
RUN npm install

FROM base AS web-builder
WORKDIR /app/web
COPY web .
COPY --from=web-deps /app/web/node_modules ./node_modules
RUN npm run build

FROM base AS runner
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/node_modules ./server/node_modules
COPY --from=server-builder /app/server/package.json ./server/
COPY --from=server-builder /app/server/prisma ./server/prisma
COPY --from=web-builder /app/web/.next ./web/.next
COPY --from=web-builder /app/web/public ./web/public
COPY --from=web-builder /app/web/node_modules ./web/node_modules
COPY --from=web-builder /app/web/package.json ./web/
COPY --from=web-builder /app/web/next.config.js ./web/

EXPOSE 4000 3000
CMD ["sh", "-c", "cd server && npx prisma generate && node dist/index.js & cd web && npm start"]
