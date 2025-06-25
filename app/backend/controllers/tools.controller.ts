import { Request, Response } from 'express';
import { cryptoPanicToolManager } from '../services/crypto-panic-tool-manager';

export const enableCryptoPanic = async (req: Request, res: Response) => {
  const { enabled, agentId } = req.body;
  try {
    if (enabled) {
      console.log(
        `[CryptoPanicToolManager] Activation requested for agentId: ${agentId}`,
      );
      await cryptoPanicToolManager.start(agentId);
      res.json({ success: true, enabled: true });
    } else {
      console.log(
        `[CryptoPanicToolManager] Deactivation requested for agentId: ${agentId}`,
      );
      cryptoPanicToolManager.stop(agentId);
      res.json({ success: true, enabled: false });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const getCryptoPanicStatus = async (req: Request, res: Response) => {
  const agentId = req.query.agentId || req.params.agentId || req.body.agentId;

  if (!agentId) {
    res.status(400).json({
      success: false,
      error: 'agentId is required',
    });
    return;
  }

  console.log(
    `[CryptoPanicToolManager] Checking status for agentId: ${agentId}`,
  );

  const isRunning = await cryptoPanicToolManager.isRunning(agentId);

  res.json({
    enabled: isRunning,
  });
};
