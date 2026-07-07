'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/lib/constants';
export function useSocket() { const socketRef = useRef<Socket | null>(null); useEffect(() => { const token = localStorage.getItem('accessToken'); if (!token) return; const socket = io(SOCKET_URL, { auth: { token } }); socketRef.current = socket; return () => { socket.disconnect(); }; }, []); return socketRef; }
