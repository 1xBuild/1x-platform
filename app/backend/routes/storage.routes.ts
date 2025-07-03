import { Router } from 'express';
import {
  list,
  get,
  create,
  createJSON,
  deleteFile,
  getLighthouseJwt,
} from '../controllers/storage.controller';
import multer from 'multer';

const upload = multer();
const router = Router();

router.get('/', list);
router.get('/:id', get);
router.post('/', upload.single('file'), create);
router.post('/json', createJSON);
router.delete('/:id', deleteFile);
router.post('/jwt', getLighthouseJwt);

export default router;
