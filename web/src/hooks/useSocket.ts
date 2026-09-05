'use client';
import { useEffect, useState } from 'react';
import { disconnectSharedSocket, getSharedSocket } from '@/lib/socket-client';
import { useAuthStore } from '@/store/authStore';
import { Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(() => getSharedSocket());
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!accessToken) {
      disconnectSharedSocket();
      setSocket(null);
      return;
    }

    const s = getSharedSocket();
    setSocket(s);
    if (!s) return;

    const handleConnect = () => setSocket(s);
    const handleDisconnect = () => setSocket(null);

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);

    return () => {
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
    };
  }, [accessToken]);

  return socket;
}
