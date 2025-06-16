import { Request, Response } from 'express';
import { telegramBot } from '../services/telegram-bot';

export const enableTelegram = async (req: Request, res: Response) => {
  const { enabled } = req.body;
  try {
    if (enabled) {
      await telegramBot.start();
      res.json({ success: true, enabled: true });
    } else {
      telegramBot.stop();
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
  res.json({ enabled: telegramBot.isRunning() });
};
