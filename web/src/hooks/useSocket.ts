'use client';
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);

  const connect = useCallback(() => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return;
    const s = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    s.on('connect', () => setSocket(s));
    s.on('disconnect', () => setSocket(null));
    s.on('connect_error', (err) => {
      if (err.message === 'Authentication required' || err.message === 'Invalid token') {
        const newToken = useAuthStore.getState().accessToken;
        if (newToken && newToken !== token) {
          s.auth = { token: newToken };
          s.connect();
        }
      }
    });
    return s;
  }, []);

  useEffect(() => {
    const s = connect();
    return () => { s?.disconnect(); };
  }, [connect]);

  return socket;
}
