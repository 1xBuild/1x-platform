import { Router } from 'express';
import { analystAgent } from '../services/analyst-agent';

const router = Router();

// POST /api/analyst-agent/enable
router.post('/enable', (req, res) => {
  analystAgent.enable();
  res.json({ enabled: true });
});

// POST /api/analyst-agent/disable
router.post('/disable', (req, res) => {
  analystAgent.disable();
  res.json({ enabled: false });
});

// GET /api/analyst-agent/status
router.get('/status', (req, res) => {
  res.json({ enabled: analystAgent.isEnabled() });
});

export default router; 