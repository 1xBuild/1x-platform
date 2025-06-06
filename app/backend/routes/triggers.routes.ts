import express from 'express';
import {
  enableTelegram,
  getTelegramStatus,
} from '../controllers/triggers.controller';
const router = express.Router();

router.post('/telegram', enableTelegram);
router.get('/telegram', getTelegramStatus);

export default router;
