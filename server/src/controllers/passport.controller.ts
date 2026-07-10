import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import cloudinary from '../config/cloudinary';
import { NotFoundError, ForbiddenError, ConflictError, AppError } from '../utils/errors';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

function calcGamerScore(profile: { winRate: number; kd: number; accuracy: number; totalMatches: number; skillScore: number; competitiveScore: number; teamworkScore: number; communicationScore: number; leadershipScore: number }) {
  const kdScore = Math.min(25, (profile.kd || 0) * 6);
  const winScore = Math.min(25, (profile.winRate || 0) * 0.25);
  const matchScore = Math.min(15, (profile.totalMatches || 0) * 0.015);
  const skillScore = Math.min(20, (profile.skillScore || 0) * 0.2);
  const compScore = Math.min(15, (profile.competitiveScore || 0) * 0.15);
  return Math.min(100, Math.round(kdScore + winScore + matchScore + skillScore + compScore));
}

function calcProfileCompleteness(profile: Record<string, any>): { percent: number; filled: number; total: number } {
  const fields: (keyof typeof profile)[] = ['displayName', 'avatar', 'bio', 'country', 'city', 'rank', 'role', 'experienceLevel', 'playStyle', 'timezone', 'languages'];
  const filled = fields.filter(f => { const v = profile[f]; return v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0); }).length;
  return { percent: Math.round((filled / fields.length) * 100), filled, total: fields.length };
}

function computeAggregates(games: { hoursPlayed: number; winRate: number | null; kdRatio: number | null; matchesPlayed: number; mvpCount: number }[]) {
  if (!games.length) return { totalHours: 0, avgWinRate: 0, avgKd: 0, totalMatches: 0, totalMvps: 0 };
  return {
    totalHours: games.reduce((s, g) => s + (g.hoursPlayed || 0), 0),
    avgWinRate: Math.round(games.reduce((s, g) => s + (g.winRate || 0), 0) / games.length),
    avgKd: parseFloat((games.reduce((s, g) => s + (g.kdRatio || 0), 0) / games.length).toFixed(2)),
    totalMatches: games.reduce((s, g) => s + (g.matchesPlayed || 0), 0),
    totalMvps: games.reduce((s, g) => s + (g.mvpCount || 0), 0),
  };
}

