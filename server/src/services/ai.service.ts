import { openai } from '../config/openai';
import prisma from '../config/database';
import { AIRecommendation } from '../types';
export class AIService {
  async getPlayerRecommendations(params: { userId: string; game?: string; limit?: number }): Promise<AIRecommendation[]> {
    const user = await prisma.user.findUnique({ where: { id: params.userId }, include: { profile: true } });
    if (!user?.profile) return [];
    const profile = user.profile; const limit = params.limit || 10;
    const candidates = await prisma.profile.findMany({ where: { userId: { not: params.userId }, mainGames: profile.mainGames.length > 0 ? { hasSome: profile.mainGames } : undefined }, include: { user: { select: { id: true } } }, take: 50 });
    if (candidates.length === 0) return [];
    const ranked = candidates.map((candidate) => {
      let score = 0; const reasons: string[] = [];
      if (profile.rank && candidate.rank) { const rankOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Challenger']; const userRankIdx = rankOrder.indexOf(profile.rank); const candRankIdx = rankOrder.indexOf(candidate.rank); const rankDiff = Math.abs(userRankIdx - candRankIdx); if (rankDiff <= 1) { score += 30; reasons.push('Similar rank'); } }
      if (profile.region && candidate.region === profile.region) { score += 20; reasons.push('Same region'); }
      if (profile.role && candidate.role === profile.role) { score += 15; reasons.push('Same role'); }
      if (profile.playStyle && candidate.playStyle === profile.playStyle) { score += 10; reasons.push('Same playstyle'); }
      if (profile.communicationStyle && candidate.communicationStyle === profile.communicationStyle) { score += 10; reasons.push('Same communication style'); }
      score += candidate.winRate * 0.3; score -= candidate.toxicityScore * 5;
      const compatibility = Math.min(Math.max(Math.round(score), 0), 100);
      return { userId: candidate.userId, username: candidate.username, avatar: candidate.avatar, rank: candidate.rank, role: candidate.role, winRate: candidate.winRate, compatibility, reasons };
    });
    return ranked.sort((a, b) => b.compatibility - a.compatibility).slice(0, limit);
  }
  async analyzeProfileForOptimization(profile: any) {
    try {
      const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are a professional esports profile optimizer. Analyze the profile and suggest improvements.' }, { role: 'user', content: `Analyze this gaming profile and suggest improvements:\nUsername: ${profile.username}\nBio: ${profile.bio || 'N/A'}\nMain Games: ${profile.mainGames?.join(', ') || 'N/A'}\nRank: ${profile.rank || 'N/A'}\nRole: ${profile.role || 'N/A'}\nWin Rate: ${profile.winRate}%\nK/D: ${profile.kd}\nPlay Style: ${profile.playStyle || 'N/A'}\nLanguages: ${profile.languages?.join(', ') || 'N/A'}\nProvide: 1. Profile strength score (0-100) 2. Top 3 improvements 3. Suggested bio rewrite` }], max_tokens: 500 });
      return completion.choices[0]?.message?.content || 'Analysis unavailable';
    } catch (error) { console.error('AI analysis error:', error); return 'AI analysis temporarily unavailable'; }
  }
  async analyzeMatchPerformance(matchData: any) {
    try {
      const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are an expert esports coach. Analyze match performance and provide actionable feedback.' }, { role: 'user', content: `Analyze this match performance:\nGame: ${matchData.game}\nResult: ${matchData.result}\nKills: ${matchData.kills}\nDeaths: ${matchData.deaths}\nAssists: ${matchData.assists}\nDamage: ${matchData.damage}\nAccuracy: ${matchData.accuracy}%\nProvide: 1. Performance rating (0-100) 2. Main strengths 3. Areas for improvement 4. Specific tips` }], max_tokens: 500 });
      return completion.choices[0]?.message?.content || 'Analysis unavailable';
    } catch (error) { console.error('AI match analysis error:', error); return 'AI analysis temporarily unavailable'; }
  }
  async detectToxicity(content: string): Promise<{ toxic: boolean; score: number; reason: string }> {
    try {
      const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are a content moderator. Analyze the text for toxicity, harassment, or inappropriate content. Respond with JSON: {"toxic": boolean, "score": 0-1, "reason": "string"}' }, { role: 'user', content }], response_format: { type: 'json_object' }, max_tokens: 200 });
      const result = JSON.parse(completion.choices[0]?.message?.content || '{"toxic": false, "score": 0, "reason": "No content"}'); return result;
    } catch { return { toxic: false, score: 0, reason: 'Analysis unavailable' }; }
  }
  async generateTrainingPlan(profile: any) {
    try {
      const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are a professional esports coach. Create a personalized training plan.' }, { role: 'user', content: `Create a 7-day training plan for:\nGames: ${profile.mainGames?.join(', ') || 'Various'}\nCurrent Rank: ${profile.rank || 'Unranked'}\nWin Rate: ${profile.winRate}%\nK/D: ${profile.kd}\nRole: ${profile.role || 'Flex'}\nInclude daily drills, practice routines, and improvement goals.` }], max_tokens: 1000 });
      return completion.choices[0]?.message?.content || 'Training plan unavailable';
    } catch { return 'Training plan temporarily unavailable'; }
  }
}
export const aiService = new AIService();
