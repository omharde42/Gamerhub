'use client';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/constants';
import { useAuthStore } from '@/store/authStore';

let sharedSocket: Socket | null = null;
let sharedToken: string | null = null;

function createSocket(token: string): Socket {
  const s = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
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
}

/**
 * App-wide shared socket for notification realtime updates. All consumers
 * (navbar badge, mobile nav, inbox page) share ONE connection — creating a
 * fresh connection only when the auth token changes, and returning null while
 * signed out. Event listeners are attached per-consumer via `socket.on`, so
 * multiple components can subscribe without duplicate connections.
 */
export function getSharedSocket(): Socket | null {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;
  if (sharedSocket && sharedToken === token) return sharedSocket;
  if (sharedSocket) {
    sharedSocket.removeAllListeners();
    sharedSocket.disconnect();
  }
  sharedToken = token;
  sharedSocket = createSocket(token);
  return sharedSocket;
}

/** Disconnect the shared socket (e.g. on logout). Safe to call repeatedly. */
export function disconnectSharedSocket(): void {
  if (sharedSocket) {
    sharedSocket.removeAllListeners();
    sharedSocket.disconnect();
  }
  sharedSocket = null;
  sharedToken = null;
}
