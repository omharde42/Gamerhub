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

## Railway Deployment (Backend)
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Link: `railway link`
4. Deploy: `railway up`
5. Set environment variables in Railway dashboard

## Production Architecture
- Frontend: Vercel (auto-scaling, CDN)
- Backend: Railway/Supabase (managed PostgreSQL)
- Database: Supabase PostgreSQL
- Cache: Redis (Railway plugin)
- Storage: Cloudinary
- AI: OpenAI API
- Realtime: Socket.IO (same server)
