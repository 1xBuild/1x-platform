import express from 'express';
import agentRoutes from './agent.routes';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import triggersRoutes from './triggers.routes';

const router = express.Router();

router.use('/agents', agentRoutes);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/triggers', triggersRoutes);

export default router;
