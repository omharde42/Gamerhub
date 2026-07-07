# GamerHub Deployment Guide

## Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optional)

## Environment Variables
Copy `server/.env` and fill in all values:
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
OPENAI_API_KEY=...
```

## Local Development

### Backend
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

### Frontend
```bash
cd web
npm install
npm run dev
```

## Docker Deployment
```bash
docker-compose up --build
```

## Vercel Deployment (Frontend)
1. Push to GitHub
2. Import repo in Vercel
3. Set root directory to `web/`
4. Add env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`
5. Deploy

## Render Deployment (Backend)
1. Push the repo to GitHub
2. In Render dashboard, create a new **Web Service**
3. Connect your GitHub repo
4. Set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npx tsx src/index.ts`
5. Add a **PostgreSQL database** in Render (region: Singapore)
6. Set all required environment variables in Render dashboard (secrets marked `sync: false` in `render.yaml`)
7. Deploy

## Production Architecture
- Frontend: Vercel (auto-scaling, CDN)
- Backend: Render (managed Node.js)
- Database: Render PostgreSQL
- Cache: Redis (Render / Upstash)
- Storage: Cloudinary
- AI: OpenAI API
- Realtime: Socket.IO (same server)
