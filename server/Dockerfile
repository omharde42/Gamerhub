FROM node:20-alpine
RUN apk add --no-cache openssl libssl1.1
RUN npm i -g tsx
WORKDIR /app
COPY package.json .
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
EXPOSE 4000
CMD ["tsx", "src/index.ts"]