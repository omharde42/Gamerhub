FROM node:20-alpine AS base
RUN npm i -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund && npm cache clean --force

FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN NEXT_TELEMETRY_DISABLED=1 npm run build && rm -rf .next/cache && npm prune --omit=dev --legacy-peer-deps

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.js ./
EXPOSE 3000
CMD ["npm", "start"]