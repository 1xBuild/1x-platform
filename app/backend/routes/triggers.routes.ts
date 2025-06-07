import { Router } from 'express';
import {
  enableTelegram,
  getTelegramStatus,
  getScheduleTrigger,
  upsertScheduleTrigger,
  getAllScheduleTriggers,
  deleteScheduleTrigger,
} from '../controllers/triggers.controller';
import { validateTelegramPayload } from '../middlewares/validateTelegramPayload';

const router = Router();

router.post('/telegram', validateTelegramPayload, enableTelegram);
router.get('/telegram', getTelegramStatus);

router.get('/schedule', getScheduleTrigger);
router.post('/schedule', upsertScheduleTrigger);
router.get('/schedule/all', getAllScheduleTriggers);
router.delete('/schedule', deleteScheduleTrigger);

export default router;
