'use client';
import { useEffect, useState } from 'react';
import { getSharedSocket } from '@/lib/socket-client';
import { Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(() => getSharedSocket());

  useEffect(() => {
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
  }, []);

  return socket;
}
