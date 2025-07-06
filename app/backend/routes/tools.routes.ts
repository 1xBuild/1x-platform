import { Router } from 'express';
import {
  enableCryptoPanic,
  getCryptoPanicStatus,
  enableOpenFileTool,
  getOpenFileToolStatus,
} from '../controllers/tools.controller';

const router = Router();

router.post('/crypto-panic', enableCryptoPanic);
router.get('/crypto-panic', getCryptoPanicStatus);
router.post('/open-file', enableOpenFileTool);
router.get('/open-file', getOpenFileToolStatus);

export default router;
