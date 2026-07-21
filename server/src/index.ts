import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';

type JwtModule = typeof import('jsonwebtoken');
let jwtModule: JwtModule | null = null;
const getJwtModule = (): JwtModule => {
  if (!jwtModule) {
    jwtModule = require('jsonwebtoken') as JwtModule;
  }
  return jwtModule;
};
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import prisma from './config/database';

// Route imports
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import postRoutes from './routes/post.routes';
import teamRoutes from './routes/team.routes';
import tournamentRoutes from './routes/tournament.routes';
import chatRoutes from './routes/chat.routes';
import notificationRoutes from './routes/notification.routes';
import aiRoutes from './routes/ai.routes';
import analyticsRoutes from './routes/analytics.routes';
import feedRoutes from './routes/feed.routes';
import jobRoutes from './routes/job.routes';
import organizationRoutes from './routes/organization.routes';
import subscriptionRoutes from './routes/subscription.routes';
import adminRoutes from './routes/admin.routes';
import matchmakingRoutes from './routes/matchmaking.routes';
import passportRoutes from './routes/passport.routes';
import serverRoutes from './routes/server.routes';
import friendRoutes from './routes/friend.routes';
import presenceRoutes from './routes/presence.routes';
import newsRoutes from './routes/news.routes';

const app = express();
const httpServer = createServer(app);

// Dynamic Allowed Frontend URLs
const allowedOrigins = [
  "http://localhost:3000",
  "https://web-drab-nu-21.vercel.app",
  "https://gamerhub-web.onrender.com",
  process.env.FRONTEND_URL
].filter((origin): origin is string => Boolean(origin));

// Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 20000,
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = getJwtModule().verify(token, config.jwt.secret) as { userId: string };
    (socket as any).userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

const onlineUsers = new Set<string>();

io.on('connection', (socket) => {
  const userId = (socket as any).userId as string;
  console.log(`User connected: ${userId}`);
  socket.join(`user:${userId}`);
  onlineUsers.add(userId);
  io.emit('user:online', userId);

  socket.on('user:online', (uid: string) => {
    onlineUsers.add(uid);
    io.emit('user:online', uid);
  });

  socket.on('presence:update', (presence: string) => {
    if (presence === 'INVISIBLE' || presence === 'OFFLINE') {
      onlineUsers.delete(userId);
    } else {
      onlineUsers.add(userId);
    }
    io.emit('user:presence', { userId, presence });
  });

  socket.on('join:chat', (chatId: string) => {
    socket.join(`chat:${chatId}`);
  });
  socket.on('leave:chat', (chatId: string) => {
    socket.leave(`chat:${chatId}`);
  });

  socket.on('server:join', (serverId: string) => {
    socket.join(`server:${serverId}`);
  });
  socket.on('server:leave', (serverId: string) => {
    socket.leave(`server:${serverId}`);
  });

  socket.on('typing:start', (chatId: string) => {
    socket.to(`chat:${chatId}`).emit('typing:start', { userId, chatId });
  });
  socket.on('typing:stop', (chatId: string) => {
    socket.to(`chat:${chatId}`).emit('typing:stop', { userId, chatId });
  });

  socket.on('message:send', async (data: { chatId: string; content?: string; media?: string[]; gif?: string; voiceNote?: string }) => {
    try {
      const message = await prisma.message.create({
        data: {
          chatId: data.chatId,
          senderId: userId,
          content: data.content || '',
          media: data.media || [],
          gif: data.gif,
          voiceNote: data.voiceNote,
        },
        include: { sender: { select: { id: true, profile: true } } },
      });
      await prisma.chat.update({ where: { id: data.chatId }, data: { updatedAt: new Date() } });
      io.to(`chat:${data.chatId}`).emit('message:new', message);
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
    onlineUsers.delete(userId);
    io.emit('user:offline', userId);
  });
});

// Middleware
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: config.nodeEnv === "production" ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// Express automatically manages array origins & handles Preflight properly
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(compression());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'GamerHub API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/passport', passportRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/presence', presenceRoutes);
app.use('/api/news', newsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

httpServer.listen(config.port, () => {
  console.log(`GamerHub API running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export { app, httpServer, io };