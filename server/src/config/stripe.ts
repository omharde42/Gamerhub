import Stripe from 'stripe';
import { config } from './index';

function createStripe() {
  if (!config.stripe.secretKey) return null;
  return new Stripe(config.stripe.secretKey, { apiVersion: '2024-11-20.acacia' });
}

export const stripe = createStripe();
export default stripe;
