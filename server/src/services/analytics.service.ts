import prisma from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';

export class AnalyticsService {
  async getUserStats(userId: string) {
    const profile = await prisma.profile.findUnique({ where: { userId } }); if (!profile) throw new NotFoundError('Profile');
    const recentMatches = await prisma.matchHistory.findMany({ where: { userId }, orderBy: { playedAt: 'desc' }, take: 50 });
    const totalMatches = recentMatches.length; const wins = recentMatches.filter((m) => m.result === 'WIN').length;
    const avgKd = totalMatches > 0 ? recentMatches.reduce((sum, m) => sum + (m.deaths > 0 ? m.kills / m.deaths : m.kills), 0) / totalMatches : 0;
    const avgAccuracy = totalMatches > 0 ? recentMatches.reduce((sum, m) => sum + m.accuracy, 0) / totalMatches : 0;
    const last7Days = recentMatches.filter((m) => m.playedAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
    const last30Days = recentMatches.filter((m) => m.playedAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    return { profile: { winRate: profile.winRate, kd: profile.kd, accuracy: profile.accuracy, rank: profile.rank, totalMatches: profile.totalMatches, wins: profile.wins, losses: profile.losses }, recentPerformance: { matches: totalMatches, wins, losses: totalMatches - wins, winRate: totalMatches > 0 ? (wins / totalMatches) * 100 : 0, avgKd: Math.round(avgKd * 100) / 100, avgAccuracy: Math.round(avgAccuracy * 100) / 100 }, activity: { last7Days, last30Days }, matchHistory: recentMatches.slice(0, 20) };
  }
  async getUserHeatmapData(userId: string) {
    const matches = await prisma.matchHistory.findMany({ where: { userId }, orderBy: { playedAt: 'asc' } });
    const hourlyData: Record<string, number> = {};
    matches.forEach((m) => { const hour = m.playedAt.getHours(); const day = m.playedAt.getDay(); const key = `${day}-${hour}`; hourlyData[key] = (hourlyData[key] || 0) + 1; });
    return hourlyData;
  }
  async getWeeklyProgress(userId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const matches = await prisma.matchHistory.findMany({ where: { userId, playedAt: { gte: sevenDaysAgo } }, orderBy: { playedAt: 'asc' } });
    const dailyStats: Record<string, { matches: number; wins: number; kills: number; deaths: number }> = {};
    for (let i = 0; i < 7; i++) { const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000); const key = date.toISOString().split('T')[0]; dailyStats[key] = { matches: 0, wins: 0, kills: 0, deaths: 0 }; }
    matches.forEach((m) => { const key = m.playedAt.toISOString().split('T')[0]; if (dailyStats[key]) { dailyStats[key].matches++; if (m.result === 'WIN') dailyStats[key].wins++; dailyStats[key].kills += m.kills; dailyStats[key].deaths += m.deaths; } });
    return Object.entries(dailyStats).map(([date, stats]) => ({ date, ...stats, winRate: stats.matches > 0 ? (stats.wins / stats.matches) * 100 : 0, kd: stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills })).reverse();
  }

  /** Recompute the aggregate stats stored on the profile from match history. */
  private async recomputeProfileStats(userId: string) {
    const recent = await prisma.matchHistory.findMany({ where: { userId }, orderBy: { playedAt: 'desc' }, take: 100 });
    const total = recent.length;
    const wins = recent.filter((m) => m.result === 'WIN').length;
    const losses = recent.filter((m) => m.result === 'LOSS').length;
    const avgKd = total > 0 ? recent.reduce((sum, m) => sum + (m.deaths > 0 ? m.kills / m.deaths : m.kills), 0) / total : 0;
    const avgAccuracy = total > 0 ? recent.reduce((sum, m) => sum + m.accuracy, 0) / total : 0;

    await prisma.profile.update({
      where: { userId },
      data: {
        winRate: total > 0 ? Math.round((wins / total) * 1000) / 10 : 0,
        kd: Math.round(avgKd * 100) / 100,
        accuracy: Math.round(avgAccuracy * 100) / 100,
        totalMatches: total,
        wins,
        losses,
      },
    });
  }

  /**
   * Self-serve performance logging: a gamer records a match result and their
   * profile aggregates (win rate / K/D / accuracy) are recomputed from the
   * stored match history.
   */
  async logMatch(userId: string, input: {
    game?: string;
    result?: string;
    kills?: number;
    deaths?: number;
    assists?: number;
    accuracy?: number;
  }) {
    const game = String(input?.game || '').trim();
    if (!game) throw new ValidationError({ game: ['Game is required'] });

    const result = String(input?.result || '').toUpperCase();
    if (!['WIN', 'LOSS', 'DRAW'].includes(result)) {
      throw new ValidationError({ result: ['Result must be one of WIN, LOSS or DRAW'] });
    }

    const clampInt = (v: any) => Math.max(0, Math.floor(Number(v) || 0));
    const kills = clampInt(input?.kills);
    const deaths = clampInt(input?.deaths);
    const assists = clampInt(input?.assists);
    const accuracy = input?.accuracy == null ? 0 : Math.min(100, Math.max(0, Number(input.accuracy) || 0));

    const match = await prisma.matchHistory.create({
      data: { userId, game, result, kills, deaths, assists, accuracy },
    });

    await this.recomputeProfileStats(userId);
    return match;
  }

  /** Remove a logged match (owner-only) and refresh profile aggregates. */
  async deleteMatch(userId: string, matchId: string) {
    const match = await prisma.matchHistory.findFirst({ where: { id: matchId, userId } });
    if (!match) throw new NotFoundError('Match');

    await prisma.matchHistory.delete({ where: { id: matchId } });
    await this.recomputeProfileStats(userId);
    return { success: true };
  }
}
export const analyticsService = new AnalyticsService();
