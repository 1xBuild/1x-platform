import { Router } from 'express';
import {
  getTriggers,
  getTrigger,
  upsertTriggerController,
  deleteTriggerController,
  getAllTriggers,
} from '../controllers/triggers.controller';

const router = Router();

router.get('/all', getAllTriggers); // List all triggers (admin/debug)
router.get('/', getTriggers); // List all triggers for an agent (by agentId)
router.get('/:id', getTrigger); // Get a single trigger by id
router.post('/', upsertTriggerController); // Create or update a trigger
router.delete('/', deleteTriggerController); // Delete a trigger by id

export default router;
