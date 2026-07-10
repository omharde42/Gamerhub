import prisma from '../config/database';
export class FeedService {
  async getFeed(userId: string, page: number = 1, limit: number = 20) {
    const following = await prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    const followingIds = [userId, ...following.map(f => f.followingId)];
    const [posts, total] = await Promise.all([prisma.post.findMany({ where: { isPublished: true, userId: { in: followingIds } }, skip: (page - 1) * limit, take: limit, include: { user: { select: { id: true, profile: true } }, _count: { select: { likes: true, comments: true } }, likes: { where: { userId }, take: 1 }, poll: { include: { options: true } } }, orderBy: { createdAt: 'desc' } }), prisma.post.count({ where: { isPublished: true, userId: { in: followingIds } } })]);
    return { data: posts.map(post => ({ ...post, isLiked: post.likes.length > 0, likes: undefined })), meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } };
  }
  async follow(followerId: string, followingId: string) { return prisma.follow.upsert({ where: { followerId_followingId: { followerId, followingId } }, update: {}, create: { followerId, followingId } }); }
  async unfollow(followerId: string, followingId: string) { await prisma.follow.deleteMany({ where: { followerId, followingId } }); }
  async getFollowing(userId: string) { return prisma.follow.findMany({ where: { followerId: userId }, include: { following: { select: { id: true, profile: true } } } }); }
  async getFollowers(userId: string) { return prisma.follow.findMany({ where: { followingId: userId }, include: { follower: { select: { id: true, profile: true } } } }); }
}
export const feedService = new FeedService();
