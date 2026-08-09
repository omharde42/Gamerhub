import prisma from '../config/database';
import { clashOfClansService } from './clashofclans.service';
import { pubgService } from './pubg.service';
import { AppError } from '../utils/errors';

// Canonical Game Identifier Normalization
export function normalizeGameId(rawGame: string): string {
  if (!rawGame) return '';
  const s = rawGame.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s.includes('clash') || s === 'coc') return 'clash_of_clans';
  if (s.includes('pubg') && !s.includes('mobile') && !s.includes('bgmi')) return 'pubg_pc';
  if (s.includes('bgmi') || (s.includes('pubg') && s.includes('mobile'))) return 'bgmi';
  if (s.includes('valorant')) return 'valorant';
  if (s.includes('freefire')) return 'free_fire';
  if (s.includes('steam')) return 'steam';
  return s;
}

export function getGameMetaData(normId: string) {
  switch (normId) {
    case 'clash_of_clans':
      return { id: 'clash_of_clans', name: 'Clash of Clans', icon: '🏰' };
    case 'pubg_pc':
      return { id: 'pubg_pc', name: 'PUBG (PC / Steam)', icon: '🪖' };
    case 'valorant':
      return { id: 'valorant', name: 'Valorant', icon: '🎯' };
    case 'free_fire':
      return { id: 'free_fire', name: 'Free Fire', icon: '🔥' };
    case 'bgmi':
      return { id: 'bgmi', name: 'BGMI / PUBG Mobile', icon: '📱' };
    case 'steam':
      return { id: 'steam', name: 'Steam Library', icon: '🎮' };
    default:
      return { id: normId, name: normId.toUpperCase(), icon: '🎮' };
  }
}

