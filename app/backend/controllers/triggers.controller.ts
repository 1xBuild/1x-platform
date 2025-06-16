import { Request, Response } from 'express';
import { telegramBotManager } from '../services/telegram-bot-manager';

export const enableTelegram = async (req: Request, res: Response) => {
  const { enabled, agentId } = req.body;
  try {
    if (enabled) {
      console.log(
        `[TelegramBotManager] Activation requested for agentId: ${agentId}`,
      );
      await telegramBotManager.start(agentId);
      res.json({ success: true, enabled: true });
    } else {
      console.log(
        `[TelegramBotManager] Deactivation requested for agentId: ${agentId}`,
      );
      telegramBotManager.stop(agentId);
      res.json({ success: true, enabled: false });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const getTelegramStatus = (req: Request, res: Response) => {
  const agentId = req.query.agentId || req.params.agentId || req.body.agentId;

  if (!agentId) {
    res.status(400).json({
      success: false,
      error: 'agentId is required',
    });
    return;
  }

  console.log(`[TelegramBotManager] Checking status for agentId: ${agentId}`);

  res.json({
    enabled: telegramBotManager.isRunning(agentId),
  });
};
