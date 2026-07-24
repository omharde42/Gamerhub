import prisma from '../config/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class PostService {
  async create(
    data: { content: string; type?: string; media?: string[]; tags?: string[]; poll?: { question: string; options: string[] } },
    userId: string
  ) {
    const post = await prisma.post.create({
      data: {
        content: data.content,
        type: (data.type as any) || (data.poll ? 'POLL' : data.media?.length ? 'CLIP' : 'POST'),
        media: data.media || [],
        tags: data.tags || [],
        userId,
        poll: data.poll ? {
          create: {
            question: data.poll.question,
            options: {
              create: data.poll.options.map(opt => ({ text: opt }))
            }
          }
        } : undefined,
      },
      include: {
        user: { select: { id: true, profile: true } },
        _count: { select: { likes: true, comments: true } },
        poll: {
          include: {
            options: {
              include: {
                voters: true
              }
            }
          }
        }
      }
    });

    if (data.tags) {
      for (const tag of data.tags) {
        const hashtag = await prisma.hashtag.upsert({
          where: { name: tag.toLowerCase() },
          update: { count: { increment: 1 } },
          create: { name: tag.toLowerCase(), count: 1 }
        });
        await prisma.postHashtag.create({ data: { postId: post.id, hashtagId: hashtag.id } });
      }
    }
    return post;
  }

  async list(params: { page?: number; limit?: number; hashtag?: string; userId?: string; following?: string }) {
    const { page = 1, limit = 20, hashtag, userId, following } = params;
    const where: any = { isPublished: true };
    if (hashtag) where.hashtags = { some: { hashtag: { name: hashtag.toLowerCase() } } };
    if (userId) where.userId = userId;
    if (following) {
      const follows = await prisma.follow.findMany({ where: { followerId: following }, select: { followingId: true } });
      where.userId = { in: [...follows.map((f: any) => f.followingId), following] };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, profile: true } },
          _count: { select: { likes: true, comments: true } },
          likes: { take: 3, include: { user: { select: { id: true, profile: true } } } },
          poll: {
            include: {
              options: {
                include: {
                  voters: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.post.count({ where })
    ]);

    return {
      data: posts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 }
    };
  }

  async getById(id: string) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, profile: true } },
        comments: {
          include: {
            user: { select: { id: true, profile: true } },
            likes: true,
            replies: { include: { user: { select: { id: true, profile: true } } } }
          },
          orderBy: { createdAt: 'asc' }
        },
        likes: { include: { user: { select: { id: true, profile: true } } } },
        _count: { select: { likes: true, comments: true } },
        poll: {
          include: {
            options: {
              include: {
                voters: true
              }
            }
          }
        }
      }
    });

    if (post) await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return post;
  }

  async votePoll(pollOptionId: string, userId: string) {
    const option = await prisma.pollOption.findUnique({
      where: { id: pollOptionId },
      include: { poll: true }
    });
    if (!option) throw new NotFoundError('Poll Option');

    const existingVote = await prisma.pollVoter.findFirst({
      where: {
        userId,
        pollOption: {
          pollId: option.pollId
        }
      }
    });

    if (existingVote) {
      await prisma.pollVoter.delete({ where: { id: existingVote.id } });
      await prisma.pollOption.update({ where: { id: existingVote.pollOptionId }, data: { votes: { decrement: 1 } } });
      if (existingVote.pollOptionId === pollOptionId) {
        return prisma.poll.findUnique({ where: { id: option.pollId }, include: { options: { include: { voters: true } } } });
      }
    }

    await prisma.pollVoter.create({
      data: {
        pollOptionId,
        userId
      }
    });

    await prisma.pollOption.update({
      where: { id: pollOptionId },
      data: { votes: { increment: 1 } }
    });

    return prisma.poll.findUnique({ where: { id: option.pollId }, include: { options: { include: { voters: true } } } });
  }

  async delete(id: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundError('Post');
    if (post.userId !== userId) throw new ForbiddenError('Not authorized to delete this post');
    await prisma.post.delete({ where: { id } });
  }

  async like(postId: string, userId: string) {
    const existing = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
    if (existing) { await prisma.like.delete({ where: { id: existing.id } }); return { liked: false }; }
    await prisma.like.create({ data: { userId, postId } }); return { liked: true };
  }

  async getComments(postId: string) { return prisma.comment.findMany({ where: { postId, parentId: null }, include: { user: { select: { id: true, profile: true } }, replies: { include: { user: { select: { id: true, profile: true } } }, orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' } }); }
  async comment(postId: string, userId: string, content: string) { return prisma.comment.create({ data: { postId, userId, content }, include: { user: { select: { id: true, profile: true } } } }); }
  async getTrending() { const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); return prisma.hashtag.findMany({ where: { posts: { some: { post: { createdAt: { gte: sevenDaysAgo } } } } }, orderBy: { count: 'desc' }, take: 20 }); }
}

export const postService = new PostService();
