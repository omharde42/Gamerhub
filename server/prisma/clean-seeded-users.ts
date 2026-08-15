import prisma from '../src/config/database';

export async function cleanSeededUsers() {
  try {
    console.log('🔍 Identifying seeded synthetic users...');

    // Find all synthetic seeded users (gamer_1@gamerhub.com, gamer_2@gamerhub.com, etc.)
    const seededUsers = await prisma.user.findMany({
      where: {
        AND: [
          { email: { startsWith: 'gamer_' } },
          { email: { endsWith: '@gamerhub.com' } },
          { role: { not: 'ADMIN' } },
        ],
      },
      select: { id: true, email: true, profile: { select: { username: true } } },
    });

    if (seededUsers.length === 0) {
      console.log('✅ No seeded synthetic users found. All existing users are genuine!');
      return;
    }

    console.log(`⚠️ Found ${seededUsers.length} synthetic seeded users to remove.`);
    console.log('ℹ️ Genuine real user accounts will NOT be touched.');

    const seededUserIds = seededUsers.map((u) => u.id);

    console.log('🧹 Cleaning dependent relations for seeded users...');

    // Delete relations specifically owned by or associated with seeded users
    await prisma.like.deleteMany({ where: { userId: { in: seededUserIds } } }).catch(() => {});
    await prisma.comment.deleteMany({ where: { userId: { in: seededUserIds } } }).catch(() => {});
    await prisma.post.deleteMany({ where: { authorId: { in: seededUserIds } } }).catch(() => {});
    await prisma.chatParticipant.deleteMany({ where: { userId: { in: seededUserIds } } }).catch(() => {});
    await prisma.message.deleteMany({ where: { senderId: { in: seededUserIds } } }).catch(() => {});
    await prisma.matchHistory.deleteMany({ where: { userId: { in: seededUserIds } } }).catch(() => {});
    await prisma.teamMember.deleteMany({ where: { userId: { in: seededUserIds } } }).catch(() => {});
    await prisma.teamInvite.deleteMany({ where: { userId: { in: seededUserIds } } }).catch(() => {});
    await prisma.teamApplication.deleteMany({ where: { userId: { in: seededUserIds } } }).catch(() => {});
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId: { in: seededUserIds } },
          { receiverId: { in: seededUserIds } },
        ],
      },
    }).catch(() => {});
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: { in: seededUserIds } },
          { followingId: { in: seededUserIds } },
        ],
      },
    }).catch(() => {});
    await prisma.gameAccount.deleteMany({ where: { userId: { in: seededUserIds } } }).catch(() => {});
    await prisma.profile.deleteMany({ where: { userId: { in: seededUserIds } } }).catch(() => {});
    await prisma.session.deleteMany({ where: { userId: { in: seededUserIds } } }).catch(() => {});
    await prisma.account.deleteMany({ where: { userId: { in: seededUserIds } } }).catch(() => {});
    await prisma.notification.deleteMany({ where: { userId: { in: seededUserIds } } }).catch(() => {});
    await prisma.notificationSettings.deleteMany({ where: { userId: { in: seededUserIds } } }).catch(() => {});

    // Finally delete the synthetic users
    const deleteResult = await prisma.user.deleteMany({
      where: { id: { in: seededUserIds } },
    });

    console.log(`✅ Successfully removed ${deleteResult.count} synthetic seeded users!`);

    // Count remaining genuine users
    const remainingUsers = await prisma.user.count();
    console.log(`✨ Total remaining active genuine users: ${remainingUsers}`);
  } catch (e: any) {
    console.error('❌ Error cleaning seeded users:', e?.message || e);
  }
}

if (require.main === module) {
  cleanSeededUsers().then(() => process.exit(0)).catch(() => process.exit(1));
}
