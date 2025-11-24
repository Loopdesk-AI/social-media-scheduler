import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();
const controller = new WebhookController();

// Facebook Webhooks
router.get('/facebook', controller.verifyFacebookWebhook.bind(controller));
router.post('/facebook', controller.handleFacebookWebhook.bind(controller));

// LinkedIn Webhooks
router.post('/linkedin', controller.handleLinkedInWebhook.bind(controller));

// Twitter Webhooks
router.get('/twitter', controller.verifyTwitterWebhook.bind(controller));
router.post('/twitter', controller.handleTwitterWebhook.bind(controller));

export { router as webhookRoutes };
