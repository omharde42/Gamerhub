import { Response } from 'express';
import { AuthRequest } from '../types';
import { subscriptionService } from '../services/subscription.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import Stripe from 'stripe';
import { config } from '../config';
import { AppError } from '../utils/errors';

export class SubscriptionController {
  createCheckoutSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tier } = req.body;
    const result = await subscriptionService.createCheckoutSession(req.user!.userId, tier);
    sendSuccess(res, result);
  });

  handleWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    if (!config.stripe.secretKey || !config.stripe.webhookSecret) {
      throw new AppError('Stripe is not configured', 503);
    }
    try {
      const stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2025-02-24.acacia' as any });
      const event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
      await subscriptionService.handleWebhook(event);
      res.json({ received: true });
    } catch (error: any) {
      throw new AppError(error?.message || 'Invalid webhook payload', 400);
    }
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
