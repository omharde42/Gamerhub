import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.$transaction([
    prisma.matchHistory.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.message.deleteMany(),
    prisma.chat.deleteMany(),
    prisma.postHashtag.deleteMany(),
    prisma.hashtag.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.like.deleteMany(),
    prisma.follow.deleteMany(),
    prisma.pollVoter.deleteMany(),
    prisma.pollOption.deleteMany(),
    prisma.poll.deleteMany(),
    prisma.post.deleteMany(),
    prisma.tournamentTeamMember.deleteMany(),
    prisma.tournamentTeam.deleteMany(),
    prisma.tournamentParticipant.deleteMany(),
    prisma.match.deleteMany(),
    prisma.tournament.deleteMany(),
    prisma.scrim.deleteMany(),
    prisma.practiceSchedule.deleteMany(),
    prisma.teamApplication.deleteMany(),
    prisma.teamInvite.deleteMany(),
    prisma.teamMember.deleteMany(),
    prisma.team.deleteMany(),
    prisma.savedJob.deleteMany(),
    prisma.jobApplication.deleteMany(),
    prisma.job.deleteMany(),
    prisma.organizationMember.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.report.deleteMany(),
    prisma.achievement.deleteMany(),
    prisma.certification.deleteMany(),
    prisma.tournamentHistory.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.device.deleteMany(),
    prisma.session.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.emailVerificationToken.deleteMany(),
    prisma.account.deleteMany(),
    prisma.notificationSettings.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const password = await bcrypt.hash('Password123!', 12);

  // Create admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@gamerhub.com',
      password,
      role: 'SUPER_ADMIN',
      emailVerified: new Date(),
      profile: {
        create: {
          username: 'admin',
          displayName: 'Admin',
          bio: 'GamerHub platform administrator',
          country: 'US',
          rank: 'Challenger',
          role: 'IGL',
          winRate: 85,
          kd: 3.5,
          accuracy: 78,
          totalMatches: 1500,
          wins: 1275,
          losses: 225,
          mainGames: ['Valorant', 'CS2', 'League of Legends'],
          languages: ['English', 'Spanish'],
          playStyle: 'Strategic',
          communicationStyle: 'Shotcaller',
          activeTime: 'Evenings',
        },
      },
      notificationSettings: { create: {} },
    },
  });

  // Create users with diverse profiles
  const users = [];
  const userData = [
    { username: 'pro-gamer', displayName: 'ProGamer', rank: 'Diamond', role: 'Entry Fragger', winRate: 72, kd: 2.1, games: ['Valorant', 'CS2'] },
    { username: 'sniper-king', displayName: 'SniperKing', rank: 'Master', role: 'AWPer', winRate: 68, kd: 1.8, games: ['CS2', 'Valorant'] },
    { username: 'support-main', displayName: 'SupportMain', rank: 'Gold', role: 'Support', winRate: 65, kd: 1.2, games: ['Overwatch 2', 'Valorant'] },
    { username: 'jungle-master', displayName: 'JungleMaster', rank: 'Platinum', role: 'Jungler', winRate: 70, kd: 2.5, games: ['League of Legends'] },
    { username: 'carry-player', displayName: 'CarryPlayer', rank: 'Diamond', role: 'Carry', winRate: 75, kd: 3.2, games: ['Dota 2'] },
    { username: 'fragger-01', displayName: 'Fragger01', rank: 'Silver', role: 'Entry Fragger', winRate: 55, kd: 1.0, games: ['Valorant'] },
    { username: 'strat-caller', displayName: 'StratCaller', rank: 'Platinum', role: 'IGL', winRate: 67, kd: 1.5, games: ['CS2', 'Rainbow Six Siege'] },
    { username: 'flex-player', displayName: 'FlexPlayer', rank: 'Gold', role: 'Flex', winRate: 60, kd: 1.3, games: ['Valorant', 'Apex Legends', 'Fortnite'] },
    { username: 'rookie-rising', displayName: 'RookieRising', rank: 'Bronze', role: 'Support', winRate: 45, kd: 0.8, games: ['League of Legends'] },
    { username: 'aim-labs', displayName: 'AimLabs', rank: 'Master', role: 'AWPer', winRate: 80, kd: 3.8, games: ['CS2', 'Valorant'] },
  ];

  for (const u of userData) {
    const user = await prisma.user.create({
      data: {
        email: `${u.username}@gamerhub.com`,
        password,
        emailVerified: new Date(),
        role: 'USER',
        profile: {
          create: {
            username: u.username,
            displayName: u.displayName,
            bio: `Professional ${u.role} player. Rank: ${u.rank}. Aiming for Challenger!`,
            country: ['US', 'UK', 'DE', 'KR', 'BR', 'SG'][Math.floor(Math.random() * 6)],
            rank: u.rank,
            role: u.role,
            winRate: u.winRate,
            kd: u.kd,
            accuracy: Math.floor(Math.random() * 30) + 50,
            totalMatches: Math.floor(Math.random() * 500) + 100,
            wins: Math.floor(Math.random() * 300) + 50,
            losses: Math.floor(Math.random() * 200) + 50,
            mainGames: u.games,
            languages: ['English'],
            playStyle: ['Aggressive', 'Passive', 'Balanced', 'Strategic', 'Technical'][Math.floor(Math.random() * 5)],
            communicationStyle: ['Shotcaller', 'Supportive', 'Analytical', 'Motivational', 'Quiet'][Math.floor(Math.random() * 5)],
            activeTime: ['Mornings', 'Afternoons', 'Evenings', 'Nights'][Math.floor(Math.random() * 4)],
            toxicityScore: Math.random() * 0.3,
            achievements: {
              create: [
                { title: 'First Win', description: 'Won your first match', icon: 'trophy', rarity: 'Common' },
                { title: '10 Wins Streak', description: 'Won 10 matches in a row', icon: 'fire', rarity: 'Rare' },
                { title: 'Top Fragger', description: 'Most kills in a tournament', icon: 'skull', rarity: 'Epic' },
              ],
            },
          },
        },
        notificationSettings: { create: {} },
      },
    });
    users.push(user);
  }

  // Create teams
  const teams = await Promise.all([
    prisma.team.create({
      data: { name: 'Phoenix Rising', tag: 'PR', description: 'Competitive Valorant team looking for dedicated players', rank: 'Diamond', region: 'NA', wins: 45, losses: 12, members: { create: [{ userId: users[0].id, role: 'CAPTAIN' }, { userId: users[1].id, role: 'MEMBER' }, { userId: users[2].id, role: 'MEMBER' }] } },
    }),
    prisma.team.create({
      data: { name: 'Shadow Wolves', tag: 'SW', description: 'CS2 team with tournament experience', rank: 'Master', region: 'EU', wins: 78, losses: 23, members: { create: [{ userId: users[3].id, role: 'CAPTAIN' }, { userId: users[4].id, role: 'MEMBER' }] } },
    }),
    prisma.team.create({
      data: { name: 'Cyber Knights', tag: 'CK', description: 'League of Legends competitive team', rank: 'Platinum', region: 'KR', wins: 32, losses: 15, members: { create: [{ userId: users[5].id, role: 'CAPTAIN' }, { userId: users[6].id, role: 'MANAGER' }] } },
    }),
    prisma.team.create({
      data: { name: 'Elite Squad', tag: 'ES', description: 'Multi-gaming organization recruiting talent', rank: 'Gold', region: 'NA', wins: 56, losses: 34, members: { create: [{ userId: users[7].id, role: 'CAPTAIN' }, { userId: users[8].id, role: 'COACH' }, { userId: users[9].id, role: 'MEMBER' }] } },
    }),
  ]);

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: 'GamerHub Esports',
      slug: 'gamerhub-esports',
      description: 'Official GamerHub esports organization. Hosting tournaments and scouting talent worldwide.',
      website: 'https://gamerhub.com',
      verified: true,
      location: 'Global',
      ownerId: admin.id,
      members: { create: [{ userId: admin.id, role: 'OWNER' }, { userId: users[0].id, role: 'SCOUT' }] },
    },
  });

  // Create tournaments
  const tournament = await prisma.tournament.create({
    data: {
      title: 'GamerHub Championship Series S1',
      description: 'The premier tournament hosted by GamerHub. Compete against the best teams for glory and prizes!',
      game: 'Valorant',
      type: 'SINGLE_ELIMINATION',
      status: 'REGISTRATION_OPEN',
      maxTeams: 16,
      maxTeamSize: 5,
      prizePool: 10000,
      entryFee: 0,
      startDate: new Date('2026-08-01'),
      registrationEnd: new Date('2026-07-25'),
      organizerId: org.id,
    },
  });

  // Create jobs
  await Promise.all([
    prisma.job.create({
      data: { title: 'Professional Valorant Player', description: 'Join Phoenix Rising as a full-time Valorant player. Must be Diamond+ with tournament experience.', type: 'PLAYER', status: 'OPEN', location: 'Remote', salary: '$2,000-$5,000/mo', game: 'Valorant', rankRequired: 'Diamond', organizationId: org.id },
    }),
    prisma.job.create({
      data: { title: 'Head Coach - CS2', description: 'Looking for an experienced CS2 coach to lead our competitive team. Must have coaching experience at Master+ level.', type: 'COACH', status: 'OPEN', location: 'Berlin, Germany', salary: '$3,000-$6,000/mo', game: 'CS2', rankRequired: 'Master', organizationId: org.id },
    }),
    prisma.job.create({
      data: { title: 'Esports Analyst', description: 'Analyze match data and provide insights for our tournament teams. Background in data analysis preferred.', type: 'ANALYST', status: 'OPEN', location: 'Remote', salary: '$2,500-$4,500/mo', game: 'Valorant', organizationId: org.id },
    }),
    prisma.job.create({
      data: { title: 'Team Manager', description: 'Manage day-to-day operations of our League of Legends team. Coordinate schedules, travel, and team activities.', type: 'MANAGER', status: 'OPEN', location: 'Seoul, South Korea', salary: '$3,500-$5,500/mo', game: 'League of Legends', organizationId: org.id },
    }),
  ]);

  // Create sample posts
  const postContents = [
    'Just hit Diamond rank in Valorant! Finally made it after 3 months of grinding. Huge shoutout to my team @PhoenixRising for the support! 🎉 #Valorant #Diamond #Gaming',
    'Looking for a CS2 team for the upcoming GamerHub Championship. I\'m a Master-ranked AWPer with tournament experience. DM me if interested!',
    'New personal best - 42 kills in a single match! The aim was on fire today. Check out the clip in my profile. 🔥 #CS2 #Highlight',
    'Team practice went amazing today. Our new strategy for Split is looking clean. Can\'t wait for the tournament next month! #Valorant #Esports',
    'Just finished reviewing VODs with the team. Found 3 major areas for improvement. That\'s why IGL is the most rewarding role. 🧠 #CS2 #IGL',
    'Anyone else having trouble with the new patch? The meta shift is wild. Adapt or die I guess. #LeagueOfLegends',
    'Proud of my team for making it to the semifinals! We may not have won it all, but the growth is real. See you next season. 💪 #Esports #Tournament',
    'Hot take: Aim trainers are overrated. Stop spending hours in aim labs and play more actual matches. Game sense > raw aim. Thoughts?',
    'Looking for a dedicated duo partner for ranked. Platinum+ in Valorant. I play Controller/Flex. Must have good comms and positive attitude.',
    'Big announcement coming soon! Stay tuned... 👀 #ComingSoon',
  ];

  for (let i = 0; i < 10; i++) {
    const post = await prisma.post.create({
      data: {
        content: postContents[i],
        userId: users[i % users.length].id,
        tags: postContents[i].match(/#\w+/g)?.map(t => t.slice(1)) || [],
      },
    });
    
    // Create hashtags
    const tags = postContents[i].match(/#\w+/g)?.map(t => t.slice(1).toLowerCase()) || [];
    for (const tag of tags) {
      await prisma.hashtag.upsert({
        where: { name: tag },
        update: { count: { increment: 1 } },
        create: { name: tag, count: 1 },
      });
      await prisma.postHashtag.create({
        data: { postId: post.id, hashtagId: (await prisma.hashtag.findUnique({ where: { name: tag } }))!.id },
      }).catch(() => {});
    }
  }

  // Create match history for analytics
  const results = ['WIN', 'LOSS'];
  const games = ['Valorant', 'CS2', 'League of Legends', 'Apex Legends'];
  const maps = ['Ascent', 'Bind', 'Haven', 'Split', 'Mirage', 'Inferno', 'Summoners Rift', 'Kings Canyon'];

  for (const user of users) {
    for (let i = 0; i < 20; i++) {
      const kills = Math.floor(Math.random() * 30) + 5;
      const deaths = Math.floor(Math.random() * 20) + 5;
      const result = results[Math.floor(Math.random() * results.length)];
      await prisma.matchHistory.create({
        data: {
          game: games[Math.floor(Math.random() * games.length)],
          result,
          kills,
          deaths,
          assists: Math.floor(Math.random() * 15),
          damage: Math.floor(Math.random() * 5000) + 1000,
          accuracy: Math.floor(Math.random() * 30) + 40,
          duration: Math.floor(Math.random() * 30) + 15,
          map: maps[Math.floor(Math.random() * maps.length)],
          mode: 'Competitive',
          playedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          userId: user.id,
        },
      });
    }
  }

  console.log('✅ Seeding complete!');
  console.log(`   - ${users.length + 1} users (including admin)`);
  console.log(`   - ${teams.length} teams`);
  console.log(`   - 1 organization`);
  console.log(`   - 1 tournament`);
  console.log(`   - 4 jobs`);
  console.log(`   - 10 posts with hashtags`);
  console.log(`   - ${users.length * 20} match history entries`);
  console.log(`\n📧 Admin login: admin@gamerhub.com / Password123!`);
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
