import { Request, Response } from 'express';
import {
  getBotsByAgentId,
  getBotByAgentAndType,
  upsertBot,
  listAllBots,
} from '../database/db';
import { telegramBotManager } from '../services/telegram-bot-manager';

// Get all bots
export const getBots = (req: Request, res: Response) => {
  const bots = listAllBots();
  res.json({ success: true, bots });
};

// Get bot statuses for an agent
export const getBotStatuses = (req: Request, res: Response) => {
  const agentId = req.query.agentId || req.params.agentId;
  if (!agentId) {
    res.status(400).json({ success: false, error: 'agentId is required' });
    return;
  }

  try {
    const bots = getBotsByAgentId(agentId as string);
    const statuses: Record<string, any> = {};

    bots.forEach((bot) => {
      statuses[bot.type] = {
        type: bot.type,
        running: bot.status === 'running',
        lastStarted: bot.last_started,
        lastStopped: bot.last_stopped,
        error: bot.error_message,
      };
    });

    res.json({ success: true, statuses });
    return;
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to get bot statuses',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
    return;
  }
};

// Start a bot
export const startBot = async (req: Request, res: Response) => {
  const { agentId, botType } = req.body;
  if (!agentId || !botType) {
    res.status(400).json({
      success: false,
      error: 'agentId and botType are required',
    });
    return;
  }

  try {
    // Actually start the bot service - let the bot manager handle database updates
    if (botType === 'telegram') {
      await telegramBotManager.start(agentId);
    }

    // Get the actual status from database after bot manager has updated it
    const bot = getBotByAgentAndType(agentId, botType);
    if (!bot) {
      res.status(500).json({
        success: false,
        error: 'Bot status not found after start attempt',
      });
      return;
    }

    const status = {
      type: botType,
      running: bot.status === 'running',
      lastStarted: bot.last_started,
      error: bot.error_message,
    };

    if (bot.status === 'error') {
      res.status(400).json({
        success: false,
        error: bot.error_message || 'Failed to start bot',
        status,
      });
      return;
    }

    res.json({ success: true, status });
    return;
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to start bot',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
    return;
  }
};

// Stop a bot
export const stopBot = async (req: Request, res: Response) => {
  const { agentId, botType } = req.body;
  if (!agentId || !botType) {
    res.status(400).json({
      success: false,
      error: 'agentId and botType are required',
    });
    return;
  }

  try {
    const now = new Date().toISOString();

    // Actually stop the bot service
    if (botType === 'telegram') {
      console.log('Stopping Telegram bot for agent', agentId);
      await telegramBotManager.stop(agentId);
      console.log('Telegram bot stopped for agent', agentId);
    }

    upsertBot({
      agent_id: agentId,
      type: botType,
      status: 'stopped',
      last_stopped: now,
      error_message: undefined,
    });

    const status = {
      type: botType,
      running: false,
      lastStopped: now,
      error: null,
    };

    res.json({ success: true, status });
    return;
  } catch (err) {
    res.status(500).json({
      status: 'error',
      code: 500,
      message: 'Failed to stop bot',
      details: err instanceof Error ? err.message : 'Unknown error',
    });
    return;
  }
};
