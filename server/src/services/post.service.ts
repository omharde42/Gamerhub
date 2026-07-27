import prisma from '../config/database';
import { PostType } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class PostService {
  async create(
    data: { content?: string; type?: string; media?: string[]; tags?: string[]; poll?: { question: string; options: string[] } },
    userId: string
  ) {
    const validPostTypes: PostType[] = ['POST', 'ARTICLE', 'VIDEO', 'NEWS', 'POLL'];
    let postType: PostType = 'POST';

    if (data.type && validPostTypes.includes(data.type as PostType)) {
      postType = data.type as PostType;
    } else if (data.type === 'CLIP') {
      postType = 'VIDEO';
    } else if (data.poll) {
      postType = 'POLL';
    } else if (data.media && data.media.length > 0) {
      const hasVideo = data.media.some(m => m.match(/\.(mp4|webm|ogg|mov)$/i) || m.includes('/video/'));
      postType = hasVideo ? 'VIDEO' : 'POST';
    }

    const postContent = (data.content || '').trim();

    const post = await prisma.post.create({
      data: {
        content: postContent,
        type: postType,
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

    if (data.tags && Array.isArray(data.tags)) {
      const uniqueTags = Array.from(new Set(data.tags.map(t => typeof t === 'string' ? t.trim().toLowerCase().replace(/^#/, '') : '').filter(Boolean)));
      for (const tag of uniqueTags) {
        try {
          const hashtag = await prisma.hashtag.upsert({
            where: { name: tag },
            update: { count: { increment: 1 } },
            create: { name: tag, count: 1 }
          });
          await prisma.postHashtag.upsert({
            where: { postId_hashtagId: { postId: post.id, hashtagId: hashtag.id } },
            create: { postId: post.id, hashtagId: hashtag.id },
            update: {}
          });
        } catch (tagErr) {
          console.warn('Hashtag processing warning:', tagErr);
        }
      }
    }
    return post;
  }

  async list(params: { page?: number; limit?: number; hashtag?: string; userId?: string; following?: string }) {
    const { page = 1, limit = 20, hashtag, userId, following } = params;
    const where: Record<string, unknown> = { isPublished: true };
    if (hashtag) where.hashtags = { some: { hashtag: { name: hashtag.toLowerCase() } } };
    if (userId) where.userId = userId;
    if (following) {
      const follows = await prisma.follow.findMany({ where: { followerId: following }, select: { followingId: true } });
      where.userId = { in: [...follows.map((f) => f.followingId), following] };
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
