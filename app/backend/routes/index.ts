import express from 'express';
import agentRoutes from './agent.routes';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import analystAgentRoutes from './analyst-agent.route';

const router = express.Router();

router.use('/agents', agentRoutes);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/analyst-agent', analystAgentRoutes);

export default router; 