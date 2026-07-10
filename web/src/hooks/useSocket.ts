'use client';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/constants';
export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    const s = io(SOCKET_URL, { auth: { token } });
    s.on('connect', () => setSocket(s));
    s.on('disconnect', () => setSocket(null));
    return () => { s.disconnect(); setSocket(null); };
  }, []);
  return socket;
}
