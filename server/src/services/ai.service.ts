import { openai } from '../config/openai';
import prisma from '../config/database';
import { AIRecommendation } from '../types';
import OpenAI from 'openai';

function generateLocalProfileAnalysis(profile: any): string {
  const games = profile.mainGames?.length || 0;
  const hasRank = !!profile.rank;
  const hasKD = !!profile.kd;
  const hasWR = !!profile.winRate;
  const hasBio = !!profile.bio;
  const hasSocial = !!(profile.twitch || profile.youtube || profile.discord);
  const completeness = [hasBio, hasRank, hasKD, hasWR, games > 0, hasSocial].filter(Boolean).length;
  const score = Math.round((completeness / 6) * 100);
  let analysis = `Profile Strength Score: ${score}/100\n\n`;
  if (score < 50) {
    analysis += 'Areas for Improvement:\n- Add your main games to attract relevant teammates\n- Set your rank so matchmaking can find similar-skilled players\n- Connect your streaming/social profiles for more visibility\n- Write a bio highlighting your playstyle and goals\n';
  } else if (score < 80) {
    analysis += 'Good progress! To optimize further:\n- Add more specific details about your role and playstyle\n- Connect additional game accounts for verified stats\n- Update your tournament history and achievements\n';
  } else {
    analysis += 'Strong profile! Maintain it by:\n- Keeping stats updated with recent matches\n- Adding new achievements and certifications\n- Engaging with the community for endorsements\n';
  }
  if (profile.winRate) {
    analysis += `\nWin Rate Analysis: ${profile.winRate}%\n`;
    if (profile.winRate > 60) analysis += 'Your win rate is above average. Focus on maintaining consistency and shotcalling for your team.\n';
    else if (profile.winRate > 45) analysis += 'Solid win rate. Identify specific maps or scenarios where you underperform and target those.\n';
    else analysis += 'Below average win rate. Consider reviewing your fundamentals and playing more conservative until you build consistency.\n';
  }
  if (profile.kd) {
    analysis += `\nK/D Ratio: ${profile.kd}\n`;
    if (profile.kd > 1.5) analysis += 'Strong K/D indicates good mechanics. Work on game sense and positioning to convert kills into round wins.\n';
    else if (profile.kd > 0.8) analysis += 'Average K/D. Focus on crosshair placement, movement, and taking favorable engagements.\n';
    else analysis += 'Below average K/D. Practice aim trainers (30min/day) and work on staying alive longer in rounds.\n';
  }
  return analysis;
}

function generateLocalMatchAnalysis(stats: any): string {
  if (!stats || !stats.recentPerformance) return 'Play more matches to receive performance analysis. Connect your game accounts for detailed stats.';
  const mp = stats.recentPerformance;
  const kd = mp.kills / Math.max(mp.deaths, 1);
  let analysis = `Match Performance Rating: ${Math.round(Math.min(kd * 25 + (mp.accuracy || 0) * 0.3, 100))}/100\n\n`;
  analysis += `Game: ${mp.game || 'Competitive'}\n`;
  analysis += `Recent K/D: ${kd.toFixed(2)}\n`;
  analysis += `Accuracy: ${mp.accuracy || 0}%\n\n`;
  analysis += 'Strengths:\n';
  if (kd > 1.2) analysis += '- Good mechanical skill in aim duels\n';
  if ((mp.accuracy || 0) > 50) analysis += '- Above average accuracy\n';
  if (mp.assists > mp.deaths) analysis += '- Strong team player with good assist numbers\n';
  analysis += '\nAreas to Improve:\n';
  if (kd < 1) analysis += '- Work on crosshair placement and spray control\n- Practice peeking angles and jiggle peeking\n';
  if ((mp.accuracy || 0) < 40) analysis += '- Focus on crosshair placement at head level\n- Reduce unnecessary movement while shooting\n';
  analysis += '\nTip: Review your VODs to identify positioning mistakes and rotate earlier based on team callouts.';
  return analysis;
}

