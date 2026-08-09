import express from 'express';
import path from 'path';
import fs from 'fs';
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
import { csrfProtection } from './middleware/csrf';
import prisma from './config/database';
import { chatService } from './services/chat.service';

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
import gameRequestRoutes from './routes/game-request.routes';
import appRoutes from './routes/app.routes';
import cryptoRoutes from './routes/crypto.routes';
import steamRoutes from './routes/steam.routes';
import gameStatsRoutes from './routes/game-stats.routes';
import clashOfClansRoutes from './routes/clashofclans.routes';

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
    const now = new Date();
    if (presence === 'INVISIBLE' || presence === 'OFFLINE') {
      onlineUsers.delete(userId);
    } else {
      onlineUsers.add(userId);
    }
    // Update updatedAt as a last-seen timestamp whenever presence changes
    prisma.user.update({ where: { id: userId }, data: { updatedAt: now } }).catch(() => {});
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
      const message = await chatService.sendMessage(data.chatId, userId, data);
      io.to(`chat:${data.chatId}`).emit('message:new', message);
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to send message' });
    }
  });

  // Read receipts: when a user reads messages, notify the chat room
  socket.on('messages:read', async (data: { chatId: string }) => {
    try {
      const result = await chatService.markAsRead(data.chatId, userId);
      // Notify the other participants with the actual message IDs that were marked
      if (result.messageIds.length > 0) {
        io.to(`chat:${data.chatId}`).emit('messages:read', {
          chatId: data.chatId,
          readBy: userId,
          messageIds: result.messageIds,
        });
      }
    } catch (error: any) {
      console.warn('Failed to mark messages as read:', error.message);
    }
  });

  // --- WebRTC Call Signaling Handlers ---
  socket.on('call:request', (data: { toUserId: string; chatId: string; type: 'audio' | 'video'; callerInfo: any }) => {
    io.to(`user:${data.toUserId}`).emit('call:incoming', {
      fromUserId: userId,
      chatId: data.chatId,
      type: data.type,
      callerInfo: data.callerInfo,
    });
  });

  socket.on('call:accept', (data: { toUserId: string; chatId: string; type: 'audio' | 'video' }) => {
    io.to(`user:${data.toUserId}`).emit('call:accepted', {
      fromUserId: userId,
      chatId: data.chatId,
      type: data.type,
    });
  });

  socket.on('call:reject', (data: { toUserId: string; chatId: string; reason?: string }) => {
    io.to(`user:${data.toUserId}`).emit('call:rejected', {
      fromUserId: userId,
      chatId: data.chatId,
      reason: data.reason || 'Call rejected',
    });
  });

  socket.on('call:offer', (data: { toUserId: string; sdp: any }) => {
    io.to(`user:${data.toUserId}`).emit('call:offer', {
      fromUserId: userId,
      sdp: data.sdp,
    });
  });

  socket.on('call:answer', (data: { toUserId: string; sdp: any }) => {
    io.to(`user:${data.toUserId}`).emit('call:answer', {
      fromUserId: userId,
      sdp: data.sdp,
    });
  });

  socket.on('call:ice-candidate', (data: { toUserId: string; candidate: any }) => {
    io.to(`user:${data.toUserId}`).emit('call:ice-candidate', {
      fromUserId: userId,
      candidate: data.candidate,
    });
  });

  socket.on('call:end', (data: { toUserId: string; chatId?: string }) => {
    if (data.toUserId) {
      io.to(`user:${data.toUserId}`).emit('call:ended', { fromUserId: userId, chatId: data.chatId });
    }
  });

  socket.on('call:ice-restart', (data: { toUserId: string; sdp: any }) => {
    io.to(`user:${data.toUserId}`).emit('call:ice-restart', {
      fromUserId: userId,
      sdp: data.sdp,
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
    onlineUsers.delete(userId);
    // Record last seen timestamp via updatedAt
    prisma.user.update({ where: { id: userId }, data: { updatedAt: new Date() } }).catch(() => {});
    io.emit('user:offline', userId);
  });
});

// Middleware
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:", "https:"],
        mediaSrc: ["'self'", "blob:", "https:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// Express automatically manages array origins & handles Preflight properly
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Ensure public/uploads directories exist
const uploadsRoot = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}
const postsDir = path.join(uploadsRoot, 'posts');
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}
const avatarsDir = path.join(uploadsRoot, 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}
const bannersDir = path.join(uploadsRoot, 'banners');
if (!fs.existsSync(bannersDir)) {
  fs.mkdirSync(bannersDir, { recursive: true });
}
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/downloads', express.static(path.join(__dirname, '../public/downloads')));
app.use(generalLimiter);

// CSRF Protection (double-submit cookie pattern for browser-based requests)
app.use(csrfProtection);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'GamerHub API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/app', appRoutes);
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
app.use('/api/game-requests', gameRequestRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/steam', steamRoutes);
app.get('/health', (req: any, res: any) => res.json({ success: true, message: 'GamerZ Hub API is running' }));
import gameSyncRoutes from './routes/game-sync.routes';
import gameModularRoutes from './routes/game-modular.routes';
import pubgRoutes from './routes/pubg.routes';
import compareRoutes from './routes/compare.routes';
import { clashOfClansController } from './controllers/clashofclans.controller';
import { pubgController } from './controllers/pubg.controller';
app.use('/api/clashofclans', clashOfClansRoutes);
app.get('/player/:tag', clashOfClansController.getPlayer);
app.get('/api/player/:tag', clashOfClansController.getPlayer);
app.get('/pubg/player/:platform/:playerName', pubgController.getPlayer);
app.get('/api/pubg/player/:platform/:playerName', pubgController.getPlayer);
app.use('/api/pubg', pubgRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/game-sync', gameSyncRoutes);
app.use('/api/game-stats', gameStatsRoutes);
app.use('/api/game', gameModularRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

httpServer.listen(config.port, () => {
  console.log(`GamerHub API running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export { app, httpServer, io };