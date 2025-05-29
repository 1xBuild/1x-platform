import { Router } from 'express';
import { healthController } from '../controllers/health.controller.js';

const router = Router();

/**
 * @route GET /health
 * @description Check system health and dependencies
 * @access Public
 */
router.get('/', healthController.checkHealth);

export default router;
