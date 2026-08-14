import { Server, Socket } from 'socket.io';
import { config } from '../config';

// The JWT module is loaded lazily to match the existing index.ts wiring.
type JwtModule = typeof import('jsonwebtoken');
let jwtModule: JwtModule | null = null;
const getJwtModule = (): JwtModule => {
  if (!jwtModule) {
    jwtModule = require('jsonwebtoken') as JwtModule;
  }
  return jwtModule;
};

export interface SocketDeps {
  prisma: any;
  chatService: {
    sendMessage(chatId: string, senderId: string, data: any): Promise<any>;
    markAsRead(chatId: string, userId: string): Promise<{ messageIds: string[] }>;
  };
}

/** Minimal socket surface used by the event handlers (keeps them testable). */
export interface SocketLike {
  userId: string;
  join(room: string): void;
  leave(room: string): void;
  to(room: string): { emit(event: string, ...args: any[]): void };
  emit(event: string, ...args: any[]): void;
  handshake?: any;
}

export interface IoLike {
  emit(event: string, ...args: any[]): void;
  to(room: string): { emit(event: string, ...args: any[]): void };
}

const onlineUsers = new Set<string>();

/** Emit a structured error back to a single socket. */
function reject(socket: SocketLike, event: string, message: string): void {
  socket.emit('error', { event, message });
}

/**
 * True when `userId` is a participant of `chatId`.
 */
export async function isChatParticipant(prisma: any, chatId: string, userId: string): Promise<boolean> {
  if (!chatId || !userId) return false;
  const participant = await prisma.chatParticipant.findFirst({
    where: { chatId, userId },
    select: { id: true },
  });
  return Boolean(participant);
}

/**
 * Returns the user ids of every participant in `chatId` (empty when the chat
 * does not exist).
 */
export async function getChatParticipantUserIds(prisma: any, chatId: string): Promise<string[]> {
  if (!chatId) return [];
  const participants = await prisma.chatParticipant.findMany({
    where: { chatId },
    select: { userId: true },
  });
  return participants.map((p: any) => p.userId);
}

/**
 * Authorization rule for call/WebRTC signaling events: the sender must be a
 * participant of the chat AND the intended recipient must be another
 * participant of the SAME chat. Client-supplied identities are never trusted —
 * the sender is always the authenticated socket user.
 */
export async function assertSameChatPair(
  prisma: any,
  chatId: string,
  senderId: string,
  recipientId: string
): Promise<void> {
  if (!chatId || !recipientId) {
    throw new Error('Chat and recipient are required');
  }
  if (recipientId === senderId) {
    throw new Error('Recipient cannot be yourself');
  }
  const participantIds = await getChatParticipantUserIds(prisma, chatId);
  if (!participantIds.includes(senderId)) {
    throw new Error('Not a participant in this chat');
  }
  if (!participantIds.includes(recipientId)) {
    throw new Error('Recipient is not a participant in this chat');
  }
}

/** Build server-derived caller info from the DB — never trust the client. */
async function buildCallerInfo(prisma: any, userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { username: true, displayName: true, avatar: true },
  });
  return {
    id: userId,
    username: profile?.username || null,
    displayName: profile?.displayName || null,
    avatar: profile?.avatar || null,
  };
}

/**
 * Create the per-event handlers. Exported separately from the connection wiring
 * so authorization behavior can be unit-tested with mock sockets.
 */
