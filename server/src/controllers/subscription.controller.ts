import { Response } from 'express';
import { AuthRequest } from '../types';
import { subscriptionService } from '../services/subscription.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import Stripe from 'stripe';

export class SubscriptionController {
  createCheckoutSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tier } = req.body;
    const result = await subscriptionService.createCheckoutSession(req.user!.userId, tier);
    sendSuccess(res, result);
  });

  handleWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-02-24.acacia' as any });
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    await subscriptionService.handleWebhook(event);
    res.json({ received: true });
  });

  getSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
    const sub = await subscriptionService.getUserSubscription(req.user!.userId);
    sendSuccess(res, sub);
  });

  cancelSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
    await subscriptionService.cancelSubscription(req.user!.userId);
    sendSuccess(res, null, 'Subscription will be cancelled at period end');
  });
}

export const subscriptionController = new SubscriptionController();
