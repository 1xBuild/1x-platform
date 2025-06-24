import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { ensureOwnership } from '../middlewares/ensureOwnership';
import {
  deleteUserSecretController,
  getUserSecretsController,
  resolveSecretsController,
  setUserSecretController,
} from '../controllers/secrets.controller';

const router = Router();

// All endpoints below this line require the caller to be authenticated
// and to operate only on their own resources.
router.use(requireAuth, ensureOwnership);

// Secret management endpoints
router.get('/', getUserSecretsController); // Get all secret keys for a user
router.post('/', setUserSecretController); // Set a secret
router.delete('/', deleteUserSecretController); // Delete a secret
router.post('/resolve', resolveSecretsController); // Resolve a secret

export default router;