export function createChatEventHandlers(io: IoLike, deps: SocketDeps) {
  const { prisma, chatService } = deps;

  return {
    async handleUserOnline(socket: SocketLike, _payload?: any): Promise<void> {
      onlineUsers.add(socket.userId);
      io.emit('user:online', socket.userId);
    },

    async handlePresenceUpdate(socket: SocketLike, presence: string): Promise<void> {
      const now = new Date();
      if (presence === 'INVISIBLE' || presence === 'OFFLINE') {
        onlineUsers.delete(socket.userId);
      } else {
        onlineUsers.add(socket.userId);
      }
      prisma.user.update({ where: { id: socket.userId }, data: { updatedAt: now } }).catch(() => {});
      io.emit('user:presence', { userId: socket.userId, presence });
    },

    async handleJoinChat(socket: SocketLike, chatId: string): Promise<void> {
      try {
        const allowed = await isChatParticipant(prisma, chatId, socket.userId);
        if (!allowed) {
          reject(socket, 'join:chat', 'Not authorized to join this chat');
          return;
        }
        socket.join(`chat:${chatId}`);
      } catch (err: any) {
        reject(socket, 'join:chat', err?.message || 'Failed to join chat');
      }
    },

    handleLeaveChat(socket: SocketLike, chatId: string): void {
      socket.leave(`chat:${chatId}`);
    },

    async handleTypingStart(socket: SocketLike, chatId: string): Promise<void> {
      try {
        const allowed = await isChatParticipant(prisma, chatId, socket.userId);
        if (!allowed) {
          reject(socket, 'typing:start', 'Not authorized to send typing events for this chat');
          return;
        }
        socket.to(`chat:${chatId}`).emit('typing:start', { userId: socket.userId, chatId });
      } catch {
        reject(socket, 'typing:start', 'Not authorized to send typing events for this chat');
      }
    },

    async handleTypingStop(socket: SocketLike, chatId: string): Promise<void> {
      try {
        const allowed = await isChatParticipant(prisma, chatId, socket.userId);
        if (!allowed) {
          reject(socket, 'typing:stop', 'Not authorized to send typing events for this chat');
          return;
        }
        socket.to(`chat:${chatId}`).emit('typing:stop', { userId: socket.userId, chatId });
      } catch {
        reject(socket, 'typing:stop', 'Not authorized to send typing events for this chat');
      }
    },

    async handleMessageSend(socket: SocketLike, data: { chatId: string; content?: string; media?: string[]; gif?: string; voiceNote?: string }): Promise<void> {
      try {
        const message = await chatService.sendMessage(data.chatId, socket.userId, data);
        io.to(`chat:${data.chatId}`).emit('message:new', message);
      } catch (error: any) {
        socket.emit('error', { event: 'message:send', message: error.message || 'Failed to send message' });
      }
    },

    async handleMessagesRead(socket: SocketLike, data: { chatId: string }): Promise<void> {
      try {
        const result = await chatService.markAsRead(data.chatId, socket.userId);
        if (result.messageIds.length > 0) {
          io.to(`chat:${data.chatId}`).emit('messages:read', {
            chatId: data.chatId,
            readBy: socket.userId,
            messageIds: result.messageIds,
          });
        }
      } catch (error: any) {
        console.warn('Failed to mark messages as read:', error.message);
      }
    },

    async handleCallRequest(socket: SocketLike, data: { toUserId: string; chatId: string; type: 'audio' | 'video'; callerInfo?: any }): Promise<void> {
      try {
        await assertSameChatPair(prisma, data.chatId, socket.userId, data.toUserId);
        if (data.type !== 'audio' && data.type !== 'video') {
          reject(socket, 'call:request', 'Invalid call type');
          return;
        }
        // callerInfo is built server-side; the client-provided value is ignored.
        const callerInfo = await buildCallerInfo(prisma, socket.userId);
        io.to(`user:${data.toUserId}`).emit('call:incoming', {
          fromUserId: socket.userId,
          chatId: data.chatId,
          type: data.type,
          callerInfo,
        });
      } catch (err: any) {
        reject(socket, 'call:request', err?.message || 'Not authorized to start a call');
      }
    },

    async handleCallAccept(socket: SocketLike, data: { toUserId: string; chatId: string; type: 'audio' | 'video' }): Promise<void> {
      try {
        await assertSameChatPair(prisma, data.chatId, socket.userId, data.toUserId);
        io.to(`user:${data.toUserId}`).emit('call:accepted', {
          fromUserId: socket.userId,
          chatId: data.chatId,
          type: data.type,
        });
      } catch (err: any) {
        reject(socket, 'call:accept', err?.message || 'Not authorized to accept this call');
      }
    },

    async handleCallReject(socket: SocketLike, data: { toUserId: string; chatId: string; reason?: string }): Promise<void> {
      try {
        await assertSameChatPair(prisma, data.chatId, socket.userId, data.toUserId);
        io.to(`user:${data.toUserId}`).emit('call:rejected', {
          fromUserId: socket.userId,
          chatId: data.chatId,
          reason: data.reason || 'Call rejected',
        });
      } catch (err: any) {
        reject(socket, 'call:reject', err?.message || 'Not authorized to reject this call');
      }
    },

    async handleCallOffer(socket: SocketLike, data: { toUserId: string; chatId: string; sdp: any }): Promise<void> {
      try {
        await assertSameChatPair(prisma, data.chatId, socket.userId, data.toUserId);
        io.to(`user:${data.toUserId}`).emit('call:offer', { fromUserId: socket.userId, sdp: data.sdp });
      } catch (err: any) {
        reject(socket, 'call:offer', err?.message || 'Not authorized to send call signaling');
      }
    },

    async handleCallAnswer(socket: SocketLike, data: { toUserId: string; chatId: string; sdp: any }): Promise<void> {
      try {
        await assertSameChatPair(prisma, data.chatId, socket.userId, data.toUserId);
        io.to(`user:${data.toUserId}`).emit('call:answer', { fromUserId: socket.userId, sdp: data.sdp });
      } catch (err: any) {
        reject(socket, 'call:answer', err?.message || 'Not authorized to send call signaling');
      }
    },

    async handleCallIceCandidate(socket: SocketLike, data: { toUserId: string; chatId: string; candidate: any }): Promise<void> {
      try {
        await assertSameChatPair(prisma, data.chatId, socket.userId, data.toUserId);
        io.to(`user:${data.toUserId}`).emit('call:ice-candidate', { fromUserId: socket.userId, candidate: data.candidate });
      } catch (err: any) {
        reject(socket, 'call:ice-candidate', err?.message || 'Not authorized to send call signaling');
      }
    },

    async handleCallIceRestart(socket: SocketLike, data: { toUserId: string; chatId: string; sdp: any }): Promise<void> {
      try {
        await assertSameChatPair(prisma, data.chatId, socket.userId, data.toUserId);
        io.to(`user:${data.toUserId}`).emit('call:ice-restart', { fromUserId: socket.userId, sdp: data.sdp });
      } catch (err: any) {
        reject(socket, 'call:ice-restart', err?.message || 'Not authorized to send call signaling');
      }
    },

    async handleCallEnd(socket: SocketLike, data: { toUserId: string; chatId: string }): Promise<void> {
      try {
        await assertSameChatPair(prisma, data.chatId, socket.userId, data.toUserId);
        io.to(`user:${data.toUserId}`).emit('call:ended', { fromUserId: socket.userId, chatId: data.chatId });
      } catch (err: any) {
        reject(socket, 'call:end', err?.message || 'Not authorized to end this call');
      }
    },

    async handleDisconnect(socket: SocketLike): Promise<void> {
      onlineUsers.delete(socket.userId);
      prisma.user.update({ where: { id: socket.userId }, data: { updatedAt: new Date() } }).catch(() => {});
      io.emit('user:offline', socket.userId);
    },
  };
}

