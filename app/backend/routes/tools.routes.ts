import { Router } from 'express';
import {
  enableCryptoPanic,
  getCryptoPanicStatus,
} from '../controllers/tools.controller';

const router = Router();

router.post('/crypto-panic', enableCryptoPanic);
router.get('/crypto-panic', getCryptoPanicStatus);

export default router;
