'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';

export function useTypingIndicator(chatId: string | null) {
  const socket = useSocket();
  const { user } = useAuthStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const startTyping = useCallback(() => {
    if (!socket || !chatId || !user?.id) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing:start', {
        userId: user.id,
        chatId,
        username: user.profile?.username || 'User',
      });
    }
    // Auto-stop after 3 seconds of inactivity
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [socket, chatId, user?.id, user?.profile?.username]);

  const stopTyping = useCallback(() => {
    if (!socket || !chatId || !user?.id) return;
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('typing:stop', { userId: user.id, chatId });
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [socket, chatId, user?.id]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopTyping();
    };
  }, [stopTyping]);

  return { startTyping, stopTyping };
}
