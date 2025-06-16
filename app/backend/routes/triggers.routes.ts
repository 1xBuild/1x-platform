import { Router } from 'express';
import {
  enableTelegram,
  getTelegramStatus,
} from '../controllers/triggers.controller';
import { validateTelegramPayload } from '../middlewares/validateTelegramPayload';

const router = Router();

router.post('/telegram', validateTelegramPayload, enableTelegram);
router.get('/telegram', getTelegramStatus);

export default router;
