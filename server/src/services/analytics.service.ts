import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';

export class AnalyticsService {
  async getUserStats(userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } }); if (!profile) throw new NotFoundError('Profile');
    const recentMatches = await prisma.matchHistory.findMany({ where: { userId }, orderBy: { playedAt: 'desc' }, take: 50 });
    const totalMatches = recentMatches.length; const wins = recentMatches.filter((m: any) => m.result === 'WIN').length;
    const avgKd = totalMatches > 0 ? recentMatches.reduce((sum: any, m: any) => sum + (m.deaths > 0 ? m.kills / m.deaths : m.kills), 0) / totalMatches : 0;
    const avgAccuracy = totalMatches > 0 ? recentMatches.reduce((sum: any, m: any) => sum + m.accuracy, 0) / totalMatches : 0;
    const last7Days = recentMatches.filter((m: any) => m.playedAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
    const last30Days = recentMatches.filter((m: any) => m.playedAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    return { profile: { winRate: profile.winRate, kd: profile.kd, accuracy: profile.accuracy, rank: profile.rank, totalMatches: profile.totalMatches, wins: profile.wins, losses: profile.losses }, recentPerformance: { matches: totalMatches, wins, losses: totalMatches - wins, winRate: totalMatches > 0 ? (wins / totalMatches) * 100 : 0, avgKd: Math.round(avgKd * 100) / 100, avgAccuracy: Math.round(avgAccuracy * 100) / 100 }, activity: { last7Days, last30Days }, matchHistory: recentMatches.slice(0, 20) };
  }
  async getUserHeatmapData(userId: string) {
    const matches = await prisma.matchHistory.findMany({ where: { userId }, orderBy: { playedAt: 'asc' } });
    const hourlyData: Record<string, number> = {};
    matches.forEach((m: any) => { const hour = m.playedAt.getHours(); const day = m.playedAt.getDay(); const key = `${day}-${hour}`; hourlyData[key] = (hourlyData[key] || 0) + 1; });
    return hourlyData;
  }
  async getWeeklyProgress(userId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const matches = await prisma.matchHistory.findMany({ where: { userId, playedAt: { gte: sevenDaysAgo } }, orderBy: { playedAt: 'asc' } });
    const dailyStats: Record<string, { matches: number; wins: number; kills: number; deaths: number }> = {};
    for (let i = 0; i < 7; i++) { const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000); const key = date.toISOString().split('T')[0]; dailyStats[key] = { matches: 0, wins: 0, kills: 0, deaths: 0 }; }
    matches.forEach((m: any) => { const key = m.playedAt.toISOString().split('T')[0]; if (dailyStats[key]) { dailyStats[key].matches++; if (m.result === 'WIN') dailyStats[key].wins++; dailyStats[key].kills += m.kills; dailyStats[key].deaths += m.deaths; } });
    return Object.entries(dailyStats).map(([date, stats]) => ({ date, ...stats, winRate: stats.matches > 0 ? (stats.wins / stats.matches) * 100 : 0, kd: stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills })).reverse();
  }
}
export const analyticsService = new AnalyticsService();
