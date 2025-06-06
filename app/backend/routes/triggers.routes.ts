import { Router } from 'express';
import {
  enableTelegram,
  getTelegramStatus,
  enableSchedule,
  getScheduleStatus,
} from '../controllers/triggers.controller';
import { validateTelegramPayload } from '../middlewares/validateTelegramPayload';
import { validateSchedulePayload } from '../middlewares/validateSchedulePayload';

const router = Router();

router.post('/telegram', validateTelegramPayload, enableTelegram);
router.get('/telegram', getTelegramStatus);
router.post('/schedule', validateSchedulePayload, enableSchedule);
router.get('/schedule', getScheduleStatus);

export default router;
