'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';

export interface PresenceUser {
  userId: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  activity?: string;
  lastSeen?: Date;
}

export interface TypingUser {
  userId: string;
  chatId: string;
  username: string;
}

export function usePresence() {
  const socket = useSocket();
  const { user } = useAuthStore();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceUser>>(new Map());
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    if (!socket || !user?.id) return;

    socket.emit('user:online', user.id);

    const handleOnline = (userId: string) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
      setPresenceMap((prev) => {
        const next = new Map(prev);
        next.set(userId, { userId, status: 'online' });
        return next;
      });
    };

    const handleOffline = (userId: string) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setPresenceMap((prev) => {
        const next = new Map(prev);
        next.set(userId, { userId, status: 'offline', lastSeen: new Date() });
        return next;
      });
    };

    const handlePresenceUpdate = (data: PresenceUser) => {
      setPresenceMap((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data);
        return next;
      });
      if (data.status === 'online') {
        setOnlineUsers((prev) => new Set(prev).add(data.userId));
      } else {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    const handleTypingStart = (data: { userId: string; chatId: string; username: string }) => {
      if (data.userId === user.id) return;
      setTypingUsers((prev) => {
        const exists = prev.some((t) => t.userId === data.userId && t.chatId === data.chatId);
        if (exists) return prev;
        return [...prev, data];
      });
    };

    const handleTypingStop = (data: { userId: string; chatId: string }) => {
      setTypingUsers((prev) => prev.filter((t) => !(t.userId === data.userId && t.chatId === data.chatId)));
    };

    socket.on('user:online', handleOnline);
    socket.on('user:offline', handleOffline);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('user:online', handleOnline);
      socket.off('user:offline', handleOffline);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, user?.id]);

  const isOnline = useCallback(
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers]
  );

  const getPresence = useCallback(
    (userId: string) => presenceMap.get(userId) || { userId, status: 'offline' as const },
    [presenceMap]
  );

  const getTypingInChat = useCallback(
    (chatId: string) => typingUsers.filter((t) => t.chatId === chatId),
    [typingUsers]
  );

  return {
    onlineUsers,
    presenceMap,
    typingUsers,
    isOnline,
    getPresence,
    getTypingInChat,
  };
}
