import Stripe from 'stripe';
import { config } from './index';

function createStripe() {
  if (!config.stripe.secretKey) return null;
  return new Stripe(config.stripe.secretKey, { apiVersion: '2025-02-24.acacia' as any });
}

export const stripe = createStripe();
export default stripe;