/**
 * Register the Socket.IO auth middleware + connection wiring.
 *
 * Security model:
 *  - Sender identity is ALWAYS derived from the verified JWT in the socket
 *    handshake (`socket.userId`). Client-supplied user ids / callerInfo are
 *    never used for authorization.
 *  - `join:chat`, typing, read receipts, messages and every call/WebRTC event
 *    require the socket user to be a participant of the chat.
 *  - Call/WebRTC events additionally require the intended recipient to be
 *    another participant of the same chat, so unauthorized users can never
 *    receive call events or signaling.
 */
export function registerSocketEvents(io: Server, deps: SocketDeps): void {
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

  io.on('connection', (socket) => {
    const userId = (socket as any).userId as string;
    socket.join(`user:${userId}`);
    onlineUsers.add(userId);
    io.emit('user:online', userId);

    const h = createChatEventHandlers(io, deps);
    const authedSocket = socket as unknown as SocketLike;
    authedSocket.userId = userId;

    socket.on('user:online', () => void h.handleUserOnline(authedSocket));
    socket.on('presence:update', (presence: string) => void h.handlePresenceUpdate(authedSocket, presence));
    socket.on('join:chat', (chatId: string) => void h.handleJoinChat(authedSocket, chatId));
    socket.on('leave:chat', (chatId: string) => h.handleLeaveChat(authedSocket, chatId));
    socket.on('typing:start', (chatId: string) => void h.handleTypingStart(authedSocket, chatId));
    socket.on('typing:stop', (chatId: string) => void h.handleTypingStop(authedSocket, chatId));
    socket.on('message:send', (data: any) => void h.handleMessageSend(authedSocket, data));
    socket.on('messages:read', (data: any) => void h.handleMessagesRead(authedSocket, data));
    socket.on('call:request', (data: any) => void h.handleCallRequest(authedSocket, data));
    socket.on('call:accept', (data: any) => void h.handleCallAccept(authedSocket, data));
    socket.on('call:reject', (data: any) => void h.handleCallReject(authedSocket, data));
    socket.on('call:offer', (data: any) => void h.handleCallOffer(authedSocket, data));
    socket.on('call:answer', (data: any) => void h.handleCallAnswer(authedSocket, data));
    socket.on('call:ice-candidate', (data: any) => void h.handleCallIceCandidate(authedSocket, data));
    socket.on('call:ice-restart', (data: any) => void h.handleCallIceRestart(authedSocket, data));
    socket.on('call:end', (data: any) => void h.handleCallEnd(authedSocket, data));
    socket.on('disconnect', () => void h.handleDisconnect(authedSocket));
  });
}
