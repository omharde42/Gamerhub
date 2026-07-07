import prisma from '../config/database';
import stripe from '../config/stripe';
const PRICE_IDS: Record<string, string> = { PRO: 'price_pro', ELITE: 'price_elite', TEAM_PRO: 'price_team_pro' };
export class SubscriptionService {
  async createCheckoutSession(userId: string, tier: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } }); if (!user) throw new Error('User not found');
    const session = await stripe.checkout.sessions.create({ customer_email: user.email, mode: 'subscription', line_items: [{ price: PRICE_IDS[tier], quantity: 1 }], metadata: { userId, tier }, success_url: `${process.env.FRONTEND_URL}/premium/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${process.env.FRONTEND_URL}/premium` });
    return { url: session.url };
  }
  async handleWebhook(event: any) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object; const userId = session.metadata.userId; const tier = session.metadata.tier;
      await prisma.subscription.upsert({ where: { userId }, update: { tier: tier as any, stripeId: session.id, status: 'ACTIVE', currentPeriodStart: new Date(session.current_period_start * 1000), currentPeriodEnd: new Date(session.current_period_end * 1000) }, create: { userId, tier: tier as any, stripeId: session.id, status: 'ACTIVE', currentPeriodStart: new Date(session.current_period_start * 1000), currentPeriodEnd: new Date(session.current_period_end * 1000) } });
    }
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object; const userId = subscription.metadata.userId;
      await prisma.subscription.update({ where: { userId }, data: { status: subscription.status === 'active' ? 'ACTIVE' : 'CANCELLED', cancelAtPeriodEnd: subscription.cancel_at_period_end, currentPeriodEnd: new Date(subscription.current_period_end * 1000) } });
    }
  }
  async getUserSubscription(userId: string) { return prisma.subscription.findUnique({ where: { userId } }); }
  async cancelSubscription(userId: string) {
    const sub = await prisma.subscription.findUnique({ where: { userId } }); if (!sub?.stripeId) throw new Error('No active subscription');
    await stripe.subscriptions.update(sub.stripeId, { cancel_at_period_end: true }); await prisma.subscription.update({ where: { userId }, data: { cancelAtPeriodEnd: true } });
  }
}
export const subscriptionService = new SubscriptionService();
