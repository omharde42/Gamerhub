import prisma from '../config/database';
import Stripe from 'stripe';
import { config } from '../config';
import { AppError, NotFoundError, ValidationError } from '../utils/errors';

let stripe: Stripe | null = null;
if (config.stripe.secretKey) {
  stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2025-02-24.acacia' as any });
}

const PRICE_IDS: Record<string, string> = {
  PRO: 'price_pro',
  ELITE: 'price_elite',
  TEAM_PRO: 'price_team_pro',
};

export class SubscriptionService {
  async createCheckoutSession(userId: string, tier: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');
    if (!PRICE_IDS[tier]) throw new ValidationError({ tier: ['Invalid subscription tier'] });
    if (!stripe) throw new AppError('Stripe is not configured', 503);
    try {
      const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        mode: 'subscription',
        line_items: [{ price: PRICE_IDS[tier], quantity: 1 }],
        metadata: { userId, tier },
        success_url: `${config.frontendUrl}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.frontendUrl}/premium`,
      });
      return { url: session.url };
    } catch (error: any) {
      throw new AppError(error?.message || 'Failed to create checkout session', 502);
    }
  }

  async handleWebhook(event: any) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const tier = session.metadata.tier;
      await prisma.subscription.upsert({
        where: { userId },
        update: {
          tier: tier as any,
          stripeId: session.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(session.current_period_start * 1000),
          currentPeriodEnd: new Date(session.current_period_end * 1000),
        },
        create: {
          userId,
          tier: tier as any,
          stripeId: session.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(session.current_period_start * 1000),
          currentPeriodEnd: new Date(session.current_period_end * 1000),
        },
      });
    }
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;
      await prisma.subscription.update({
        where: { userId },
        data: {
          status: subscription.status === 'active' ? 'ACTIVE' : 'CANCELLED',
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
    }
  }

  async getUserSubscription(userId: string) {
    return prisma.subscription.findUnique({ where: { userId } });
  }

  async cancelSubscription(userId: string) {
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub?.stripeId) throw new NotFoundError('Active subscription');
    if (!stripe) throw new AppError('Stripe is not configured', 503);
    try {
      await stripe.subscriptions.update(sub.stripeId, { cancel_at_period_end: true });
    } catch (error: any) {
      throw new AppError(error?.message || 'Failed to cancel subscription', 502);
    }
    await prisma.subscription.update({ where: { userId }, data: { cancelAtPeriodEnd: true } });
  }
}

export const subscriptionService = new SubscriptionService();