// 15-minute server-side cache keyed strictly by userId:gameId:externalPlayerId
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

    return friends.filter((f) => f && f.profile?.allowComparison !== false);
  }

  /**
   * PHASE 1 & 2: Single Source of Truth for Connected Games
   * Returns common games between user and accepted friends (or user's own connected games if no friend selected)
   */
  async getCommonGames(userId: string, targetFriendId?: string) {
    // Single Source of Truth: prisma.gameAccount
    const userGameAccounts = await prisma.gameAccount.findMany({
      where: { userId },
    });

    const userGameKeys = Array.from(new Set(userGameAccounts.map((a) => normalizeGameId(a.game))));

    console.log('[COMPARE:DEBUG]', {
      userId,
      userGameAccountsCount: userGameAccounts.length,
      userGameKeys,
      targetFriendId: targetFriendId || 'ALL_FRIENDS',
    });

    if (userGameKeys.length === 0) {
      return {
        userHasConnectedGames: false,
        commonGames: [],
        userConnectedGames: [],
      };
    }

    const userConnectedGames = userGameKeys.map((gId) => getGameMetaData(gId));

    // If specific friend selected
    if (targetFriendId) {
      const friendAccounts = await prisma.gameAccount.findMany({
        where: { userId: targetFriendId },
      });
      const friendGameKeys = new Set(friendAccounts.map((a) => normalizeGameId(a.game)));
      const commonKeys = userGameKeys.filter((gKey) => friendGameKeys.has(gKey));

      console.log('[COMPARE:FRIEND_INTERSECTION]', {
        userId,
        userGameKeys,
        targetFriendId,
        friendGameKeys: Array.from(friendGameKeys),
        commonKeys,
      });

      return {
        userHasConnectedGames: true,
        commonGames: commonKeys.map((gId) => getGameMetaData(gId)),
        userConnectedGames,
      };
    }

    // Otherwise calculate intersection across all accepted friends
    const friends = await this.getAcceptedFriends(userId);
    if (friends.length === 0) {
      return {
        userHasConnectedGames: true,
        commonGames: userConnectedGames, // Fallback: user can view their own connected games
        userConnectedGames,
      };
    }

    const friendIds = friends.map((f) => f.id);
    const friendGameAccounts = await prisma.gameAccount.findMany({
      where: { userId: { in: friendIds } },
    });

    const friendGameKeyCounts = new Map<string, number>();
    for (const fAcc of friendGameAccounts) {
      const normKey = normalizeGameId(fAcc.game);
      const current = friendGameKeyCounts.get(normKey) || 0;
      friendGameKeyCounts.set(normKey, current + 1);
    }

    const commonKeys = userGameKeys.filter((gKey) => friendGameKeyCounts.has(gKey));
    const commonGames = (commonKeys.length > 0 ? commonKeys : userGameKeys).map((gId) => {
      const meta = getGameMetaData(gId);
      return {
        ...meta,
        friendsCount: friendGameKeyCounts.get(gId) || 0,
      };
    });

    console.log('[COMPARE:COMMON_GAMES_RESULT]', {
      userId,
      userGameKeys,
      friendsCount: friends.length,
      commonKeys,
      commonGames,
    });

    return {
      userHasConnectedGames: true,
      commonGames,
      userConnectedGames,
    };
  }

  /**
   * PHASE 7: Cache keyed strictly by userId + gameId + externalPlayerId
   */
  private async getCachedPlayerStats(userId: string, normGameId: string, inGameUid: string): Promise<any> {
    const cacheKey = `${userId}:${normGameId}:${inGameUid.toUpperCase()}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('[COMPARE:CACHE_HIT]', cacheKey);
      return cached.stats;
    }

    console.log('[COMPARE:FETCHING_LIVE_API]', { userId, normGameId, inGameUid, cacheKey });

    let freshStats: any = null;
    try {
      if (normGameId === 'clash_of_clans') {
        const cleanTag = inGameUid.replace(/^#/, '');
        freshStats = await clashOfClansService.getPlayerProfile(cleanTag);
      } else if (normGameId === 'pubg_pc') {
        freshStats = await pubgService.getPlayerProfile(inGameUid, 'steam');
      }
    } catch (err: any) {
      console.warn(`[COMPARE:API_ERROR] ${cacheKey}:`, err.message);
      if (cached) return cached.stats;
    }

    if (freshStats) {
      this.cache.set(cacheKey, { timestamp: Date.now(), stats: freshStats });
    }

    return freshStats;
  }

  /**
   * PHASE 4 & 6: Friends Leaderboard with strict game stats isolation
   */
  async getFriendsLeaderboard(userId: string, gameId: string) {
    const normGameId = normalizeGameId(gameId);

    // Single source of truth: Find user's connected account for this game
    const userAccounts = await prisma.gameAccount.findMany({ where: { userId } });
    const userGameAccount = userAccounts.find((a) => normalizeGameId(a.game) === normGameId);

    if (!userGameAccount) {
      throw new AppError(`You have not connected ${normGameId}. Please connect it first.`, 400);
    }

    // Friends connected to this game
    const friends = await this.getAcceptedFriends(userId);
    const friendIds = friends.map((f) => f.id);
    const friendAccounts = await prisma.gameAccount.findMany({
      where: { userId: { in: friendIds } },
      include: { user: { select: { id: true, profile: true } } },
    });

    const friendGameAccounts = friendAccounts.filter((fa) => normalizeGameId(fa.game) === normGameId);

    const currentUserObj = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profile: true },
    });

    const allAccounts = [
      { account: userGameAccount, user: currentUserObj! },
      ...friendGameAccounts.map((fa) => ({ account: fa, user: fa.user })),
    ];

    console.log('[COMPARE:LEADERBOARD_QUERY]', {
      userId,
      normGameId,
      userInGameUid: userGameAccount.inGameUid,
      totalParticipants: allAccounts.length,
    });

    // Fetch stats isolated by player + game
    const leaderboardItems = await Promise.all(
      allAccounts.map(async ({ account, user }) => {
        const stats = await this.getCachedPlayerStats(user.id, normGameId, account.inGameUid);
        let score = 0;
        let scoreLabel = '0';

        if (normGameId === 'clash_of_clans') {
          score = stats?.trophies || account.rankRating || 0;
          scoreLabel = `${score.toLocaleString()} Trophies`;
        } else if (normGameId === 'pubg_pc') {
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

    leaderboardItems.sort((a, b) => b.score - a.score);

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
      if (normGameId === 'clash_of_clans') {
        gapText = `Need ${diff.toLocaleString()} more trophies to overtake ${topPlayer.displayName} (#1)`;
      } else if (normGameId === 'pubg_pc') {
        gapText = `Need ${diff.toFixed(2)} higher K/D to overtake ${topPlayer.displayName} (#1)`;
      } else {
        gapText = `Need ${diff.toLocaleString()} more points to overtake ${topPlayer.displayName} (#1)`;
      }
    }

    const meta = getGameMetaData(normGameId);

    return {
      gameId: normGameId,
      gameName: meta.name,
      userRank: currentUserRank,
      totalPlayers: rankedLeaderboard.length,
      gapText,
      lastFetchedAt: new Date().toISOString(),
      leaderboard: rankedLeaderboard,
    };
  }

  /**
   * PHASE 6: 1-on-1 Head-to-Head Comparison
   */
  async get1v1Comparison(userId: string, friendId: string, gameId: string) {
    const normGameId = normalizeGameId(gameId);
    const leaderboardData = await this.getFriendsLeaderboard(userId, normGameId);

    const userItem = leaderboardData.leaderboard.find((i) => i.userId === userId);
    const friendItem = leaderboardData.leaderboard.find((i) => i.userId === friendId);

    if (!friendItem) {
      throw new AppError('Friend comparison statistics not available for this game.', 404);
    }

    return {
      game: leaderboardData.gameName,
      user: userItem,
      friend: friendItem,
    };
  }
}

export const compareService = new CompareService();
