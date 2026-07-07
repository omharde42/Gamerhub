import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { subscriptionService } from '../services/subscription.service';
export class SubscriptionController {
  async createCheckoutSession(req: AuthRequest, res: Response, next: NextFunction) { try { const { tier } = req.body; const result = await subscriptionService.createCheckoutSession(req.user!.userId, tier); res.json({ success: true, data: result }); } catch (error) { next(error); } }
  async handleWebhook(req: AuthRequest, res: Response, next: NextFunction) { try { const sig = req.headers['stripe-signature'] as string; const event = require('stripe')(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET); await subscriptionService.handleWebhook(event); res.json({ received: true }); } catch (error) { next(error); } }
  async getSubscription(req: AuthRequest, res: Response, next: NextFunction) { try { const sub = await subscriptionService.getUserSubscription(req.user!.userId); res.json({ success: true, data: sub }); } catch (error) { next(error); } }
  async cancelSubscription(req: AuthRequest, res: Response, next: NextFunction) { try { await subscriptionService.cancelSubscription(req.user!.userId); res.json({ success: true, message: 'Subscription will be cancelled at period end' }); } catch (error) { next(error); } }
}
export const subscriptionController = new SubscriptionController();