function generateLocalTrainingPlan(profile: any): string {
  const games = profile.mainGames?.length > 0 ? profile.mainGames[0] : 'your game';
  const rank = profile.rank || 'your current rank';
  return `📅 7-Day Training Plan for ${games} (${rank})

Day 1 - Fundamentals:
• 15min: Aim trainer (click timing, tracking)
• 20min: Movement drills (strafe shooting, counter-strafing)
• 25min: Ranked matches (focus on crosshair placement)
• 10min: Review 1 match replay

Day 2 - Mechanics:
• 15min: Reflex training (reaction time scenarios)
• 20min: Spray control / recoil patterns
• 25min: Ranked matches (focus on utility usage)
• 10min: Study pro player POV

Day 3 - Game Sense:
• 15min: Map knowledge drills (callouts, timings)
• 20min: Positioning practice (hold angles, trade spots)
• 25min: Ranked matches (focus on rotations)
• 10min: Team comms review

Day 4 - Team Play:
• 15min: Communication exercises
• 20min: Team deathmatch / scrimmage
• 25min: Ranked with party (focus on synergy)
• 10min: Review team fights

Day 5 - Weakness Focus:
• 15min: Identify weakest aspect from week
• 20min: Targeted drills for weakness
• 25min: Ranked matches (focus on improvement area)
• 10min: Progress tracking

Day 6 - Endurance:
• 30min: Extended practice session
• 30min: Ranked matches (maintain focus throughout)
• 10min: Physical stretches

Day 7 - Review & Plan:
• 15min: Weekly stats review
• 15min: Set next week's goals
• 30min: Free play / try new strategies
• 10min: Plan next week's schedule

Pro Tip: Quality > quantity. Focused 2hr sessions > 5hrs distracted play.`;
}

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
      if (profile.country && candidate.country === profile.country) { score += 20; reasons.push('Same region'); }
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
    if (!openai) return generateLocalProfileAnalysis(profile);
    try {
      const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are a professional esports profile optimizer. Analyze the profile and suggest improvements.' }, { role: 'user', content: `Analyze this gaming profile and suggest improvements:\nUsername: ${profile.username}\nBio: ${profile.bio || 'N/A'}\nMain Games: ${profile.mainGames?.join(', ') || 'N/A'}\nRank: ${profile.rank || 'N/A'}\nRole: ${profile.role || 'N/A'}\nWin Rate: ${profile.winRate}%\nK/D: ${profile.kd}\nPlay Style: ${profile.playStyle || 'N/A'}\nLanguages: ${profile.languages?.join(', ') || 'N/A'}\nProvide: 1. Profile strength score (0-100) 2. Top 3 improvements 3. Suggested bio rewrite` }], max_tokens: 500 });
      return completion.choices[0]?.message?.content || generateLocalProfileAnalysis(profile);
    } catch (error) { console.error('AI analysis error:', error); return generateLocalProfileAnalysis(profile); }
  }

  async analyzeMatchPerformance(matchData: any) {
    if (!openai) return generateLocalMatchAnalysis(matchData);
    try {
      const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are an expert esports coach. Analyze match performance and provide actionable feedback.' }, { role: 'user', content: `Analyze this match performance:\nGame: ${matchData.game}\nResult: ${matchData.result}\nKills: ${matchData.kills}\nDeaths: ${matchData.deaths}\nAssists: ${matchData.assists}\nDamage: ${matchData.damage}\nAccuracy: ${matchData.accuracy}%\nProvide: 1. Performance rating (0-100) 2. Main strengths 3. Areas for improvement 4. Specific tips` }], max_tokens: 500 });
      return completion.choices[0]?.message?.content || generateLocalMatchAnalysis(matchData);
    } catch (error) { console.error('AI match analysis error:', error); return generateLocalMatchAnalysis(matchData); }
  }

  async detectToxicity(content: string): Promise<{ toxic: boolean; score: number; reason: string }> {
    const toxicWords = ['hate', 'kill yourself', 'trash', 'noob', 'stupid', 'idiot', 'garbage', 'useless', 'report', 'troll'];
    const lower = content.toLowerCase();
    const found = toxicWords.filter(w => lower.includes(w));
    if (found.length > 0) return { toxic: true, score: Math.min(found.length * 0.2, 1), reason: `Contains flagged language: ${found.join(', ')}` };
    if (!openai) return { toxic: false, score: 0, reason: 'Clean content' };
    try {
      const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are a content moderator. Analyze the text for toxicity, harassment, or inappropriate content. Respond with JSON: {"toxic": boolean, "score": 0-1, "reason": "string"}' }, { role: 'user', content }], response_format: { type: 'json_object' }, max_tokens: 200 });
      const result = JSON.parse(completion.choices[0]?.message?.content || '{"toxic": false, "score": 0, "reason": "No content"}'); return result;
    } catch { return { toxic: false, score: 0, reason: 'Analysis unavailable' }; }
  }

  async generateTrainingPlan(profile: any) {
    if (!openai) return generateLocalTrainingPlan(profile);
    try {
      const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are a professional esports coach. Create a personalized training plan.' }, { role: 'user', content: `Create a 7-day training plan for:\nGames: ${profile.mainGames?.join(', ') || 'Various'}\nCurrent Rank: ${profile.rank || 'Unranked'}\nWin Rate: ${profile.winRate}%\nK/D: ${profile.kd}\nRole: ${profile.role || 'Flex'}\nInclude daily drills, practice routines, and improvement goals.` }], max_tokens: 1000 });
      return completion.choices[0]?.message?.content || generateLocalTrainingPlan(profile);
    } catch { return generateLocalTrainingPlan(profile); }
  }

  async chat(message: string, history: { role: string; content: string }[], profile: any): Promise<string> {
    const fallbackResponses: Record<string, string> = {
      aim: "Focus on 30-min daily aim trainer routines. Try KovaaK's or Aim Lab with scenarios like Tile Frenzy, Microshot, and Pasu Track. Also do 10-min deathmatch before ranked matches.",
      strategy: "Map control wins games. Focus on: 1) Crosshair placement at head level 2) Trade kills with teammates 3) Use utility before peeking 4) Play around your team's strengths. Review your VODs to spot rotation mistakes.",
      rank: "To rank up: 1) Master 2-3 agents/heroes deeply 2) Communicate clearly but briefly 3) Track ultimates/abilities 4) Play during peak hours for better matchmaking 5) Stop after 2 consecutive losses.",
      teammate: "Look for players with: 1) Similar rank (+/- 2 divisions) 2) Complementary roles 3) Positive communication style 4) Active at your usual hours. Check their win rate and K/D trends.",
      practice: "Structured practice > grinding. Split your session: 15min warmup (aim trainers), 20min mechanics (movement/combat drills), 30min focused ranked, 10min VOD review. Track your progress weekly.",
      default: "Great question! Focus on fundamentals: crosshair placement, movement mechanics, map knowledge, and communication. Consistency in practice matters more than hours played. What specific game or role do you want help with?"
    };
    if (!openai) {
      const key = Object.keys(fallbackResponses).find(k => message.toLowerCase().includes(k)) || 'default';
      return fallbackResponses[key];
    }
    try {
      const systemPrompt: OpenAI.Chat.ChatCompletionMessageParam = { role: 'system', content: `You are GamerHub AI Coach, an expert gaming coach assistant. You help gamers improve their skills, find teammates, and level up. 
The user's profile: Games: ${profile?.mainGames?.join(', ') || 'Various'}, Rank: ${profile?.rank || 'Unranked'}, Role: ${profile?.role || 'Flex'}, Win Rate: ${profile?.winRate || 0}%, K/D: ${profile?.kd || 0}.
Keep responses concise, actionable, and encouraging. Focus on gaming improvement tips, strategies, and motivation. Never be rude or discouraging.` };
      const historyMessages: OpenAI.Chat.ChatCompletionMessageParam[] = history.slice(-10).map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
      const userMessage: OpenAI.Chat.ChatCompletionMessageParam = { role: 'user', content: message };
      const messages = [systemPrompt, ...historyMessages, userMessage];
      const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages, max_tokens: 500, temperature: 0.7 });
      return completion.choices[0]?.message?.content || fallbackResponses.default;
    } catch (error) {
      console.error('AI chat error:', error);
      return "I'm having trouble processing that right now. Let me try a simpler response: focus on fundamentals like crosshair placement, movement mechanics, map knowledge, and communication. Consistency in practice matters more than hours played. What specific game or role do you want help with?";
    }
  }

  async summarizeNews(articles: any[]): Promise<string> {
    if (!openai || !articles.length) return '';
    try {
      const titles = articles.map((a: any) => a.title).join('\n');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a gaming news curator. Summarize the top gaming/esports news stories in 3-4 bullet points. Be concise and exciting.' },
          { role: 'user', content: `Summarize these gaming news headlines:\n${titles}` }
        ],
        max_tokens: 300,
      });
      return completion.choices[0]?.message?.content || '';
    } catch {
      return '';
    }
  }
}
export const aiService = new AIService();
