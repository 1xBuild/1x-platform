import { Request, Response } from 'express';
import { telegramBotManager } from '../services/telegram-bot-manager';
import { analystAgent } from '../services/analyst-agent';

export const enableTelegram = async (req: Request, res: Response) => {
  const { enabled, agentId } = req.body;
  try {
    if (enabled) {
      await telegramBotManager.start(agentId);
      res.json({ success: true, enabled: true });
    } else {
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

export const getTelegramStatus = async (req: Request, res: Response) => {
  const agentId = req.query.agentId || req.params.agentId || req.body.agentId;

  if (!agentId) {
    res.status(400).json({
      success: false,
      error: 'agentId is required',
    });
    return;
  }

  const enabled = await telegramBotManager.isRunning(agentId);
  res.json({ enabled });
};

export const enableSchedule = async (req: Request, res: Response) => {
  const { enabled, agentId } = req.body;
  try {
    if (enabled) {
      await analystAgent.enable(agentId);
      res.json({ success: true, enabled: true });
    } else {
      await analystAgent.disable(agentId);
      res.json({ success: true, enabled: false });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const getScheduleStatus = async (req: Request, res: Response) => {
  const agentId = req.query.agentId || req.params.agentId || req.body.agentId;

  if (!agentId) {
    res.status(400).json({
      success: false,
      error: 'agentId is required',
    });
    return;
  }

  const enabled = await analystAgent.isEnabled(agentId);
  res.json({ enabled });
};
