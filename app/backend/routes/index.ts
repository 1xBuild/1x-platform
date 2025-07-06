import express from 'express';
import agentRoutes from './agent.routes';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import triggersRoutes from './triggers.routes';
import toolsRoutes from './tools.routes';
import secretsRoutes from './secrets.routes';
import botsRoutes from './bots.routes';
import storageRoutes from './storage.routes';

const router = express.Router();

router.use('/agents', agentRoutes);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/triggers', triggersRoutes);
router.use('/tools', toolsRoutes);
router.use('/secrets', secretsRoutes);
router.use('/bots', botsRoutes);
router.use('/storage', storageRoutes);

export default router;
