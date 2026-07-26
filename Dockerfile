FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY server/package.json .
RUN npm install && npm i -g tsx
COPY server .
RUN npx prisma generate
EXPOSE 4000
CMD ["npx", "tsx", "src/index.ts"]