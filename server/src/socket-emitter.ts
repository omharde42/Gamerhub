import type { Server } from 'socket.io';

let ioRef: Server | null = null;

export const setSocketIo = (io: Server): void => {
  ioRef = io;
};

/**
 * Best-effort real-time emit to a single user's private room (`user:{userId}`).
 * Never throws — socket notifications are a nice-to-have on top of the inbox.
 */
export const emitToUser = (userId: string, event: string, payload: unknown): void => {
  try {
    if (ioRef) {
      ioRef.to(`user:${userId}`).emit(event, payload);
    }
  } catch {
    // ignore — realtime is best-effort
  }
};