export class PassportController {
  getPassport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username } = req.params;
    if (!username || typeof username !== 'string') throw new AppError('Username is required', 400);
    const profile = await prisma.profile.findUnique({
      where: { username },
      include: {
        user: { select: { id: true, createdAt: true } },
        connectedGames: { orderBy: { hoursPlayed: 'desc' } },
        skills: { orderBy: { score: 'desc' } },
        endorsements: { include: { endorser: { select: { id: true, profile: { select: { username: true, avatar: true } } } } }, orderBy: { createdAt: 'desc' }, take: 20 },
        achievements: { orderBy: { unlockedAt: 'desc' } },
        certifications: { orderBy: { issueDate: 'desc' } },
        tournamentHistory: { orderBy: { date: 'desc' } },
        _count: { select: { endorsements: true, connectedGames: true } },
      },
    });
    if (!profile) throw new NotFoundError('Passport');
    const gamerScore = calcGamerScore(profile);
    const completeness = calcProfileCompleteness(profile);
    const aggregates = computeAggregates(profile.connectedGames);
    if (profile.gamerScore !== gamerScore) {
      await prisma.profile.update({ where: { id: profile.id }, data: { gamerScore } });
    }
    sendSuccess(res, { ...profile, gamerScore, completeness, aggregates });
  });

  updatePassport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const allowedFields = ['displayName', 'bio', 'country', 'city', 'languages', 'experienceLevel', 'playStyle', 'communicationStyle', 'rank', 'role', 'age', 'timezone', 'availability', 'preferredGamingTime', 'activeTime', 'twitch', 'youtube', 'discord', 'twitter', 'instagram', 'kick', 'facebookGaming'];
    const data: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }
    if (Object.keys(data).length === 0) throw new AppError('No valid fields to update', 400);
    const profile = await prisma.profile.update({ where: { userId: req.user!.userId }, data });
    sendSuccess(res, profile);
  });

  searchGames = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') { sendSuccess(res, []); return; }
    const games = await prisma.connectedGame.findMany({
      where: { profile: { userId: req.user!.userId }, gameName: { contains: q, mode: 'insensitive' } },
      orderBy: { hoursPlayed: 'desc' },
    });
    sendSuccess(res, games);
  });

  addGame = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new NotFoundError('Profile');
    const { gameName, publisher, playerId, rank, hoursPlayed, winRate, kdRatio, matchesPlayed, mvpCount, preferredRole, dataSource, highestRank, currentRank, accuracy, headshotPct, server, region, level, favoriteWeapon, favoriteCharacter } = req.body;
    if (!gameName || typeof gameName !== 'string') throw new AppError('Game name is required', 400);
    const game = await prisma.connectedGame.create({
      data: {
        gameName, publisher, playerId, server, region, level, rank, highestRank, currentRank, preferredRole,
        hoursPlayed: hoursPlayed ? parseFloat(hoursPlayed) : 0,
        winRate: winRate ? parseFloat(winRate) : null,
        kdRatio: kdRatio ? parseFloat(kdRatio) : null,
        matchesPlayed: matchesPlayed ? parseInt(matchesPlayed) : 0,
        mvpCount: mvpCount ? parseInt(mvpCount) : 0,
        accuracy: accuracy ? parseFloat(accuracy) : null,
        headshotPct: headshotPct ? parseFloat(headshotPct) : null,
        favoriteWeapon, favoriteCharacter,
        dataSource: dataSource || 'Manual',
        verificationStatus: dataSource === 'API' ? 'Verified' : 'Manual',
        profileId: profile.id,
      },
    });
    await prisma.profile.update({ where: { id: profile.id }, data: { mainGames: { push: gameName } } });
    sendSuccess(res, game, undefined, 201);
  });

  updateGame = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const existing = await prisma.connectedGame.findUnique({ where: { id }, include: { profile: true } });
    if (!existing) throw new NotFoundError('Connected game');
    if (existing.profile.userId !== req.user!.userId) throw new ForbiddenError('Not your game');
    const allowed = ['rank', 'hoursPlayed', 'winRate', 'kdRatio', 'matchesPlayed', 'mvpCount', 'preferredRole', 'highestRank', 'currentRank', 'accuracy', 'headshotPct', 'server', 'region', 'level', 'favoriteWeapon', 'favoriteCharacter', 'playerId'];
    const data: Record<string, any> = {};
    for (const field of allowed) { if (req.body[field] !== undefined) data[field] = req.body[field]; }
    const game = await prisma.connectedGame.update({ where: { id }, data });
    sendSuccess(res, game);
  });

  deleteGame = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const existing = await prisma.connectedGame.findUnique({ where: { id }, include: { profile: true } });
    if (!existing) throw new NotFoundError('Connected game');
    if (existing.profile.userId !== req.user!.userId) throw new ForbiddenError('Not your game');
    await prisma.connectedGame.delete({ where: { id } });
    sendSuccess(res, null, 'Game removed');
  });

  addSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new NotFoundError('Profile');
    const { name, score } = req.body;
    if (!name || typeof name !== 'string') throw new AppError('Skill name is required', 400);
    if (score !== undefined && (typeof score !== 'number' || score < 0 || score > 100)) throw new AppError('Score must be 0-100', 400);
    const existing = await prisma.gamerSkill.findFirst({ where: { profileId: profile.id, name } });
    if (existing) {
      const updated = await prisma.gamerSkill.update({ where: { id: existing.id }, data: { score: score ?? existing.score } });
      sendSuccess(res, updated);
      return;
    }
    const skill = await prisma.gamerSkill.create({ data: { name, score: score ?? 0, profileId: profile.id } });
    sendSuccess(res, skill, undefined, 201);
  });

  updateSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const skill = await prisma.gamerSkill.findUnique({ where: { id }, include: { profile: true } });
    if (!skill) throw new NotFoundError('Skill');
    if (skill.profile.userId !== req.user!.userId) throw new ForbiddenError('Not your skill');
    const { score, name } = req.body;
    if (score !== undefined && (typeof score !== 'number' || score < 0 || score > 100)) throw new AppError('Score must be 0-100', 400);
    const updated = await prisma.gamerSkill.update({ where: { id }, data: { ...(name && { name }), ...(score !== undefined && { score }) } });
    sendSuccess(res, updated);
  });

  deleteSkill = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const skill = await prisma.gamerSkill.findUnique({ where: { id }, include: { profile: true } });
    if (!skill) throw new NotFoundError('Skill');
    if (skill.profile.userId !== req.user!.userId) throw new ForbiddenError('Not your skill');
    await prisma.gamerSkill.delete({ where: { id } });
    sendSuccess(res, null, 'Skill removed');
  });

  endorse = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { profileId, skill, message } = req.body;
    if (!profileId || !skill) throw new AppError('profileId and skill are required', 400);
    if (req.user!.userId === (await prisma.profile.findUnique({ where: { id: profileId } }))?.userId) {
      throw new AppError('Cannot endorse yourself', 400);
    }
    const existing = await prisma.endorsement.findFirst({ where: { endorserId: req.user!.userId, profileId, skill } });
    if (existing) throw new ConflictError('Already endorsed this skill');
    const endorsement = await prisma.endorsement.create({
      data: { skill, message, profileId, endorserId: req.user!.userId },
      include: { endorser: { select: { id: true, profile: { select: { username: true, avatar: true } } } } },
    });
    sendSuccess(res, endorsement, undefined, 201);
  });

  getEndorsements = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { profileId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const [endorsements, total] = await Promise.all([
      prisma.endorsement.findMany({
        where: { profileId },
        include: { endorser: { select: { id: true, profile: { select: { username: true, avatar: true } } } } },
        orderBy: { createdAt: 'desc' }, skip, take: limit,
      }),
      prisma.endorsement.count({ where: { profileId } }),
    ]);
    sendSuccess(res, endorsements, undefined, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  });

  removeEndorsement = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const endorsement = await prisma.endorsement.findUnique({ where: { id } });
    if (!endorsement) throw new NotFoundError('Endorsement');
    if (endorsement.endorserId !== req.user!.userId) throw new ForbiddenError('Not your endorsement');
    await prisma.endorsement.delete({ where: { id } });
    sendSuccess(res, null, 'Endorsement removed');
  });

  generateSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
      include: {
        connectedGames: { orderBy: { hoursPlayed: 'desc' } },
        skills: { orderBy: { score: 'desc' } },
        achievements: { take: 3, orderBy: { unlockedAt: 'desc' } },
        tournamentHistory: { take: 3, orderBy: { date: 'desc' } },
      },
    });
    if (!profile) throw new NotFoundError('Profile');
    const topGame = profile.connectedGames[0];
    const topSkill = profile.skills[0];
    const recentTourney = profile.tournamentHistory[0];
    const parts: string[] = [`${profile.displayName || profile.username} is a ${profile.role || 'versatile'} player${topGame ? ` specializing in ${topGame.gameName}` : ''}.`];
    if (topSkill) parts.push(`Their strongest skill is ${topSkill.name} (${topSkill.score}%).`);
    if (topGame && topGame.kdRatio) parts.push(`In ${topGame.gameName}, they maintain a ${topGame.kdRatio} K/D ratio${topGame.winRate ? ` with a ${topGame.winRate}% win rate` : ''}.`);
    if (profile.achievements?.length) parts.push(`Notable achievements include ${profile.achievements.map(a => a.title).join(', ')}.`);
    if (recentTourney) parts.push(`Recently placed ${recentTourney.placement || 'participated'} in ${recentTourney.tournamentName}.`);
    const totalHours = profile.connectedGames.reduce((s, g) => s + (g.hoursPlayed || 0), 0);
    if (totalHours > 100) parts.push(`With over ${Math.round(totalHours)} total hours logged, ${profile.displayName || profile.username} demonstrates serious dedication to gaming.`);
    parts.push(`Based on gameplay statistics and AI analysis, GamerHub recommends ${profile.displayName || profile.username} for competitive and semi-professional opportunities.`);
    const summary = parts.join(' ');
    await prisma.profile.update({ where: { id: profile.id }, data: { aiSummary: summary } });
    sendSuccess(res, { summary });
  });

  uploadScreenshot = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, { folder: 'gamerhub/screenshots', resource_type: 'image' });
    sendSuccess(res, { url: result.secure_url, publicId: result.public_id, message: 'Screenshot uploaded. AI analysis will be available shortly.' });
  });

  addAchievement = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new NotFoundError('Profile');
    const { title, description, icon, rarity } = req.body;
    if (!title) throw new AppError('Title is required', 400);
    const achievement = await prisma.achievement.create({ data: { title, description, icon, rarity, profileId: profile.id } });
    sendSuccess(res, achievement, undefined, 201);
  });

  deleteAchievement = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const achievement = await prisma.achievement.findUnique({ where: { id }, include: { profile: true } });
    if (!achievement) throw new NotFoundError('Achievement');
    if (achievement.profile.userId !== req.user!.userId) throw new ForbiddenError('Not your achievement');
    await prisma.achievement.delete({ where: { id } });
    sendSuccess(res, null, 'Achievement removed');
  });

  addTournamentHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new NotFoundError('Profile');
    const { tournamentName, placement, prize, date } = req.body;
    if (!tournamentName) throw new AppError('Tournament name is required', 400);
    const entry = await prisma.tournamentHistory.create({ data: { tournamentName, placement, prize, date: date ? new Date(date) : undefined, profileId: profile.id } });
    sendSuccess(res, entry, undefined, 201);
  });

  deleteTournamentHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const entry = await prisma.tournamentHistory.findUnique({ where: { id }, include: { profile: true } });
    if (!entry) throw new NotFoundError('Tournament entry');
    if (entry.profile.userId !== req.user!.userId) throw new ForbiddenError('Not your entry');
    await prisma.tournamentHistory.delete({ where: { id } });
    sendSuccess(res, null, 'Tournament entry removed');
  });

  addCertification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user!.userId } });
    if (!profile) throw new NotFoundError('Profile');
    const { title, issuer, issueDate, expiryDate, credentialUrl } = req.body;
    if (!title) throw new AppError('Certification title is required', 400);
    const cert = await prisma.certification.create({ data: { title, issuer, issueDate: issueDate ? new Date(issueDate) : undefined, expiryDate: expiryDate ? new Date(expiryDate) : undefined, credentialUrl, profileId: profile.id } });
    sendSuccess(res, cert, undefined, 201);
  });

  deleteCertification = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const cert = await prisma.certification.findUnique({ where: { id }, include: { profile: true } });
    if (!cert) throw new NotFoundError('Certification');
    if (cert.profile.userId !== req.user!.userId) throw new ForbiddenError('Not your certification');
    await prisma.certification.delete({ where: { id } });
    sendSuccess(res, null, 'Certification removed');
  });

  getLeaderboard = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;
    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where: { gamerScore: { gt: 0 } },
        select: { id: true, username: true, displayName: true, avatar: true, gamerScore: true, winRate: true, kd: true, totalMatches: true, rank: true, country: true, role: true, _count: { select: { endorsements: true } } },
        orderBy: { gamerScore: 'desc' }, skip, take: limit,
      }),
      prisma.profile.count({ where: { gamerScore: { gt: 0 } } }),
    ]);
    sendSuccess(res, profiles.map((p, i) => ({ ...p, rankPosition: skip + i + 1 })), undefined, 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  });
}

export const passportController = new PassportController();
