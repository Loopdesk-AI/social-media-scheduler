import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { AggregatedAnalyticsController } from '../controllers/aggregated-analytics.controller';

const router = Router();
const analyticsController = new AnalyticsController();
const aggregatedAnalyticsController = new AggregatedAnalyticsController();

// Get analytics for a specific integration
router.get('/:integrationId', analyticsController.getAnalytics.bind(analyticsController));

// Get aggregated analytics across multiple integrations
router.get('/aggregated', aggregatedAnalyticsController.getAggregatedAnalytics.bind(aggregatedAnalyticsController));

// Clear analytics cache
router.delete('/cache', analyticsController.clearCache.bind(analyticsController));

export default router;