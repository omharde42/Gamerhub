import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  let targetUserCount = 50;
  const userArg = args.find(a => a.startsWith('--users='));
  if (userArg) {
    targetUserCount = parseInt(userArg.split('=')[1], 10) || 50;
  }

  console.log(`🌱 Seeding database with target ${targetUserCount} users...`);

  // Clean existing data sequentially to avoid foreign key deadlocks
  console.log('🧹 Cleaning existing data...');
  await prisma.postHashtag.deleteMany().catch(() => {});
  await prisma.hashtag.deleteMany().catch(() => {});
  await prisma.pollVoter.deleteMany().catch(() => {});
  await prisma.pollOption.deleteMany().catch(() => {});
  await prisma.poll.deleteMany().catch(() => {});
  await prisma.like.deleteMany().catch(() => {});
  await prisma.comment.deleteMany().catch(() => {});
  await prisma.post.deleteMany().catch(() => {});
  await prisma.messageRead.deleteMany().catch(() => {});
  await prisma.messageReaction.deleteMany().catch(() => {});
  await prisma.typingIndicator.deleteMany().catch(() => {});
  await prisma.chatParticipant.deleteMany().catch(() => {});
  await prisma.message.deleteMany().catch(() => {});
  await prisma.chat.deleteMany().catch(() => {});
  await prisma.matchHistory.deleteMany().catch(() => {});
  await prisma.match.deleteMany().catch(() => {});
  await prisma.tournamentTeamMember.deleteMany().catch(() => {});
  await prisma.tournamentTeam.deleteMany().catch(() => {});
  await prisma.tournamentParticipant.deleteMany().catch(() => {});
  await prisma.tournamentHistory.deleteMany().catch(() => {});
  await prisma.tournament.deleteMany().catch(() => {});
  await prisma.scrim.deleteMany().catch(() => {});
  await prisma.practiceSchedule.deleteMany().catch(() => {});
  await prisma.teamApplication.deleteMany().catch(() => {});
  await prisma.teamInvite.deleteMany().catch(() => {});
  await prisma.teamMember.deleteMany().catch(() => {});
  await prisma.team.deleteMany().catch(() => {});
  await prisma.savedJob.deleteMany().catch(() => {});
  await prisma.jobApplication.deleteMany().catch(() => {});
  await prisma.job.deleteMany().catch(() => {});
  await prisma.organizationMember.deleteMany().catch(() => {});
  await prisma.organization.deleteMany().catch(() => {});
  await prisma.subscription.deleteMany().catch(() => {});
  await prisma.report.deleteMany().catch(() => {});
  await prisma.gameAccount.deleteMany().catch(() => {});
  await prisma.profile.deleteMany().catch(() => {});
  await prisma.device.deleteMany().catch(() => {});
  await prisma.session.deleteMany().catch(() => {});
  await prisma.passwordResetToken.deleteMany().catch(() => {});
  await prisma.emailVerificationToken.deleteMany().catch(() => {});
  await prisma.account.deleteMany().catch(() => {});
  await prisma.notification.deleteMany().catch(() => {});
  await prisma.notificationSettings.deleteMany().catch(() => {});
  await prisma.auditLog.deleteMany().catch(() => {});
  await prisma.friendRequest.deleteMany().catch(() => {});
  await prisma.follow.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});

  console.log('🧹 Database cleaned');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Ensure Admin User
  const adminId = crypto.randomUUID();
  const adminProfileId = crypto.randomUUID();
  await prisma.user.create({
    data: {
      id: adminId,
      email: 'admin@gamerhub.com',
      password: passwordHash,
      role: 'ADMIN',
      emailVerified: new Date(),
      profile: {
        create: {
          id: adminProfileId,
          username: 'admin',
          displayName: 'GamerZ Admin',
          bio: 'GamerZ Hub Platform Administrator & Tournament Director',
          country: 'US',
          rank: 'Challenger',
          role: 'IGL',
          winRate: 85.0,
          kd: 3.5,
          accuracy: 78.0,
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

  console.log('👤 Admin ensured');

  // 2. High-Performance Chunked Seeding for Scaled Users
  const ranks = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Challenger'];
  const roles = ['Entry Fragger', 'Support', 'AWPer', 'IGL', 'Lurker', 'Flex', 'Carry', 'Jungler', 'Mid Laner'];
  const countries = ['US', 'UK', 'DE', 'KR', 'BR', 'SG', 'IN', 'JP', 'FR', 'CA'];
  const gamePool = ['Valorant', 'CS2', 'League of Legends', 'Dota 2', 'Overwatch 2', 'Apex Legends', 'Fortnite', 'PUBG / BGMI', 'Free Fire', 'Clash Royale'];
  const playStyles = ['Aggressive', 'Passive', 'Balanced', 'Strategic', 'Technical'];
  const commStyles = ['Shotcaller', 'Supportive', 'Analytical', 'Motivational', 'Quiet'];

  const userBatchSize = 250;
  const createdUserIds: string[] = [adminId];

  console.log(`🚀 Starting bulk generation of ${targetUserCount} users in batches of ${userBatchSize}...`);

  for (let b = 0; b < targetUserCount; b += userBatchSize) {
    const currentBatchCount = Math.min(userBatchSize, targetUserCount - b);
    const userRecords = [];
    const profileRecords = [];
    const gameAccountRecords = [];
    const notificationSettingRecords = [];

    for (let i = 0; i < currentBatchCount; i++) {
      const globalIdx = b + i + 1;
      const uId = crypto.randomUUID();
      const pId = crypto.randomUUID();
      const username = `gamer_${globalIdx}`;
      const email = `gamer_${globalIdx}@gamerhub.com`;
      const rank = ranks[globalIdx % ranks.length];
      const role = roles[globalIdx % roles.length];
      const country = countries[globalIdx % countries.length];
      const primaryGame = gamePool[globalIdx % gamePool.length];

      createdUserIds.push(uId);

      userRecords.push({
        id: uId,
        email,
        password: passwordHash,
        role: 'USER' as const,
        emailVerified: new Date(),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 86400000)),
      });

      profileRecords.push({
        id: pId,
        userId: uId,
        username,
        displayName: `Gamer ${globalIdx}`,
        bio: `Competitive ${role} main specializing in ${primaryGame}. Aiming for ${rank}!`,
        country,
        rank,
        role,
        winRate: parseFloat((45 + (globalIdx % 45) + Math.random() * 5).toFixed(1)),
        kd: parseFloat((0.8 + (globalIdx % 3) + Math.random() * 0.5).toFixed(2)),
        accuracy: Math.floor(45 + Math.random() * 35),
        totalMatches: Math.floor(100 + Math.random() * 800),
        wins: Math.floor(50 + Math.random() * 400),
        losses: Math.floor(30 + Math.random() * 300),
        mainGames: [primaryGame],
        languages: ['English'],
        playStyle: playStyles[globalIdx % playStyles.length],
        communicationStyle: commStyles[globalIdx % commStyles.length],
        activeTime: 'Evenings',
        toxicityScore: parseFloat((Math.random() * 0.15).toFixed(3)),
      });

      // Create linked verified GameAccount
      gameAccountRecords.push({
        id: crypto.randomUUID(),
        userId: uId,
        game: primaryGame.toUpperCase().replace(/\s*\/\s*/g, '_'),
        inGameUid: `UID_${100000 + globalIdx}`,
        inGameName: `${username}_IGN`,
        rank,
        level: Math.floor(10 + Math.random() * 200),
        kdRatio: parseFloat((0.9 + Math.random() * 1.5).toFixed(2)),
        winRate: parseFloat((50 + Math.random() * 25).toFixed(1)),
        verified: true,
        syncStatus: 'SUCCESS',
        lastSyncedAt: new Date(),
      });

      notificationSettingRecords.push({
        id: crypto.randomUUID(),
        userId: uId,
      });
    }

    await prisma.user.createMany({ data: userRecords, skipDuplicates: true });
    await prisma.profile.createMany({ data: profileRecords, skipDuplicates: true });
    await prisma.gameAccount.createMany({ data: gameAccountRecords, skipDuplicates: true });
    await prisma.notificationSettings.createMany({ data: notificationSettingRecords, skipDuplicates: true });

    console.log(`   ✔ Batch ${Math.floor(b / userBatchSize) + 1} (${b + currentBatchCount}/${targetUserCount}) users created`);
  }

  console.log(`👥 Successfully created ${createdUserIds.length} users!`);

  // 3. Create Teams
  console.log('🏷️ Generating Teams & Squad Memberships...');
  const teams = [
    await prisma.team.create({ data: { name: 'Phoenix Rising', tag: 'PR', description: 'Competitive Valorant squad looking for dedicated entry fraggers.', rank: 'Diamond', region: 'NA', wins: 45, losses: 12 } }),
    await prisma.team.create({ data: { name: 'Shadow Wolves', tag: 'SW', description: 'CS2 tournament team with active ELO ladder grinding.', rank: 'Master', region: 'EU', wins: 78, losses: 23 } }),
    await prisma.team.create({ data: { name: 'Cyber Knights', tag: 'CK', description: 'League of Legends competitive scrim team.', rank: 'Platinum', region: 'KR', wins: 32, losses: 15 } }),
    await prisma.team.create({ data: { name: 'Elite Squad', tag: 'ES', description: 'Multi-gaming organization scouting talent worldwide.', rank: 'Gold', region: 'NA', wins: 56, losses: 34 } }),
  ];

  const teamMemberRecords = [];
  for (let i = 0; i < Math.min(20, createdUserIds.length); i++) {
    const t = teams[i % teams.length];
    teamMemberRecords.push({
      id: crypto.randomUUID(),
      teamId: t.id,
      userId: createdUserIds[i],
      role: i === 0 ? 'CAPTAIN' : 'MEMBER',
    });
  }
  await prisma.teamMember.createMany({ data: teamMemberRecords, skipDuplicates: true });

  // 4. Create Organization & Tournament
  console.log('🏆 Generating Organization & Championship Tournament...');
  const org = await prisma.organization.create({
    data: {
      name: 'GamerHub Esports',
      slug: 'gamerhub-esports',
      description: 'Official GamerHub esports organization. Hosting tournaments and scouting talent worldwide.',
      website: 'https://gamerhub.com',
      verified: true,
      location: 'Global',
      ownerId: adminId,
      members: { create: [{ userId: adminId, role: 'OWNER' }] },
    },
  });

  await prisma.tournament.create({
    data: {
      title: 'GamerHub Championship Series S1',
      description: 'The premier tournament hosted by GamerHub. Compete against top teams for glory and prize pools!',
      game: 'Valorant',
      type: 'SINGLE_ELIMINATION',
      status: 'REGISTRATION_OPEN',
      maxTeams: 16,
      maxTeamSize: 5,
      prizePool: 10000,
      entryFee: 0,
      startDate: new Date(Date.now() + 7 * 86400000),
      registrationEnd: new Date(Date.now() + 3 * 86400000),
      organizerId: org.id,
    },
  });

  // 5. Bulk Generation of Posts, Comments & Likes
  console.log('📝 Generating Feed Posts, Comments & Likes...');
  const postTemplates = [
    'Just hit Radiant rank in Valorant! 3 months of hard grind finally paid off. Huge shoutout to my squad! 🎉 #Valorant #Radiant',
    'Looking for a CS2 team for the upcoming GamerHub Championship Series. Master AWPer with tournament VODs ready. DM me!',
    'New personal best — 42 kills in a single competitive match! Check out the highlight clip. 🔥 #CS2 #ACE',
    'Team practice went amazing today. Our execute strategies for Ascent and Haven are looking clean. #Valorant #Esports',
    'Just finished reviewing match VODs with the coach. Analyzing positioning and utility usage is how you rank up! 🧠 #Gaming',
    'Anyone else grinding the new season update? The weapon meta shift is insane. Adapt or lose! #Gaming',
    'Proud of the squad for making it to the semifinals in today\'s tournament scrims! Progress is real. 💪 #Esports',
    'Aim labs vs actual competitive matches — what yields better crosshair placement? Drop your thoughts below!',
  ];

  const postCount = Math.min(targetUserCount * 2, 1000);
  const postRecords = [];
  for (let p = 0; p < postCount; p++) {
    const authorId = createdUserIds[p % createdUserIds.length];
    const template = postTemplates[p % postTemplates.length];
    postRecords.push({
      id: crypto.randomUUID(),
      content: `${template} (Match #${p + 101})`,
      userId: authorId,
      tags: ['Gaming', 'Esports', 'Competitive'],
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000)),
    });
  }
  await prisma.post.createMany({ data: postRecords, skipDuplicates: true });

  // 6. Bulk Generation of Match Histories
  console.log('📊 Generating Match History & Analytics Data...');
  const matchHistoryRecords = [];
  const sampleGames = ['Valorant', 'CS2', 'League of Legends', 'Apex Legends'];
  const sampleMaps = ['Ascent', 'Haven', 'Bind', 'Split', 'Mirage', 'Inferno'];
  const matchCount = Math.min(targetUserCount * 5, 2500);

  for (let m = 0; m < matchCount; m++) {
    const uId = createdUserIds[m % createdUserIds.length];
    const kills = Math.floor(Math.random() * 25) + 5;
    const deaths = Math.floor(Math.random() * 18) + 4;
    matchHistoryRecords.push({
      id: crypto.randomUUID(),
      userId: uId,
      game: sampleGames[m % sampleGames.length],
      result: m % 2 === 0 ? 'WIN' : 'LOSS',
      kills,
      deaths,
      assists: Math.floor(Math.random() * 12),
      damage: Math.floor(1000 + Math.random() * 4000),
      accuracy: Math.floor(40 + Math.random() * 35),
      duration: Math.floor(15 + Math.random() * 30),
      map: sampleMaps[m % sampleMaps.length],
      mode: 'Competitive',
      playedAt: new Date(Date.now() - Math.floor(Math.random() * 60 * 86400000)),
    });
  }
  await prisma.matchHistory.createMany({ data: matchHistoryRecords, skipDuplicates: true });

  console.log('\n✅ Data Scaling Complete!');
  console.log(`   - ${createdUserIds.length} Total Users Seeded`);
  console.log(`   - ${postRecords.length} Posts Generated`);
  console.log(`   - ${matchHistoryRecords.length} Match History Logs Created`);
  console.log(`   - 4 Competitive Teams & 1 Championship Tournament`);
  console.log(`\n📧 Admin Login: admin@gamerhub.com / Password123!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
