import { Request } from 'express';
import { UserRole } from '@prisma/client';
export interface JWTPayload { userId: string; email: string; role: UserRole; }
export interface AuthRequest extends Request { user?: JWTPayload; }
export interface PaginationParams { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc'; }
export interface PaginatedResponse<T> { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean; }; }
export interface ApiResponse<T = any> { success: boolean; message?: string; data?: T; error?: string; errors?: Record<string, string[]>; }
export interface MatchmakingQuery { rank?: string; region?: string; role?: string; playStyle?: string; communicationStyle?: string; activeTime?: string; minWinRate?: number; maxToxicity?: number; game?: string; page?: number; limit?: number; }
export interface AIRecommendation { userId: string; username: string; avatar: string | null; rank: string | null; role: string | null; winRate: number; compatibility: number; reasons: string[]; }
