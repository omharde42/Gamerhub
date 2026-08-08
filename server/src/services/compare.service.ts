import prisma from '../config/database';
import { clashOfClansService } from './clashofclans.service';
import { pubgService } from './pubg.service';
import { AppError } from '../utils/errors';

// 15-minute server-side cache for third-party API stats
interface CacheEntry {
  timestamp: number;
  stats: any;
}

class CompareService {
  private cache = new Map<string, CacheEntry>();
  private CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Helper: Fetch accepted friends for a user who allow comparison
   */
  private async getAcceptedFriends(userId: string) {
    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        sender: { select: { id: true, profile: true } },
        receiver: { select: { id: true, profile: true } },
      },
    });

    const friends = friendRequests.map((req) => {
      const isSender = req.senderId === userId;
      return isSender ? req.receiver : req.sender;
    });

    // Filter out friends who opted out of comparison
    return friends.filter((f) => f && f.profile?.allowComparison !== false);
  }

  /**
   * Helper: Normalize Game Keys
   */
  private normalizeGameKey(game: string): string {
    const k = (game || '').toLowerCase().replace(/_/g, '');
    if (k === 'clashofclans' || k === 'coc') return 'clashofclans';
    if (k === 'pubg') return 'pubg';
    if (k === 'valorant') return 'valorant';
    return k;
  }

  /**
   * 1. GET COMMON GAMES: Intersection(user.connectedGames, friends.connectedGames)
   */
  async getCommonGames(userId: string) {
    const userGameAccounts = await prisma.gameAccount.findMany({
      where: { userId },
    });

    if (userGameAccounts.length === 0) {
      return [];
    }

    const userGameKeys = Array.from(new Set(userGameAccounts.map((a) => this.normalizeGameKey(a.game))));
    const friends = await this.getAcceptedFriends(userId);
    if (friends.length === 0) {
      return [];
    }

    const friendIds = friends.map((f) => f.id);
    const friendGameAccounts = await prisma.gameAccount.findMany({
      where: { userId: { in: friendIds } },
    });

    const friendGameKeyCounts = new Map<string, number>();
    for (const fAcc of friendGameAccounts) {
      const normKey = this.normalizeGameKey(fAcc.game);
      const current = friendGameKeyCounts.get(normKey) || 0;
      friendGameKeyCounts.set(normKey, current + 1);
    }

    const commonGames = userGameKeys
      .filter((gKey) => friendGameKeyCounts.has(gKey))
      .map((gKey) => {
        let name = gKey.toUpperCase();
        let icon = '🎮';
        if (gKey === 'clashofclans') { name = 'Clash of Clans'; icon = '🏰'; }
        if (gKey === 'pubg') { name = 'PUBG (PC / Steam)'; icon = '🪖'; }
        if (gKey === 'valorant') { name = 'Valorant'; icon = '🎯'; }

        return {
          id: gKey,
          name,
          icon,
          friendsCount: friendGameKeyCounts.get(gKey) || 0,
        };
      });

    return commonGames;
  }

  /**
   * Helper: Fetch stats with server-side rate-limit caching
   */
  private async getCachedPlayerStats(gameKey: string, inGameUid: string): Promise<any> {
    const cacheKey = `${gameKey}:${inGameUid.toUpperCase()}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.stats;
    }

    let freshStats: any = null;
    try {
      if (gameKey === 'clashofclans') {
        const cleanTag = inGameUid.replace(/^#/, '');
        freshStats = await clashOfClansService.getPlayerProfile(cleanTag);
      } else if (gameKey === 'pubg') {
        freshStats = await pubgService.getPlayerProfile(inGameUid, 'steam');
      }
    } catch (err: any) {
      console.warn(`[CompareService] API fetch failed for ${cacheKey}:`, err.message);
      if (cached) return cached.stats;
    }

    if (freshStats) {
      this.cache.set(cacheKey, { timestamp: Date.now(), stats: freshStats });
    }

    return freshStats;
  }

  /**
   * 2. GET FRIENDS LEADERBOARD for a Game
   */
  async getFriendsLeaderboard(userId: string, gameKey: string) {
    const normKey = this.normalizeGameKey(gameKey);

    // Current user's game account
    const userGameAccount = await prisma.gameAccount.findFirst({
      where: { userId, game: { contains: normKey.toUpperCase() } },
    });

    if (!userGameAccount) {
      throw new AppError(`You have not connected ${gameKey}. Please connect it first.`, 400);
    }

    // Friends' game accounts
    const friends = await this.getAcceptedFriends(userId);
    const friendIds = friends.map((f) => f.id);
    const friendGameAccounts = await prisma.gameAccount.findMany({
      where: { userId: { in: friendIds }, game: { contains: normKey.toUpperCase() } },
      include: {
        user: { select: { id: true, profile: true } },
      },
    });

    // Current user object
    const currentUserObj = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profile: true },
    });

    const allAccounts = [
      { account: userGameAccount, user: currentUserObj! },
      ...friendGameAccounts.map((fa) => ({ account: fa, user: fa.user })),
    ];

    // Fetch stats for all accounts
    const leaderboardItems = await Promise.all(
      allAccounts.map(async ({ account, user }) => {
        const stats = await this.getCachedPlayerStats(normKey, account.inGameUid);
        let score = 0;
        let scoreLabel = '0';

        if (normKey === 'clashofclans') {
          score = stats?.trophies || account.rankRating || 0;
          scoreLabel = `${score.toLocaleString()} Trophies`;
        } else if (normKey === 'pubg') {
          score = parseFloat(stats?.kdRatio || '0') || account.kdRatio || 0;
          scoreLabel = `K/D ${stats?.kdRatio || account.kdRatio || '0.00'}`;
        } else {
          score = account.rankRating || 0;
          scoreLabel = `${score}`;
        }

        const username = user.profile?.username || 'user';
        const displayName = user.profile?.displayName || username;

        return {
          userId: user.id,
          username,
          displayName,
          avatar: user.profile?.avatar || null,
          tag: account.inGameUid,
          inGameName: account.inGameName || stats?.name || username,
          score,
          scoreLabel,
          isCurrentUser: user.id === userId,
          stats: stats || {
            name: account.inGameName,
            townHallLevel: account.level,
            trophies: account.rankRating,
          },
        };
      })
    );

    // Sort descending by score
    leaderboardItems.sort((a, b) => b.score - a.score);

    // Assign rank
    const rankedLeaderboard = leaderboardItems.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    const currentUserRankItem = rankedLeaderboard.find((i) => i.isCurrentUser);
    const currentUserRank = currentUserRankItem?.rank || 1;
    let gapText = 'You are #1 among your friends! 👑';

    if (currentUserRank > 1) {
      const topPlayer = rankedLeaderboard[0];
      const diff = topPlayer.score - (currentUserRankItem?.score || 0);
      if (normKey === 'clashofclans') {
        gapText = `You need ${diff.toLocaleString()} more trophies to overtake ${topPlayer.displayName} (#1)`;
      } else if (normKey === 'pubg') {
        gapText = `You need ${diff.toFixed(2)} higher K/D to overtake ${topPlayer.displayName} (#1)`;
      } else {
        gapText = `You need ${diff.toLocaleString()} more points to overtake ${topPlayer.displayName} (#1)`;
      }
    }

    return {
      gameId: normKey,
      gameName: normKey === 'clashofclans' ? 'Clash of Clans' : normKey === 'pubg' ? 'PUBG (PC / Steam)' : normKey.toUpperCase(),
      userRank: currentUserRank,
      totalPlayers: rankedLeaderboard.length,
      gapText,
      lastFetchedAt: new Date().toISOString(),
      leaderboard: rankedLeaderboard,
    };
  }

  /**
   * 3. GET 1-ON-1 HEAD-TO-HEAD COMPARISON
   */
  async get1v1Comparison(userId: string, friendId: string, gameKey: string) {
    const normKey = this.normalizeGameKey(gameKey);
    const leaderboardData = await this.getFriendsLeaderboard(userId, normKey);

    const userItem = leaderboardData.leaderboard.find((i) => i.userId === userId);
    const friendItem = leaderboardData.leaderboard.find((i) => i.userId === friendId);

    if (!friendItem) {
      throw new AppError('Friend comparison statistics not available.', 404);
    }

    return {
      game: leaderboardData.gameName,
      user: userItem,
      friend: friendItem,
    };
  }
}

export const compareService = new CompareService();
