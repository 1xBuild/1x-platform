import { Router } from 'express';
import {
  getBotStatuses,
  startBot,
  stopBot,
} from '../controllers/bots.controller';

const router = Router();

router.get('/status', getBotStatuses); // Get bot statuses for an agent
router.post('/start', startBot); // Start a bot
router.post('/stop', stopBot); // Stop a bot

export default router;
