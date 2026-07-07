import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';
const router = Router();
router.get('/', authenticate, subscriptionController.getSubscription.bind(subscriptionController));
router.post('/create-checkout-session', authenticate, subscriptionController.createCheckoutSession.bind(subscriptionController));
router.post('/webhook', subscriptionController.handleWebhook.bind(subscriptionController));
router.post('/cancel', authenticate, subscriptionController.cancelSubscription.bind(subscriptionController));
export default router;
