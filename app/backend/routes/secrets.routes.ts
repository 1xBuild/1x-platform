import { Router } from 'express';
import {
  deleteUserSecretController,
  getUserSecretsController,
  resolveSecretsController,
  setUserSecretController,
} from '../controllers/secrets.controller';

const router = Router();

// Secret management endpoints
router.get('/', getUserSecretsController); // Get all secret keys for a user
router.post('/', setUserSecretController); // Set a secret
router.delete('/', deleteUserSecretController); // Delete a secret
router.post('/resolve', resolveSecretsController); // Resolve a secret

export default router;
