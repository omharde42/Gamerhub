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

## Production Architecture
- Frontend: Vercel (auto-scaling, CDN)
- Backend: Render (managed Node.js)
- Database: Render PostgreSQL
- Cache: Redis (Render / Upstash)
- Storage: Cloudinary
- AI: OpenAI API
- Realtime: Socket.IO (same server)
