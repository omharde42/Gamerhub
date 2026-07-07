'use client';
import { useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
export function useAuth() { const { user, isAuthenticated, setUser, setTokens, logout } = useAuthStore(); useEffect(() => { if (isAuthenticated && !user) { api.get('/auth/me').then(({ data }) => setUser(data.data)).catch(() => logout()); } }, [isAuthenticated, user, setUser, logout]); return { user, isAuthenticated, setUser, setTokens, logout }; }
