import Stripe from 'stripe';
import { config } from './index';
export const stripe = new Stripe(config.stripe.secretKey, { apiVersion: '2024-11-20.acacia' });
export default stripe;
