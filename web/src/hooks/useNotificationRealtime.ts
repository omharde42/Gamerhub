'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { getSharedSocket, disconnectSharedSocket } from '@/lib/socket-client';

/**
 * Keeps the notification badge + inbox fresh in realtime. Any component that
 * displays notification state (navbar badge, mobile nav, inbox page) should
 * call this once. All consumers share a single socket connection and simply
 * invalidate the notification queries when the server pushes an event, so the
 * badge updates instantly instead of waiting for the next poll.
 */
export function useNotificationRealtime() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) {
      disconnectSharedSocket();
      return;
    }
    const socket = getSharedSocket();
    if (!socket) return;

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('notification:new', refresh);
    socket.on('notification:read', refresh);
    socket.on('notification:read-all', refresh);

    return () => {
      socket.off('notification:new', refresh);
      socket.off('notification:read', refresh);
      socket.off('notification:read-all', refresh);
    };
  }, [accessToken, queryClient]);
}
